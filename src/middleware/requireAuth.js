import { getAuth } from "@clerk/express";
import { syncAuthenticatedUser } from "../services/authService.js";

/**
 * Ensure the current request is authenticated and attach DB user metadata.
 *
 * @param {import("express").Request & { dbUserId?: number, clerkId?: string }} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function requireAuth(req, res, next) {
  try {
    const auth = getAuth(req);
    const { clerkId, dbUserId } = await syncAuthenticatedUser(auth);

    req.clerkId = clerkId;
    req.dbUserId = dbUserId;

    next();
  } catch (error) {
    if (error.status === 401) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    next(error);
  }
}
