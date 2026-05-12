import { AsyncLocalStorage } from "async_hooks";

/**
 * Holds the current Express request for the lifetime of each request.
 * Populated by requestContextMiddleware; consumed by any helper that
 * needs per-request data (e.g. cookies) without receiving `req` as an argument.
 *
 * @type {AsyncLocalStorage<import("express").Request>}
 */
export const requestStore = new AsyncLocalStorage();

/**
 * Returns the mode cookie value from the currently active request, or null.
 *
 * @returns {"onsite"|"offsite"|null}
 */
export function getModeFromContext() {
  const req = requestStore.getStore();
  return req?.cookies?.mode ?? null;
}
