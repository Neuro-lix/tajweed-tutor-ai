import jsPDF from 'jspdf';
import { QIRAAT_NAMES } from '@/data/quranData';

export interface IjazaPdfData {
  studentName: string;
  sheikhName: string;
  sanad?: string | null;
  riwaya: string;
  scope?: string | null;
  issuedOn?: string | null;
  certificateNumber?: string | null;
}

const GOLD: [number, number, number] = [184, 134, 11];
const GREEN: [number, number, number] = [26, 95, 26];

const border = (doc: jsPDF, w: number, h: number) => {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(2);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setLineWidth(0.5);
  doc.rect(13, 13, w - 26, h - 26);
  [[13, 13], [w - 13, 13], [13, h - 13], [w - 13, h - 13]].forEach(([x, y]) => {
    doc.setFillColor(...GOLD);
    doc.circle(x, y, 2.2, 'F');
  });
};

const divider = (doc: jsPDF, y: number, w: number) => {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(w / 2 - 60, y, w / 2 + 60, y);
  doc.setFillColor(...GOLD);
  doc.circle(w / 2, y, 1.6, 'F');
};

/** Attestation d'ijāza : étudiant, cheikh, chaîne (sanad), riwāya, date, signature. */
export const generateIjazaPDF = (data: IjazaPdfData): void => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(252, 251, 248);
  doc.rect(0, 0, w, h, 'F');
  border(doc, w, h);

  doc.setFontSize(15);
  doc.setTextColor(...GREEN);
  doc.text('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', w / 2, 30, { align: 'center' });
  divider(doc, 38, w);

  doc.setFontSize(11);
  doc.setTextColor(110, 110, 110);
  doc.text("ATTESTATION D'IJĀZA", w / 2, 47, { align: 'center' });
  doc.setFontSize(26);
  doc.setTextColor(...GREEN);
  doc.text('إِجَازَة', w / 2, 60, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text('Délivrée à', w / 2, 74, { align: 'center' });

  doc.setFontSize(21);
  doc.setTextColor(25, 25, 25);
  doc.text(data.studentName, w / 2, 85, { align: 'center' });
  const nw = doc.getTextWidth(data.studentName);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.7);
  doc.line(w / 2 - nw / 2 - 8, 88, w / 2 + nw / 2 + 8, 88);

  doc.setFontSize(11);
  doc.setTextColor(70, 70, 70);
  doc.text(
    `par le Cheikh ${data.sheikhName} — Riwāya : ${QIRAAT_NAMES[data.riwaya] ?? data.riwaya}`,
    w / 2,
    99,
    { align: 'center' },
  );
  if (data.scope) {
    doc.text(data.scope, w / 2, 107, { align: 'center' });
  }

  if (data.sanad) {
    divider(doc, 116, w);
    doc.setFontSize(9.5);
    doc.setTextColor(95, 95, 95);
    doc.text('Chaîne de transmission (sanad) remontant au Prophète ﷺ', w / 2, 124, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(data.sanad, w - 90);
    doc.text(lines.slice(0, 8), w / 2, 131, { align: 'center' });
  }

  // Pied de page : date, numéro, signature, marque
  const footY = h - 34;
  doc.setFontSize(9.5);
  doc.setTextColor(90, 90, 90);
  const issued = data.issuedOn
    ? new Date(data.issuedOn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  doc.text(`Date : ${issued}`, 35, footY);
  if (data.certificateNumber) doc.text(`N° ${data.certificateNumber}`, 35, footY + 6);

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);
  doc.line(w - 105, footY, w - 35, footY);
  doc.setFontSize(9);
  doc.text('Signature du Cheikh', w - 70, footY + 6, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(...GREEN);
  doc.text('Nassihah · TajweedTutorAI', w / 2, h - 18, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "Document déclaré par l'étudiant. TajweedTutorAI n'atteste pas de sa validité : seul un cheikh habilité délivre une ijāza.",
    w / 2,
    h - 12,
    { align: 'center' },
  );

  doc.save(`ijaza-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};
