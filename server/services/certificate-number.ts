import crypto from "node:crypto";

const CERTIFICATE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CERTIFICATE_PATTERN = /^JZ-[0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function randomGroup(size = 4) {
  const bytes = crypto.randomBytes(size);
  return [...bytes]
    .map((byte) => CERTIFICATE_ALPHABET[byte % CERTIFICATE_ALPHABET.length])
    .join("");
}

export function generateCertificateNumber(date = new Date()) {
  return `JZ-${date.getUTCFullYear()}-${randomGroup()}-${randomGroup()}-${randomGroup()}`;
}

export function normalizeCertificateNumber(value: string) {
  const compact = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^JZ([0-9]{4})([A-Z0-9]{4})([A-Z0-9]{4})([A-Z0-9]{4})$/);
  return match ? `JZ-${match[1]}-${match[2]}-${match[3]}-${match[4]}` : null;
}

export function isCertificateNumber(value: string) {
  return CERTIFICATE_PATTERN.test(value);
}
