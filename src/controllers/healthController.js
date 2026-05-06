import { HealthCheckResponse } from "../models/apiSchemas.js";

/**
 * Return a simple health payload.
 *
 * @param {import("express").Request} _req
 * @param {import("express").Response} res
 * @returns {void}
 */
export function getHealth(_req, res) {
  res.json(HealthCheckResponse.parse({ status: "ok" }));
}
