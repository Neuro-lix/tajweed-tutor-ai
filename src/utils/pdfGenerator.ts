import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { SURAHS } from '@/data/quranData';

interface CertificateData {
  userName: string;
  surahNumber: number;
  qiraat: string;
  averageScore: number;
  completedAt: Date;
  certificateId?: string;
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

// Draw Islamic geometric border pattern
const drawIslamicBorder = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
  const margin = 8;
  const borderWidth = 3;
  
  // Outer gold border
  doc.setDrawColor(184, 134, 11); // Dark golden
  doc.setLineWidth(borderWidth);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
  
  // Inner decorative border
  doc.setDrawColor(34, 139, 34); // Forest green
  doc.setLineWidth(1.5);
  doc.rect(margin + 5, margin + 5, pageWidth - margin * 2 - 10, pageHeight - margin * 2 - 10);
  
  // Corner decorations - 8-point Islamic stars
  const cornerPositions = [
    { x: margin + 5, y: margin + 5 },
    { x: pageWidth - margin - 5, y: margin + 5 },
    { x: margin + 5, y: pageHeight - margin - 5 },
    { x: pageWidth - margin - 5, y: pageHeight - margin - 5 },
  ];
  
  cornerPositions.forEach(({ x, y }) => {
    // Draw 8-point star
    doc.setFillColor(184, 134, 11);
    doc.circle(x, y, 6, 'F');
    doc.setFillColor(34, 139, 34);
    doc.circle(x, y, 4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(x, y, 2, 'F');
  });
  
  // Top and bottom decorative patterns
  const patternY = [margin + 20, pageHeight - margin - 20];
  patternY.forEach((y) => {
    for (let i = 0; i < 5; i++) {
      const x = pageWidth / 2 - 40 + i * 20;
      doc.setFillColor(184, 134, 11);
      doc.circle(x, y, 3, 'F');
    }
  });
};

// Draw ornamental divider
const drawOrnamentalDivider = (doc: jsPDF, y: number, pageWidth: number) => {
  const centerX = pageWidth / 2;
  
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.5);
  
  // Center diamond
  doc.setFillColor(34, 139, 34);
  const size = 4;
  doc.line(centerX - size, y, centerX, y - size);
  doc.line(centerX, y - size, centerX + size, y);
  doc.line(centerX + size, y, centerX, y + size);
  doc.line(centerX, y + size, centerX - size, y);
  
  // Side lines
  doc.line(centerX - 60, y, centerX - size - 5, y);
  doc.line(centerX + size + 5, y, centerX + 60, y);
  
  // Side dots
  [-50, -40, 40, 50].forEach((offset) => {
    doc.setFillColor(184, 134, 11);
    doc.circle(centerX + offset, y, 1.5, 'F');
  });
};

// Generate QR code as data URL
const generateQRCode = async (data: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(data, {
      width: 80,
      margin: 1,
      color: {
        dark: '#1a5f1a',
        light: '#ffffff',
      },
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return '';
  }
};

// Generate PDF certificate for surah mastery
export const generateCertificatePDF = async (data: CertificateData): Promise<void> => {
  const surah = SURAHS.find((s) => s.id === data.surahNumber);
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background with subtle gradient effect
  doc.setFillColor(252, 251, 248);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Add subtle texture pattern
  for (let i = 0; i < 20; i++) {
    doc.setFillColor(248, 245, 240);
    doc.circle(Math.random() * pageWidth, Math.random() * pageHeight, 15, 'F');
  }

  // Draw Islamic border
  drawIslamicBorder(doc, pageWidth, pageHeight);

  // Header - Bismillah
  doc.setFontSize(16);
  doc.setTextColor(34, 139, 34);
  doc.text('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', pageWidth / 2, 35, { align: 'center' });

  // Title ornament
  drawOrnamentalDivider(doc, 45, pageWidth);

  // Certificate title
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('CERTIFICAT DE MAÎTRISE', pageWidth / 2, 55, { align: 'center' });

  // Arabic calligraphy title
  doc.setFontSize(28);
  doc.setTextColor(34, 139, 34);
  doc.text('شَهَادَةُ إِتْقَانٍ', pageWidth / 2, 68, { align: 'center' });

  // Surah name in Arabic
  doc.setFontSize(24);
  doc.setTextColor(30, 30, 30);
  doc.text(surah?.name || '', pageWidth / 2, 85, { align: 'center' });

  // Surah transliteration
  doc.setFontSize(18);
  doc.setTextColor(80, 80, 80);
  doc.text(`Sourate ${surah?.transliteration || surah?.id}`, pageWidth / 2, 95, { align: 'center' });

  // Divider
  drawOrnamentalDivider(doc, 105, pageWidth);

  // Certificate text
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text('Ce certificat atteste que', pageWidth / 2, 118, { align: 'center' });

  // User name with decorative underline
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text(data.userName, pageWidth / 2, 130, { align: 'center' });
  
  // Decorative underline
  const nameWidth = doc.getTextWidth(data.userName);
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - nameWidth / 2 - 10, 133, pageWidth / 2 + nameWidth / 2 + 10, 133);

  // Achievement text
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const achievementText = `a maîtrisé la récitation de la sourate ${surah?.transliteration}`;
  doc.text(achievementText, pageWidth / 2, 143, { align: 'center' });
  doc.text(`avec un score moyen de ${data.averageScore.toFixed(0)}%`, pageWidth / 2, 150, { align: 'center' });

  // Qiraat badge
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Lecture: ${QIRAAT_NAMES[data.qiraat] || data.qiraat}`, pageWidth / 2, 160, { align: 'center' });

  // Score badge with gradient effect
  doc.setFillColor(34, 139, 34);
  doc.roundedRect(pageWidth / 2 - 22, 165, 44, 22, 4, 4, 'F');
  doc.setFillColor(40, 160, 40);
  doc.roundedRect(pageWidth / 2 - 20, 167, 40, 18, 3, 3, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.averageScore.toFixed(0)}%`, pageWidth / 2, 179, { align: 'center' });

  // Generate certificate ID for verification
  const certificateId = data.certificateId || `QTC-${Date.now().toString(36).toUpperCase()}`;
  const verificationUrl = `https://quran-tajwid.app/verify/${certificateId}`;

  // QR Code for verification
  const qrDataUrl = await generateQRCode(verificationUrl);
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 20, pageHeight - 55, 25, 25);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Scanner pour', 32.5, pageHeight - 26, { align: 'center' });
    doc.text('vérifier', 32.5, pageHeight - 22, { align: 'center' });
  }

  // Digital signature area
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Signature numérique', pageWidth - 50, pageHeight - 45, { align: 'center' });
  
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.5);
  doc.line(pageWidth - 75, pageHeight - 40, pageWidth - 25, pageHeight - 40);
  
  doc.setFontSize(8);
  doc.setTextColor(34, 139, 34);
  doc.text('Quran Tajwīd Coach', pageWidth - 50, pageHeight - 35, { align: 'center' });
  doc.text('Certifié par IA', pageWidth - 50, pageHeight - 30, { align: 'center' });

  // Date and certificate ID
  const formattedDate = data.completedAt.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Délivré le ${formattedDate}`, pageWidth / 2, pageHeight - 35, { align: 'center' });
  doc.setFontSize(7);
  doc.text(`ID: ${certificateId}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Quran Tajwīd Coach - Apprentissage du Coran avec IA', pageWidth / 2, pageHeight - 15, { align: 'center' });

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

  // Header with gradient effect
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFillColor(40, 160, 40);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('Rapport de Récitation', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`${surah?.transliteration || 'Sourate'} - Verset ${data.verseNumber}`, pageWidth / 2, 28, { align: 'center' });

  yPos = 50;

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

  // Score box with gradient
  const scoreColor = data.score >= 90 ? [34, 139, 34] : data.score >= 70 ? [245, 158, 11] : [220, 38, 38];
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(pageWidth - 48, yPos - 10, 35, 18, 4, 4, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${data.score}%`, pageWidth - 30, yPos + 2, { align: 'center' });

  yPos += 20;

  // Status badge
  doc.setFontSize(12);
  if (data.isCorrect) {
    doc.setTextColor(34, 139, 34);
    doc.text('✓ Excellent - Maîtrisé', 15, yPos);
  } else {
    doc.setTextColor(245, 158, 11);
    doc.text('⚠ À revoir', 15, yPos);
  }

  yPos += 15;

  // Text comparison section
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, yPos - 5, pageWidth - 20, 50, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('Comparaison des textes', 15, yPos + 3);
  yPos += 10;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Texte attendu:', 15, yPos);
  yPos += 5;

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const expectedLines = doc.splitTextToSize(data.expectedText, pageWidth - 35);
  doc.text(expectedLines, 15, yPos);
  yPos += expectedLines.length * 5 + 8;

  if (data.transcribedText) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Transcription:', 15, yPos);
    yPos += 5;

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    const transcribedLines = doc.splitTextToSize(data.transcribedText, pageWidth - 35);
    doc.text(transcribedLines, 15, yPos);
    yPos += transcribedLines.length * 5 + 10;
  } else {
    yPos += 15;
  }

  // Priority fixes
  if (data.priorityFixes.length > 0) {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(10, yPos - 3, pageWidth - 20, data.priorityFixes.length * 12 + 18, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setTextColor(34, 139, 34);
    doc.text('🎯 Priorités à corriger', 15, yPos + 5);
    yPos += 12;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    data.priorityFixes.forEach((fix, i) => {
      const fixLines = doc.splitTextToSize(`${i + 1}. ${fix}`, pageWidth - 40);
      doc.text(fixLines, 20, yPos);
      yPos += fixLines.length * 5 + 4;
    });
    yPos += 8;
  }

  // Errors section
  if (data.errors.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(220, 38, 38);
    doc.text(`⚠ Erreurs détectées (${data.errors.length})`, 15, yPos);
    yPos += 10;

    data.errors.forEach((error) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }

      // Error box with severity color
      const severityColor =
        error.severity === 'critical'
          ? [254, 226, 226]
          : error.severity === 'major'
          ? [254, 243, 199]
          : [241, 245, 249];
      doc.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
      doc.roundedRect(10, yPos - 2, pageWidth - 20, 28, 2, 2, 'F');

      // Severity indicator
      const severityTextColor =
        error.severity === 'critical' ? [185, 28, 28] : error.severity === 'major' ? [146, 64, 14] : [71, 85, 105];
      doc.setFontSize(8);
      doc.setTextColor(severityTextColor[0], severityTextColor[1], severityTextColor[2]);
      doc.text(error.severity.toUpperCase(), pageWidth - 25, yPos + 4);

      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text(`${error.word} - ${error.ruleType}`, 15, yPos + 6);

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const descLines = doc.splitTextToSize(error.ruleDescription, pageWidth - 45);
      doc.text(descLines, 15, yPos + 13);

      if (error.correction) {
        doc.setTextColor(34, 139, 34);
        doc.text(`✓ ${error.correction}`, 15, yPos + 21);
      }

      yPos += 32;
    });
  }

  // Feedback section
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  yPos += 5;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, yPos - 3, pageWidth - 20, 35, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('💬 Commentaire général', 15, yPos + 5);
  yPos += 12;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const feedbackLines = doc.splitTextToSize(data.feedback, pageWidth - 35);
  doc.text(feedbackLines, 15, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Quran Tajwīd Coach - Rapport généré automatiquement', pageWidth / 2, 290, { align: 'center' });

  // Save
  doc.save(`rapport-${surah?.transliteration || surah?.id}-v${data.verseNumber}.pdf`);
};
