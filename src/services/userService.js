import { eq } from "drizzle-orm";
import { db, usersTable } from "../models/index.js";
import { createHttpError } from "../utils/httpError.js";

/**
 * Fetch the current authenticated user profile.
 *
 * @param {number} dbUserId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getCurrentUser(dbUserId) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, dbUserId));

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
}

/**
 * Update the current authenticated user profile.
 *
 * @param {number} dbUserId
 * @param {{ name?: string, avatarUrl?: string | null }} updates
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateCurrentUser(dbUserId, updates) {
  const nextUpdates = {};

  if (updates.name !== undefined) {
    nextUpdates.name = updates.name;
  }

  if (updates.avatarUrl !== undefined) {
    nextUpdates.avatarUrl = updates.avatarUrl;
  }

  if (Object.keys(nextUpdates).length === 0) {
    return getCurrentUser(dbUserId);
  }

  const [user] = await db
    .update(usersTable)
    .set(nextUpdates)
    .where(eq(usersTable.id, dbUserId))
    .returning();

  return user;
}
