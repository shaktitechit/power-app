import dotenv from "dotenv";

dotenv.config();

function stripTrailingSlash(url) {
  return String(url || "").replace(/\/$/, "");
}

/**
 * Base URL of the file-management HTTP API including `/api`, e.g. `https://files.example.com/api`
 */
export const FILE_MANAGEMENT_API_URL = stripTrailingSlash(
  process.env.FILE_MANAGEMENT_API_URL || "http://localhost:3001/api",
);

/**
 * Per-user API key (`fm_...`) for server-to-server calls (header `X-Api-Key`).
 */
export const FILE_MANAGEMENT_API_KEY =
  process.env.FILE_MANAGEMENT_API_KEY || "";

/**
 * How browser-facing document links are built (see `buildProxyViewUrl` in `fileManagementUpload.js`).
 * - Path-only `/api/v1/...` when relative (SPA + Next `/api` proxy → same host as `jwt` cookie).
 * - Set `FILE_DOCUMENT_LINKS_RELATIVE=true`, or `API_PUBLIC_BASE_URL=same-origin` / `relative`.
 * - Or set full `API_PUBLIC_BASE_URL=https://...` for absolute links (must match cookie host or use COOKIE_DOMAIN).
 * - In production, defaults to relative if `API_PUBLIC_BASE_URL` is not an explicit http(s) URL.
 */
function resolvePublicBaseForFileLinks() {
  const raw = (process.env.API_PUBLIC_BASE_URL ?? "").trim();

  if (process.env.FILE_DOCUMENT_LINKS_RELATIVE === "true") {
    return { fileLinksRelative: true, base: "" };
  }
  if (/^same-origin$/i.test(raw) || /^relative$/i.test(raw)) {
    return { fileLinksRelative: true, base: "" };
  }
  if (/^https?:\/\//i.test(raw)) {
    return { fileLinksRelative: false, base: stripTrailingSlash(raw) };
  }
  if (process.env.NODE_ENV === "production") {
    return { fileLinksRelative: true, base: "" };
  }
  return {
    fileLinksRelative: false,
    base: stripTrailingSlash("http://localhost:5000"),
  };
}

const _fileLinks = resolvePublicBaseForFileLinks();

export const FILE_DOCUMENT_LINKS_RELATIVE = _fileLinks.fileLinksRelative;

/** Used only when {@link FILE_DOCUMENT_LINKS_RELATIVE} is false. */
export const API_PUBLIC_BASE_URL = _fileLinks.base;

/** Timeout for JSON calls to the file-management API (ms). */
export const FILE_MANAGEMENT_REQUEST_TIMEOUT_MS = Number(
  process.env.FILE_MANAGEMENT_REQUEST_TIMEOUT_MS || 60_000,
);

/** Max time to wait for file processing after upload (ms). */
export const FILE_MANAGEMENT_UPLOAD_MAX_WAIT_MS = Number(
  process.env.FILE_MANAGEMENT_UPLOAD_MAX_WAIT_MS || 1200000,
);

/** Interval when polling file status (ms). */
export const FILE_MANAGEMENT_POLL_INTERVAL_MS = Number(
  process.env.FILE_MANAGEMENT_POLL_INTERVAL_MS || 5000,
);

/**
 * Dev-only: allow HTTPS to object storage (presigned PUT) with self-signed certs.
 * Never enable in production.
 */
export const FILE_MANAGEMENT_PRESIGNED_TLS_INSECURE =
  process.env.FILE_MANAGEMENT_PRESIGNED_TLS_INSECURE === "true";

/**
 * Validate configuration at startup in production.
 */
export function assertFileManagementConfig() {
  if (process.env.NODE_ENV !== "production") return;

  if (!FILE_MANAGEMENT_API_KEY) {
    console.warn(
      "[file-management] FILE_MANAGEMENT_API_KEY is empty — uploads will fail in production.",
    );
  }

  try {
    // eslint-disable-next-line no-new
    new URL(FILE_MANAGEMENT_API_URL);
  } catch {
    console.error(
      "[file-management] FILE_MANAGEMENT_API_URL is not a valid URL:",
      FILE_MANAGEMENT_API_URL,
    );
  }
}
