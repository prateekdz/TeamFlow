/**
 * Wrap an async Express handler and forward failures to `next`.
 *
 * @param {(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<unknown>} handler
 * @returns {import("express").RequestHandler}
 */
export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
