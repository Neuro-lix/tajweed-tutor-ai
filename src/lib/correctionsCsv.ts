import { getSurahName } from '@/lib/progressInsights';
import type { PriorityFix } from '@/lib/progressInsights';

export interface CsvCorrection {
  surahNumber: number;
  verseNumber: number;
  word: string;
  ruleType: string;
  ruleDescription: string;
  correctionExample?: string | null;
  severity?: string | null;
  isResolved?: boolean;
  createdAt?: string;
}

const escapeCell = (value: unknown): string => {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

const row = (cells: unknown[]) => cells.map(escapeCell).join(',');

/**
 * CSV export of the user's corrections + a stats block (per-surah priority,
 * tajwīd rules concerned, resolution rate). Excel-friendly (BOM added on download).
 */
export const buildCorrectionsCsv = (
  corrections: CsvCorrection[],
  fixes: PriorityFix[] = [],
  meta: { userName?: string; qiraat?: string } = {},
): string => {
  const lines: string[] = [];

  lines.push(row(['Export corrections & statistiques']));
  lines.push(row(['Utilisateur', meta.userName ?? '—']));
  lines.push(row(['Lecture (qirāʾa)', meta.qiraat ?? '—']));
  lines.push(row(['Généré le', new Date().toLocaleString('fr-FR')]));
  lines.push('');

  // ── Statistiques globales ──
  const total = corrections.length;
  const resolved = corrections.filter((c) => c.isResolved).length;
  const bySeverity = corrections.reduce<Record<string, number>>((acc, c) => {
    const k = c.severity ?? 'non précisé';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  lines.push(row(['STATISTIQUES']));
  lines.push(row(['Indicateur', 'Valeur']));
  lines.push(row(['Erreurs totales', total]));
  lines.push(row(['Erreurs résolues', resolved]));
  lines.push(row(['Erreurs en attente', total - resolved]));
  lines.push(row(['Taux de résolution', total ? `${Math.round((resolved / total) * 100)}%` : '0%']));
  for (const [sev, count] of Object.entries(bySeverity)) {
    lines.push(row([`Gravité — ${sev}`, count]));
  }
  lines.push('');

  // ── Priorités par sourate ──
  if (fixes.length > 0) {
    lines.push(row(['PRIORITÉS PAR SOURATE']));
    lines.push(row(['Rang', 'Sourate', 'Nom', 'Erreurs', 'Versets', 'Poids gravité', 'Règles tajwīd']));
    fixes.forEach((f, i) => {
      lines.push(
        row([
          i + 1,
          f.surahNumber,
          f.name,
          f.errorCount,
          f.verses.join(' '),
          f.weight,
          f.rules.map((r) => `${r.rule} (${r.count})`).join(' | '),
        ]),
      );
    });
    lines.push('');
  }

  // ── Détail des corrections ──
  lines.push(row(['DÉTAIL DES CORRECTIONS']));
  lines.push(
    row(['Date', 'Sourate', 'Nom sourate', 'Verset', 'Mot', 'Règle', 'Description', 'Exemple correct', 'Gravité', 'Statut']),
  );
  for (const c of corrections) {
    lines.push(
      row([
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : '',
        c.surahNumber,
        getSurahName(c.surahNumber),
        c.verseNumber,
        c.word,
        c.ruleType,
        c.ruleDescription,
        c.correctionExample ?? '',
        c.severity ?? '',
        c.isResolved ? 'Résolue' : 'À corriger',
      ]),
    );
  }

  return lines.join('\n');
};

/** Trigger a client-side download of the corrections CSV. */
export const downloadCorrectionsCsv = (
  corrections: CsvCorrection[],
  fixes: PriorityFix[] = [],
  meta: { userName?: string; qiraat?: string } = {},
): void => {
  const csv = buildCorrectionsCsv(corrections, fixes, meta);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `corrections-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
