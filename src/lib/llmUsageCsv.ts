import type { LlmUsageRow } from '@/hooks/useLlmCredits';

const CSV_HEADERS: { key: keyof LlmUsageRow; label: string }[] = [
  { key: 'created_at', label: 'Date' },
  { key: 'function_name', label: 'Fonction' },
  { key: 'model', label: 'Modèle' },
  { key: 'operation', label: 'Opération' },
  { key: 'prompt_tokens', label: 'Tokens prompt' },
  { key: 'completion_tokens', label: 'Tokens complétion' },
  { key: 'total_tokens', label: 'Tokens total' },
  { key: 'credits_charged', label: 'Crédits débités' },
  { key: 'status', label: 'Statut' },
];

const escapeCell = (value: unknown): string => {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};

/** Build a CSV string from llm_usage rows (rows are already RLS-scoped). */
export const buildLlmUsageCsv = (rows: LlmUsageRow[]): string => {
  const header = CSV_HEADERS.map((h) => h.label).join(',');
  const lines = rows.map((r) =>
    CSV_HEADERS.map((h) => escapeCell(r[h.key])).join(','),
  );
  return [header, ...lines].join('\n');
};

/** Trigger a client-side download of the given llm_usage rows as CSV. */
export const downloadLlmUsageCsv = (rows: LlmUsageRow[], filename?: string): void => {
  const csv = buildLlmUsageCsv(rows);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `llm-usage-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
