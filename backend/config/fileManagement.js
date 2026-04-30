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
 * When true, stored document links are path-only (`/api/v1/file-management/...`) so the browser stays on
 * the same host as the SPA (where the `jwt` cookie is set). Set `FILE_DOCUMENT_LINKS_RELATIVE=true` or
 * `API_PUBLIC_BASE_URL=same-origin` (or `relative`). Requires reverse-proxying `/api` to this server.
 */
function resolvePublicBaseForFileLinks() {
  const raw = process.env.API_PUBLIC_BASE_URL;
  const explicitRelative =
    process.env.FILE_DOCUMENT_LINKS_RELATIVE === "true" ||
    (raw != null &&
      (/^same-origin$/i.test(String(raw).trim()) ||
        /^relative$/i.test(String(raw).trim())));

  if (explicitRelative) {
    return { fileLinksRelative: true, base: "" };
  }

  const base = stripTrailingSlash(
    raw != null && String(raw).trim() !== ""
      ? String(raw).trim()
      : "http://localhost:5000",
  );
  return { fileLinksRelative: false, base };
}

const _publicFile = resolvePublicBaseForFileLinks();

export const FILE_DOCUMENT_LINKS_RELATIVE = _publicFile.fileLinksRelative;

/** Origin for absolute document URLs (unused when {@link FILE_DOCUMENT_LINKS_RELATIVE}). */
export const API_PUBLIC_BASE_URL = _publicFile.base;

/** Timeout for JSON calls to the file-management API (ms). */
export const FILE_MANAGEMENT_REQUEST_TIMEOUT_MS = Number(
  process.env.FILE_MANAGEMENT_REQUEST_TIMEOUT_MS || 60_000,
);

/** Max time to wait for file processing after upload (ms). */
export const FILE_MANAGEMENT_UPLOAD_MAX_WAIT_MS = Number(
  process.env.FILE_MANAGEMENT_UPLOAD_MAX_WAIT_MS || 120_000,
);

/** Interval when polling file status (ms). */
export const FILE_MANAGEMENT_POLL_INTERVAL_MS = Number(
  process.env.FILE_MANAGEMENT_POLL_INTERVAL_MS || 500,
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
