/**
 * Ensures file-management links use the Next.js origin (`/api/...` rewrites) so `jwt` is sent.
 * Use for `href` / `src` from the API when DB still has absolute URLs from another host.
 */
export function toSameOriginFileManagementUrl(
  storedUrl: string | undefined | null,
): string {
  if (storedUrl == null) return "";
  const s = String(storedUrl).trim();
  if (!s) return "";
  if (s.startsWith("/api/v1/file-management/")) return s;
  const m = s.match(
    /(\/api\/v1\/file-management\/files\/[^/]+\/(?:view|download))(?:\?[^\s#]*)?/i,
  );
  if (m) return m[1];
  return s;
}
