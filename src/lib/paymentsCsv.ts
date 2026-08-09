export interface PaymentRow {
  id: string;
  createdAt: string;
  amount: number;
  type: string;
  description: string | null;
  provider: string;
}

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
    ['Date', 'Fournisseur', 'Type', 'Description', 'Crédits'].join(','),
    ...rows.map((r) =>
      [
        new Date(r.createdAt).toLocaleString('fr-FR'),
        r.provider,
        r.type,
        r.description ?? '',
        r.amount,
      ]
        .map(escapeCell)
        .join(','),
    ),
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
