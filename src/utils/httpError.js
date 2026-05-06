/**
 * Create a status-aware error object.
 *
 * @param {number} status
 * @param {string} message
 * @param {Record<string, unknown>} [details]
 * @returns {Error & { status: number, details?: Record<string, unknown> }}
 */
export function createHttpError(status, message, details = undefined) {
  const error = new Error(message);
  error.status = status;

  if (details) {
    error.details = details;
  }

  return error;
}
