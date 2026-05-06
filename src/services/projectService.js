import { and, count, eq, lt, ne, sql } from "drizzle-orm";
import {
  db,
  projectMembersTable,
  projectsTable,
  tasksTable,
} from "../models/index.js";
import { assertProjectAccess, getProjectRole } from "./projectMembershipService.js";

/**
 * Build a project summary with task and membership counts.
 *
 * @param {Record<string, unknown>} project
 * @param {number} projectId
 * @param {"admin" | "member"} role
 * @returns {Promise<Record<string, unknown>>}
 */
export async function enrichProject(project, projectId, role) {
  const now = new Date();

  const [totalResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(eq(tasksTable.projectId, projectId));

  const [completedResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(and(eq(tasksTable.projectId, projectId), eq(tasksTable.status, "done")));

  const [overdueResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.projectId, projectId),
        ne(tasksTable.status, "done"),
        ne(tasksTable.status, "cancelled"),
        lt(tasksTable.dueDate, now),
        sql`${tasksTable.dueDate} IS NOT NULL`,
      ),
    );

  const [memberCountResult] = await db
    .select({ count: count() })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.projectId, projectId));

  return {
    ...project,
    totalTasks: totalResult?.count ?? 0,
    completedTasks: completedResult?.count ?? 0,
    overdueTasks: overdueResult?.count ?? 0,
    memberCount: memberCountResult?.count ?? 0,
    myRole: role,
  };
}

/**
 * List all projects for the current user.
 *
 * @param {number} userId
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listProjectsForUser(userId) {
  const memberships = await db
    .select({
      projectId: projectMembersTable.projectId,
      role: projectMembersTable.role,
    })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, userId));

  if (memberships.length === 0) {
    return [];
  }

  const projects = await Promise.all(
    memberships.map(async ({ projectId, role }) => {
      const [project] = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId));

      return project ? enrichProject(project, projectId, role) : null;
    }),
  );

  return projects.filter(Boolean);
}

/**
 * Create a project and add the creator as an admin member.
 *
 * @param {number} userId
 * @param {{ name: string, description?: string | null, color?: string }} payload
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createProjectForUser(userId, payload) {
  const [project] = await db
    .insert(projectsTable)
    .values({
      name: payload.name,
      description: payload.description ?? null,
      color: payload.color ?? "#6366f1",
    })
    .returning();

  await db.insert(projectMembersTable).values({
    projectId: project.id,
    userId,
    role: "admin",
  });

  return project;
}

/**
 * Fetch a single project for the current user.
 *
 * @param {number} projectId
 * @param {number} userId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getProjectForUser(projectId, userId) {
  const role = await assertProjectAccess(projectId, userId);

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId));

  return enrichProject(project, projectId, role);
}

/**
 * Update a project owned by an admin member.
 *
 * @param {number} projectId
 * @param {number} userId
 * @param {{ name?: string, description?: string | null, color?: string }} payload
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateProjectForUser(projectId, userId, payload) {
  await assertProjectAccess(projectId, userId, { requireAdmin: true });

  const updates = { updatedAt: new Date() };

  if (payload.name !== undefined) {
    updates.name = payload.name;
  }

  if (payload.description !== undefined) {
    updates.description = payload.description;
  }

  if (payload.color !== undefined) {
    updates.color = payload.color;
  }

  const [project] = await db
    .update(projectsTable)
    .set(updates)
    .where(eq(projectsTable.id, projectId))
    .returning();

  return project;
}

/**
 * Delete a project owned by an admin member.
 *
 * @param {number} projectId
 * @param {number} userId
 * @returns {Promise<void>}
 */
export async function deleteProjectForUser(projectId, userId) {
  await assertProjectAccess(projectId, userId, { requireAdmin: true });

  await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
}

/**
 * Resolve the current user's role for a project.
 *
 * @param {number} projectId
 * @param {number} userId
 * @returns {Promise<"admin" | "member" | null>}
 */
export async function getUserProjectRole(projectId, userId) {
  return getProjectRole(projectId, userId);
}
