import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LlmUsageRow {
  id: string;
  user_id: string;
  function_name: string;
  model: string | null;
  operation: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  credits_charged: number;
  status: string;
  created_at: string;
}

export interface LlmUsageSummary {
  totalCalls: number;
  totalTokens: number;
  totalCreditsCharged: number;
  byFunction: { function_name: string; calls: number; tokens: number }[];
}

/**
 * Reads the user's LLM usage from `llm_usage`. RLS guarantees a regular user
 * only sees their own rows, while an admin sees everyone's.
 */
export const useLlmCredits = (limit = 100) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<LlmUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('llm_usage')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (err) throw err;
      setRows((data ?? []) as LlmUsageRow[]);
    } catch (e) {
      console.error('Error fetching llm_usage:', e);
      setError('Impossible de charger l\'usage IA');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const summary: LlmUsageSummary = (() => {
    const byFn = new Map<string, { calls: number; tokens: number }>();
    let totalCalls = 0;
    let totalTokens = 0;
    let totalCreditsCharged = 0;
    for (const r of rows) {
      totalCalls += 1;
      totalTokens += r.total_tokens ?? 0;
      totalCreditsCharged += r.credits_charged ?? 0;
      const cur = byFn.get(r.function_name) ?? { calls: 0, tokens: 0 };
      cur.calls += 1;
      cur.tokens += r.total_tokens ?? 0;
      byFn.set(r.function_name, cur);
    }
    return {
      totalCalls,
      totalTokens,
      totalCreditsCharged,
      byFunction: [...byFn.entries()]
        .map(([function_name, v]) => ({ function_name, ...v }))
        .sort((a, b) => b.calls - a.calls),
    };
  })();

  return { rows, summary, loading, error, refetch: fetchUsage };
};
