import { and, eq } from "drizzle-orm";
import { db, projectMembersTable } from "../models/index.js";
import { createHttpError } from "../utils/httpError.js";

/**
 * Get the current user's role for a project.
 *
 * @param {number} projectId
 * @param {number} userId
 * @returns {Promise<"admin" | "member" | null>}
 */
export async function getProjectRole(projectId, userId) {
  const [membership] = await db
    .select()
    .from(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, userId),
      ),
    );

  return membership ? membership.role : null;
}

/**
 * Ensure a user belongs to a project, optionally requiring admin access.
 *
 * @param {number} projectId
 * @param {number} userId
 * @param {{ requireAdmin?: boolean }} [options]
 * @returns {Promise<"admin" | "member">}
 */
export async function assertProjectAccess(projectId, userId, options = {}) {
  const role = await getProjectRole(projectId, userId);

  if (!role) {
    throw createHttpError(404, "Project not found");
  }

  if (options.requireAdmin && role !== "admin") {
    throw createHttpError(403, "Admin access is required for this action");
  }

  return role;
}

/**
 * List all project IDs that a user belongs to.
 *
 * @param {number} userId
 * @returns {Promise<number[]>}
 */
export async function listProjectIdsForUser(userId) {
  const memberships = await db
    .select({ projectId: projectMembersTable.projectId })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, userId));

  return memberships.map((membership) => membership.projectId);
}
