import type { StoredRecitation } from '@/hooks/useRecitationStorage';
import { SURAHS } from '@/data/quranData';

const surahName = (n: number) => SURAHS.find((s) => s.id === n)?.transliteration ?? `Sourate ${n}`;

const HEADERS = [
  'Date',
  'Sourate',
  'Verset',
  'Score tajwid (%)',
  'Score prosodie (%)',
  'Erreurs',
  'Durée (s)',
  'Qiraat',
  'Transcription',
];

const escapeCell = (value: unknown): string => {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
};

export const buildRecordingsCsv = (rows: StoredRecitation[]): string => {
  const lines = rows.map((r) =>
    [
      new Date(r.createdAt).toISOString(),
      surahName(r.surahNumber),
      r.verseNumber,
      r.analysisScore ?? '',
      r.envelopeSimilarityScore ?? '',
      r.errorCount ?? '',
      r.durationSeconds != null ? Math.round(r.durationSeconds) : '',
      r.qiraat,
      r.transcription ?? '',
    ]
      .map(escapeCell)
      .join(','),
  );
  return [HEADERS.join(','), ...lines].join('\n');
};

export const downloadRecordingsCsv = (rows: StoredRecitation[], filename?: string): void => {
  const csv = buildRecordingsCsv(rows);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `journal-recitations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
