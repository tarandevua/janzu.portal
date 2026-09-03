import crypto from "node:crypto";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import QRCode from "qrcode";

export type CertificatePdfInput = {
  officialName: string;
  certificateNumber: string;
  originalCertificationDate: Date;
  documentIssuedAt: Date;
  issuerName: string;
  templateVersion: string;
  verificationUrl: string;
  signatoryOne: { name: string; png: Uint8Array };
  signatoryTwo: { name: string; png: Uint8Array };
  testFixture?: boolean;
};

function formatDate(date: Date, locale: "en" | "es") {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function sha256Bytes(value: Uint8Array) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function generateCertificatePdf(input: CertificatePdfInput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([841.89, 595.28]);
  const width = page.getWidth();
  const height = page.getHeight();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const signatureOne = await pdf.embedPng(input.signatoryOne.png);
  const signatureTwo = await pdf.embedPng(input.signatoryTwo.png);
  const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
  });
  const qrBytes = Uint8Array.from(Buffer.from(qrDataUrl.split(",")[1] ?? "", "base64"));
  const qr = await pdf.embedPng(qrBytes);

  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderWidth: 2, borderColor: rgb(0.08, 0.34, 0.42) });
  page.drawRectangle({ x: 29, y: 29, width: width - 58, height: height - 58, borderWidth: 0.75, borderColor: rgb(0.55, 0.73, 0.73) });

  const centered = (text: string, y: number, size: number, font = regular, color = rgb(0.08, 0.2, 0.24)) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: Math.max(42, (width - textWidth) / 2), y, size, font, color });
  };

  centered(input.issuerName, height - 82, 18, bold);
  centered("CERTIFICADO DE PRACTICANTE JANZU", height - 130, 24, bold, rgb(0.07, 0.39, 0.48));
  centered("CERTIFIED JANZU PRACTITIONER", height - 158, 18, bold, rgb(0.07, 0.39, 0.48));
  centered("Se certifica que / This certifies that", height - 206, 12);
  centered(input.officialName, height - 252, 28, bold, rgb(0.12, 0.12, 0.12));
  centered("ha completado la formación, práctica y evaluación autorizada requerida", height - 286, 11);
  centered("has completed the required authorized training, practice, and assessment", height - 304, 11);

  page.drawText(`Fecha original de certificación / Original certification date: ${formatDate(input.originalCertificationDate, "es")} / ${formatDate(input.originalCertificationDate, "en")}`, {
    x: 70, y: 224, size: 9.5, font: regular, color: rgb(0.18, 0.18, 0.18),
  });
  page.drawText(`Fecha de emisión / Document issue date: ${formatDate(input.documentIssuedAt, "es")} / ${formatDate(input.documentIssuedAt, "en")}`, {
    x: 70, y: 205, size: 9.5, font: regular, color: rgb(0.18, 0.18, 0.18),
  });
  page.drawText(`Número de certificado / Certificate number: ${input.certificateNumber}`, {
    x: 70, y: 186, size: 10, font: bold, color: rgb(0.08, 0.2, 0.24),
  });

  const drawSignature = (image: typeof signatureOne, name: string, x: number) => {
    const dimensions = image.scaleToFit(150, 58);
    page.drawImage(image, { x: x + (150 - dimensions.width) / 2, y: 90, width: dimensions.width, height: dimensions.height });
    page.drawLine({ start: { x, y: 87 }, end: { x: x + 150, y: 87 }, thickness: 0.6, color: rgb(0.25, 0.25, 0.25) });
    const nameWidth = regular.widthOfTextAtSize(name, 9);
    page.drawText(name, { x: x + (150 - nameWidth) / 2, y: 72, size: 9, font: regular });
  };
  drawSignature(signatureOne, input.signatoryOne.name, 105);
  drawSignature(signatureTwo, input.signatoryTwo.name, 315);

  page.drawImage(qr, { x: width - 145, y: 67, width: 72, height: 72 });
  page.drawText("Verificar / Verify", { x: width - 145, y: 53, size: 8, font: regular });
  page.drawText(`Template ${input.templateVersion}`, { x: width - 145, y: 42, size: 6.5, font: regular, color: rgb(0.4, 0.4, 0.4) });

  if (input.testFixture) {
    page.drawText("TEST FIXTURE - NOT VALID", {
      x: 225, y: 320, size: 32, font: bold, color: rgb(0.86, 0.18, 0.18), opacity: 0.28,
      rotate: degrees(15),
    });
  }

  pdf.setTitle(`${input.certificateNumber} - Certified Janzu Practitioner`);
  pdf.setAuthor(input.issuerName);
  pdf.setSubject("Bilingual Janzu Practitioner certificate");
  pdf.setKeywords(["Janzu", "certificate", input.certificateNumber, input.templateVersion]);
  pdf.setCreationDate(input.documentIssuedAt);
  pdf.setModificationDate(input.documentIssuedAt);

  return pdf.save({ useObjectStreams: false });
}
