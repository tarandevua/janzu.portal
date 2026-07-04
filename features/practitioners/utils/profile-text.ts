export function stripRichTextHtml(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(?:p|div)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
