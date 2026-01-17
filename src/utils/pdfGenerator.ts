import jsPDF from 'jspdf';
import { SURAHS } from '@/data/quranData';

interface CertificateData {
  userName: string;
  surahNumber: number;
  qiraat: string;
  averageScore: number;
  completedAt: Date;
}

interface ReportData {
  userName?: string;
  surahNumber: number;
  verseNumber: number;
  score: number;
  isCorrect: boolean;
  feedback: string;
  priorityFixes: string[];
  errors: Array<{
    word: string;
    ruleType: string;
    ruleDescription: string;
    severity: string;
    correction?: string;
  }>;
  transcribedText?: string | null;
  expectedText: string;
  date: Date;
}

const QIRAAT_NAMES: Record<string, string> = {
  hafs_asim: 'Ḥafṣ ʿan ʿĀṣim',
  warsh_nafi: 'Warsh ʿan Nāfiʿ',
  qalun_nafi: 'Qālūn ʿan Nāfiʿ',
  duri_amr: 'Ad-Dūrī ʿan Abī ʿAmr',
  susi_amr: 'As-Sūsī ʿan Abī ʿAmr',
  ibn_kathir: 'Ibn Kathīr',
  ibn_amir: 'Ibn ʿĀmir',
  shuaba_asim: 'Shuʿba ʿan ʿĀṣim',
  khalaf: 'Khalaf',
  khallad: 'Khallād',
};

// Generate PDF certificate for surah mastery
export const generateCertificatePDF = (data: CertificateData): void => {
  const surah = SURAHS.find((s) => s.id === data.surahNumber);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background gradient effect (using rectangles)
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Border design
  doc.setDrawColor(34, 139, 34);
  doc.setLineWidth(3);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  doc.setLineWidth(1);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Decorative corners
  const cornerSize = 15;
  doc.setFillColor(34, 139, 34);
  
  // Top corners ornaments (simplified 8-point star effect)
  [20, pageWidth - 35].forEach((x) => {
    doc.circle(x + cornerSize / 2, 20 + cornerSize / 2, cornerSize / 3, 'F');
  });
  
  // Bottom corners ornaments
  [20, pageWidth - 35].forEach((x) => {
    doc.circle(x + cornerSize / 2, pageHeight - 25, cornerSize / 3, 'F');
  });

  // Title
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('CERTIFICAT DE MAÎTRISE', pageWidth / 2, 40, { align: 'center' });

  // Main title
  doc.setFontSize(32);
  doc.setTextColor(34, 139, 34);
  doc.text('شهادة إتقان', pageWidth / 2, 55, { align: 'center' });

  // Surah name
  doc.setFontSize(24);
  doc.setTextColor(30, 30, 30);
  doc.text(`Sourate ${surah?.transliteration || surah?.id}`, pageWidth / 2, 75, { align: 'center' });

  // Arabic surah name
  doc.setFontSize(28);
  doc.text(surah?.name || '', pageWidth / 2, 90, { align: 'center' });

  // Certificate text
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Ce certificat atteste que', pageWidth / 2, 110, { align: 'center' });

  // User name
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text(data.userName, pageWidth / 2, 125, { align: 'center' });

  // Achievement text
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  const achievementText = `a maîtrisé la récitation de la sourate ${surah?.transliteration} avec un score moyen de ${data.averageScore.toFixed(0)}%`;
  doc.text(achievementText, pageWidth / 2, 140, { align: 'center' });

  // Qiraat
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`Lecture: ${QIRAAT_NAMES[data.qiraat] || data.qiraat}`, pageWidth / 2, 150, { align: 'center' });

  // Score badge
  doc.setFillColor(34, 139, 34);
  doc.roundedRect(pageWidth / 2 - 20, 158, 40, 20, 5, 5, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.averageScore.toFixed(0)}%`, pageWidth / 2, 171, { align: 'center' });

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const formattedDate = data.completedAt.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Délivré le ${formattedDate}`, pageWidth / 2, 190, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Quran Learn - Apprentissage du Coran avec IA', pageWidth / 2, pageHeight - 15, { align: 'center' });

  // Save
  doc.save(`certificat-${surah?.transliteration || surah?.id}-${data.userName}.pdf`);
};

// Generate PDF report for recitation
export const generateReportPDF = (data: ReportData): void => {
  const surah = SURAHS.find((s) => s.id === data.surahNumber);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Rapport de Récitation', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`${surah?.transliteration || 'Sourate'} - Verset ${data.verseNumber}`, pageWidth / 2, 25, {
    align: 'center',
  });

  yPos = 45;

  // Date and score row
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const formattedDate = data.date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Date: ${formattedDate}`, 15, yPos);

  // Score box
  const scoreColor = data.score >= 90 ? [34, 139, 34] : data.score >= 70 ? [245, 158, 11] : [220, 38, 38];
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(pageWidth - 45, yPos - 8, 30, 15, 3, 3, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.score}%`, pageWidth - 30, yPos + 2, { align: 'center' });

  yPos += 20;

  // Status badge
  doc.setFontSize(11);
  if (data.isCorrect) {
    doc.setTextColor(34, 139, 34);
    doc.text('✓ Excellent', 15, yPos);
  } else {
    doc.setTextColor(245, 158, 11);
    doc.text('⚠ À revoir', 15, yPos);
  }

  yPos += 15;

  // Text comparison section
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Comparaison des textes', 15, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Texte attendu:', 15, yPos);
  yPos += 6;

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const expectedLines = doc.splitTextToSize(data.expectedText, pageWidth - 30);
  doc.text(expectedLines, 15, yPos);
  yPos += expectedLines.length * 5 + 8;

  if (data.transcribedText) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Transcription:', 15, yPos);
    yPos += 6;

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    const transcribedLines = doc.splitTextToSize(data.transcribedText, pageWidth - 30);
    doc.text(transcribedLines, 15, yPos);
    yPos += transcribedLines.length * 5 + 10;
  }

  // Priority fixes
  if (data.priorityFixes.length > 0) {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(10, yPos - 3, pageWidth - 20, data.priorityFixes.length * 10 + 15, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setTextColor(34, 139, 34);
    doc.text('Priorités à corriger', 15, yPos + 5);
    yPos += 12;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    data.priorityFixes.forEach((fix, i) => {
      const fixLines = doc.splitTextToSize(`${i + 1}. ${fix}`, pageWidth - 40);
      doc.text(fixLines, 20, yPos);
      yPos += fixLines.length * 5 + 3;
    });
    yPos += 8;
  }

  // Errors section
  if (data.errors.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.text(`Erreurs détectées (${data.errors.length})`, 15, yPos);
    yPos += 8;

    data.errors.forEach((error) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      // Error box
      const severityColor =
        error.severity === 'critical'
          ? [254, 226, 226]
          : error.severity === 'major'
          ? [254, 243, 199]
          : [241, 245, 249];
      doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.roundedRect(10, yPos - 2, pageWidth - 20, 25, 2, 2, 'F');

      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(`${error.word} - ${error.ruleType}`, 15, yPos + 5);

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(error.ruleDescription, pageWidth - 40);
      doc.text(descLines, 15, yPos + 12);

      if (error.correction) {
        doc.setTextColor(34, 139, 34);
        doc.text(`✓ ${error.correction}`, 15, yPos + 19);
      }

      yPos += 30;
    });
  }

  // Feedback
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  yPos += 5;
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('Commentaire général', 15, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const feedbackLines = doc.splitTextToSize(data.feedback, pageWidth - 30);
  doc.text(feedbackLines, 15, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Quran Learn - Rapport généré automatiquement', pageWidth / 2, 290, { align: 'center' });

  // Save
  doc.save(`rapport-${surah?.transliteration || surah?.id}-v${data.verseNumber}.pdf`);
};
