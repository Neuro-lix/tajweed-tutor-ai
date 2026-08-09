export interface PaymentRow {
  id: string;
  createdAt: string;
  amount: number;
  type: string;
  description: string | null;
  provider: string;
}

/**
 * Références Paddle stockées dans la description par `paddle-webhook`
 * sous la forme `... [txn:txn_123] [achat:12345]`.
 */
export const extractPaddleRefs = (
  description: string | null,
): { transactionId: string; purchaseId: string } => ({
  transactionId: description?.match(/\[txn:([^\]]+)\]/)?.[1] ?? '',
  purchaseId: description?.match(/\[achat:([^\]]+)\]/)?.[1] ?? '',
});

/** Description sans les références techniques, pour l'affichage. */
export const cleanDescription = (description: string | null): string =>
  (description ?? '').replace(/\s*\[(txn|achat):[^\]]+\]/g, '').trim();

/** Infer the payment provider from the transaction description written by the webhooks. */
export const inferProvider = (description: string | null): string => {
  const d = (description ?? '').toLowerCase();
  if (d.includes('paddle') || d.includes('carte')) return 'Paddle';
  if (d.includes('crypto') || d.includes('nowpayments')) return 'Crypto';
  if (d.includes('paypal')) return 'PayPal';
  if (d.includes('bonus') || d.includes('bienvenue')) return 'Bonus';
  return '—';
};

const escapeCell = (v: unknown): string => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export const buildPaymentsCsv = (rows: PaymentRow[]): string => {
  const lines = [
    [
      'Date',
      'Fournisseur',
      'Type',
      'Description',
      'Crédits',
      'N° transaction Paddle',
      'ID achat',
      'ID mouvement (interne)',
    ].join(','),
    ...rows.map((r) => {
      const refs = extractPaddleRefs(r.description);
      return [
        new Date(r.createdAt).toLocaleString('fr-FR'),
        r.provider,
        r.type,
        cleanDescription(r.description),
        r.amount,
        refs.transactionId,
        refs.purchaseId,
        r.id,
      ]
        .map(escapeCell)
        .join(',');
    }),
  ];
  return lines.join('\n');
};

export const downloadPaymentsCsv = (rows: PaymentRow[]): void => {
  const blob = new Blob(['\uFEFF' + buildPaymentsCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `paiements-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
