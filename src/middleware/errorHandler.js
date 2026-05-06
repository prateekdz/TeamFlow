import { logger } from "../config/logger.js";

/**
 * Send a consistent JSON error response.
 *
 * @param {Error & { status?: number, details?: Record<string, unknown> }} error
 * @param {import("express").Request} _req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} _next
 * @returns {void}
 */
export function errorHandler(error, _req, res, _next) {
  const status = error.status ?? 500;

  logger.error({ err: error, status, details: error.details }, "Request failed");

  res.status(status).json({
    error: error.message || "Internal Server Error",
    ...(error.details ? { details: error.details } : {}),
  });
}
