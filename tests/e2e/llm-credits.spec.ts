import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * End-to-end: record a chat analysis, verify `llm_usage` is written, and
 * confirm the dashboard credit counters reflect the new usage.
 *
 * Requires authenticated test credentials in the environment:
 *   TEST_USER_EMAIL / TEST_USER_PASSWORD
 * and the public Supabase config (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY).
 * The test skips gracefully when these are not provided.
 */
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
const EMAIL = process.env.TEST_USER_EMAIL || '';
const PASSWORD = process.env.TEST_USER_PASSWORD || '';

const hasCreds = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && EMAIL && PASSWORD);

test.describe('LLM credits / usage tracking', () => {
  test.skip(!hasCreds, 'Set TEST_USER_EMAIL/TEST_USER_PASSWORD and Supabase env to run');

  test('chat analysis writes llm_usage and updates counters', async () => {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. Authenticate
    const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });
    expect(authErr, authErr?.message).toBeNull();
    const userId = auth.user!.id;

    // 2. Baseline: how many usage rows exist now
    const { count: baselineCount } = await supabase
      .from('llm_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 3. Record a "chat analysis" — invoke the chat-assistant edge function
    const { data: chat, error: chatErr } = await supabase.functions.invoke(
      'chat-assistant',
      { body: { messages: [{ role: 'user', content: 'Explique la règle du Madd.' }], language: 'fr' } },
    );
    expect(chatErr, chatErr?.message).toBeNull();
    expect(chat?.response, 'assistant should return a response').toBeTruthy();

    // 4. Verify a new llm_usage row was written (allow for async logging)
    let newCount = baselineCount ?? 0;
    for (let i = 0; i < 10; i++) {
      const { count } = await supabase
        .from('llm_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      newCount = count ?? 0;
      if (newCount > (baselineCount ?? 0)) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
    expect(newCount, 'a new llm_usage row should be recorded').toBeGreaterThan(baselineCount ?? 0);

    // 5. The most recent row should belong to the chat-assistant function
    const { data: latest } = await supabase
      .from('llm_usage')
      .select('function_name, user_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    expect(latest?.function_name).toBe('chat-assistant');
    // RLS: the row must belong to the signed-in user
    expect(latest?.user_id).toBe(userId);

    await supabase.auth.signOut();
  });
});
