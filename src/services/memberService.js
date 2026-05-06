import { and, eq } from "drizzle-orm";
import { db, projectMembersTable, usersTable } from "../models/index.js";
import { createHttpError } from "../utils/httpError.js";
import { assertProjectAccess, getProjectRole } from "./projectMembershipService.js";

/**
 * List all members in a project.
 *
 * @param {number} projectId
 * @param {number} userId
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listMembersForProject(projectId, userId) {
  await assertProjectAccess(projectId, userId);

  return db
    .select({
      id: projectMembersTable.id,
      projectId: projectMembersTable.projectId,
      userId: projectMembersTable.userId,
      role: projectMembersTable.role,
      joinedAt: projectMembersTable.joinedAt,
      user: {
        id: usersTable.id,
        clerkId: usersTable.clerkId,
        name: usersTable.name,
        email: usersTable.email,
        avatarUrl: usersTable.avatarUrl,
        createdAt: usersTable.createdAt,
      },
    })
    .from(projectMembersTable)
    .innerJoin(usersTable, eq(projectMembersTable.userId, usersTable.id))
    .where(eq(projectMembersTable.projectId, projectId));
}

/**
 * Add a new member to a project as an admin.
 *
 * @param {number} projectId
 * @param {number} userId
 * @param {{ email: string, role: "admin" | "member" }} payload
 * @returns {Promise<Record<string, unknown>>}
 */
export async function addMemberToProject(projectId, userId, payload) {
  await assertProjectAccess(projectId, userId, { requireAdmin: true });

  const [targetUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, payload.email));

  if (!targetUser) {
    throw createHttpError(404, "User not found. They must sign up first.");
  }

  const existingRole = await getProjectRole(projectId, targetUser.id);

  if (existingRole) {
    throw createHttpError(409, "User is already a member of this project");
  }

  const [member] = await db
    .insert(projectMembersTable)
    .values({
      projectId,
      userId: targetUser.id,
      role: payload.role,
    })
    .returning();

  return { ...member, user: targetUser };
}

/**
 * Update a member role in a project as an admin.
 *
 * @param {number} projectId
 * @param {number} currentUserId
 * @param {number} memberUserId
 * @param {{ role: "admin" | "member" }} payload
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateMemberRole(projectId, currentUserId, memberUserId, payload) {
  await assertProjectAccess(projectId, currentUserId, { requireAdmin: true });

  const [member] = await db
    .update(projectMembersTable)
    .set({ role: payload.role })
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, memberUserId),
      ),
    )
    .returning();

  if (!member) {
    throw createHttpError(404, "Member not found");
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, member.userId));

  return { ...member, user };
}

/**
 * Remove a member from a project as an admin.
 *
 * @param {number} projectId
 * @param {number} currentUserId
 * @param {number} memberUserId
 * @returns {Promise<void>}
 */
export async function removeMemberFromProject(projectId, currentUserId, memberUserId) {
  await assertProjectAccess(projectId, currentUserId, { requireAdmin: true });

  await db
    .delete(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, memberUserId),
      ),
    );
}
