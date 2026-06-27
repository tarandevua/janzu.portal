export const R2_MEDIA_ROUTE_PREFIX = "/api/media/r2";

function encodeKeyPath(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function getR2MediaUrl(key: string) {
  return `${R2_MEDIA_ROUTE_PREFIX}/${encodeKeyPath(key)}`;
}
