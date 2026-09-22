import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── CORS: allowlist pilotée par env (pas de wildcard) ───────────────────
const DEFAULT_ALLOWED_ORIGINS = [
  'https://tajweedtutorai.com',
  'https://www.tajweedtutorai.com',
  'https://recite-perfectly-bot.lovable.app',
  'https://id-preview--dd06a156-64f5-407d-bf79-94ef3c169108.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];
const ENV_ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ALLOWLIST = ENV_ALLOWED.length ? ENV_ALLOWED : DEFAULT_ALLOWED_ORIGINS;

function buildCors(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const ok = ALLOWLIST.includes(origin)
    || /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin)
    || /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWLIST[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

const json = (body: unknown, status: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

/** Catalogue serveur : le nombre de crédits ne vient JAMAIS du client. */
const PRICE_TO_CREDITS: Record<string, { credits: number; label: string }> = {
  pri_01kzm74zem2gd72bsd3an0h1vw: { credits: 50, label: 'Pack Starter (50 crédits)' },
  pri_01kzm7exmw1w0apnysd76kgszh: { credits: 150, label: 'Pack Standard (150 crédits)' },
  pri_01kzm7m6rwbdfks53gns8sjq4e: { credits: 400, label: 'Pack Premium (400 crédits)' },
};

const TXN_RE = /^txn_[a-z0-9]+$/i;

Deno.serve(async (req) => {
  const cors = buildCors(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

  try {
    const apiKey = Deno.env.get('PADDLE_API_KEY');
    if (!apiKey) {
      return json(
        { error: 'not_configured', message: 'Le crédit instantané n’est pas encore activé.' },
        503,
        cors,
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401, cors);

    const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authErr } = await anon.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401, cors);

    const body = await req.json().catch(() => ({}));
    const transactionId = String(body?.transactionId ?? '');
    if (!TXN_RE.test(transactionId)) {
      return json({ error: 'Identifiant de transaction invalide' }, 400, cors);
    }

    // Rate limiting : 20 vérifications / 10 min par utilisateur.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: rl } = await admin.rpc('check_and_increment_rate_limit', {
      p_user_id: user.id,
      p_action: 'paddle_verify',
      p_max: 20,
      p_window_seconds: 600,
    });
    if (rl && rl.allowed === false) {
      return json({ error: 'Trop de tentatives, réessaie dans quelques minutes.' }, 429, cors);
    }

    // ── Vérification côté serveur auprès de Paddle ────────────────────────
    const isSandbox = apiKey.startsWith('pdl_sdbx_');
    const base = isSandbox ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com';
    const res = await fetch(`${base}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('[paddle-verify] Paddle API', res.status, await res.text());
      return json({ error: 'Transaction introuvable chez Paddle' }, 404, cors);
    }
    const payload = await res.json();
    const txn = payload?.data;
    if (!txn) return json({ error: 'Transaction introuvable' }, 404, cors);

    if (txn.status !== 'completed' && txn.status !== 'paid') {
      return json({ status: txn.status, credited: false, message: 'Paiement pas encore confirmé.' }, 202, cors);
    }

    // Le paiement doit appartenir à l'utilisateur connecté.
    const ownerId = txn.custom_data?.user_id ?? txn.customData?.user_id ?? null;
    if (ownerId && ownerId !== user.id) {
      return json({ error: 'Cette transaction appartient à un autre compte.' }, 403, cors);
    }

    // Crédits calculés depuis le catalogue serveur uniquement.
    let totalCredits = 0;
    const labels: string[] = [];
    for (const item of txn.items ?? []) {
      const priceId = item?.price?.id ?? item?.price_id;
      const mapping = priceId ? PRICE_TO_CREDITS[priceId] : undefined;
      if (!mapping) continue;
      const qty = Math.max(1, Math.min(Number(item?.quantity ?? 1), 100));
      totalCredits += mapping.credits * qty;
      labels.push(`${mapping.label} ×${qty}`);
    }
    if (totalCredits <= 0) {
      return json({ error: 'Aucun pack de crédits reconnu sur cette transaction.' }, 400, cors);
    }

    // Idempotence : une transaction ne crédite qu'une seule fois,
    // que ce soit par cette vérification ou par le webhook Paddle.
    const { error: dupErr } = await admin
      .from('processed_payment_events')
      .insert({ provider: 'paddle', external_id: transactionId });
    if (dupErr) {
      if (dupErr.code === '23505') {
        return json({ credited: false, alreadyCredited: true, credits: totalCredits }, 200, cors);
      }
      throw dupErr;
    }

    const { data: balance, error: creditErr } = await admin.rpc('add_credits', {
      p_user_id: user.id,
      p_amount: totalCredits,
      p_description: `Paiement Paddle — ${labels.join(', ')}`,
    });
    if (creditErr) {
      // On libère le verrou d'idempotence pour permettre une nouvelle tentative.
      await admin.from('processed_payment_events').delete()
        .eq('provider', 'paddle').eq('external_id', transactionId);
      throw creditErr;
    }

    return json({ credited: true, credits: totalCredits, balance }, 200, cors);
  } catch (e) {
    console.error('[paddle-verify] error', e);
    return json({ error: 'Internal error' }, 500, cors);
  }
});
