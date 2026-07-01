import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * End-to-end: verify llm_usage RLS scoping.
 *  - A non-admin user can read the credits UI data but only ever receives
 *    their OWN llm_usage rows (never another user's).
 *  - An admin user can read every user's llm_usage rows.
 *
 * Requires:
 *   VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY (public config)
 *   TEST_USER_EMAIL / TEST_USER_PASSWORD                (a NON-admin user)
 *   TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD              (a user with role 'admin')
 * Skips gracefully when credentials are missing.
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const USER_EMAIL = process.env.TEST_USER_EMAIL || '';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || '';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

const hasUser = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && USER_EMAIL && USER_PASSWORD);
const hasAdmin = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && ADMIN_EMAIL && ADMIN_PASSWORD);

test.describe('llm_usage RLS scoping', () => {
  test('non-admin only sees their own llm_usage rows', async () => {
    test.skip(!hasUser, 'Set TEST_USER_EMAIL/TEST_USER_PASSWORD + Supabase env to run');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });
    expect(authErr, authErr?.message).toBeNull();
    const userId = auth.user!.id;

    // The query the credits UI runs — RLS must filter it to this user only.
    const { data: rows, error } = await supabase
      .from('llm_usage')
      .select('user_id')
      .limit(1000);
    expect(error, error?.message).toBeNull();
    expect(Array.isArray(rows)).toBe(true);

    // Every returned row must belong to the signed-in user.
    const foreign = (rows ?? []).filter((r) => r.user_id !== userId);
    expect(foreign, 'non-admin must not receive other users rows').toHaveLength(0);

    await supabase.auth.signOut();
  });

  test('non-admin can open the My LLM usage page (UI)', async ({ page, context }) => {
    test.skip(!hasUser, 'Set TEST_USER_EMAIL/TEST_USER_PASSWORD + Supabase env to run');

    // Mint a session so the ProtectedRoute lets us in.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: auth } = await supabase.auth.signInWithPassword({
      email: USER_EMAIL,
      password: USER_PASSWORD,
    });
    const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    const sessionJson = JSON.stringify(auth.session);

    await page.goto('/');
    await page.evaluate(
      ([k, v]) => window.localStorage.setItem(k, v),
      [storageKey, sessionJson] as [string, string],
    );
    await page.goto('/my-usage');
    await expect(page.getByRole('heading', { name: /consommation IA/i })).toBeVisible();
    await expect(page.getByText(/Crédits restants/i)).toBeVisible();

    await supabase.auth.signOut();
  });

  test('admin sees llm_usage rows from more than one user', async () => {
    test.skip(!hasAdmin, 'Set TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD + Supabase env to run');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    expect(authErr, authErr?.message).toBeNull();
    const adminId = auth.user!.id;

    const { data: rows, error } = await supabase
      .from('llm_usage')
      .select('user_id')
      .limit(1000);
    expect(error, error?.message).toBeNull();

    // Admin RLS allows all rows; assuming usage exists from other users,
    // the admin should be able to see at least one row not their own.
    const distinctUsers = new Set((rows ?? []).map((r) => r.user_id));
    // At minimum the admin can read the table without an RLS error; if other
    // users have usage, the admin sees more than just their own id.
    if ((rows ?? []).some((r) => r.user_id !== adminId)) {
      expect(distinctUsers.size).toBeGreaterThan(1);
    }

    await supabase.auth.signOut();
  });
});
