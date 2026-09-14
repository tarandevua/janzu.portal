export function statusToastVariant(status: string | null | undefined) {
  return status && /(invalid|failed|forbidden|error|denied|rejected)$/u.test(status)
    ? "error" as const
    : "success" as const;
}
