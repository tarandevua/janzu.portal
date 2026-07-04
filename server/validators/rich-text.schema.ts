export function sanitizeRichText(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/<(?!\/?(?:p|div|br|strong|b|u|a)(?:\s|>|\/))/gi, "&lt;")
    .replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
      const hrefMatch = attrs.match(/\shref=(?:"([^"]*)"|'([^']*)')/i);
      const href = (hrefMatch?.[1] ?? hrefMatch?.[2] ?? "").trim();

      if (!/^https?:\/\//i.test(href) && !href.startsWith("mailto:")) {
        return "<a>";
      }

      return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">`;
    });
}

export function emptyRichTextToNull(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const textContent = value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  return textContent ? value : null;
}
