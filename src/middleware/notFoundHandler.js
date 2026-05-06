/**
 * Return a JSON 404 for unmatched routes.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {void}
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
}
