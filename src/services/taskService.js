import { and, eq } from "drizzle-orm";
import {
  db,
  projectMembersTable,
  taskActivityTable,
  tasksTable,
  usersTable,
} from "../models/index.js";
import { createHttpError } from "../utils/httpError.js";
import { assertProjectAccess } from "./projectMembershipService.js";

/**
 * Attach assignee and creator records to a task.
 *
 * @param {Record<string, unknown> & { assigneeId?: number | null, createdById: number }} task
 * @returns {Promise<Record<string, unknown>>}
 */
export async function enrichTask(task) {
  const [assignee] = task.assigneeId
    ? await db.select().from(usersTable).where(eq(usersTable.id, task.assigneeId))
    : [null];

  const [createdBy] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, task.createdById));

  return { ...task, assignee: assignee ?? null, createdBy };
}

/**
 * List tasks for a project that the current user can access.
 *
 * @param {number} projectId
 * @param {number} userId
 * @param {{ status?: string, priority?: string, assigneeId?: number }} filters
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listTasksForProject(projectId, userId, filters) {
  await assertProjectAccess(projectId, userId);

  const conditions = [eq(tasksTable.projectId, projectId)];

  if (filters.status) {
    conditions.push(eq(tasksTable.status, filters.status));
  }

  if (filters.priority) {
    conditions.push(eq(tasksTable.priority, filters.priority));
  }

  if (filters.assigneeId) {
    conditions.push(eq(tasksTable.assigneeId, filters.assigneeId));
  }

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(...conditions))
    .orderBy(tasksTable.createdAt);

  return Promise.all(tasks.map(enrichTask));
}

/**
 * Create a task in an accessible project.
 *
 * @param {number} projectId
 * @param {number} userId
 * @param {{ title: string, description?: string | null, status?: string, priority?: string, assigneeId?: number | null, dueDate?: Date | string | null }} payload
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createTaskForProject(projectId, userId, payload) {
  await assertProjectAccess(projectId, userId);

  const [task] = await db
    .insert(tasksTable)
    .values({
      projectId,
      title: payload.title,
      description: payload.description ?? null,
      status: payload.status ?? "todo",
      priority: payload.priority ?? "medium",
      assigneeId: payload.assigneeId ?? null,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      createdById: userId,
    })
    .returning();

  await db.insert(taskActivityTable).values({
    taskId: task.id,
    projectId,
    actorId: userId,
    action: "created task",
  });

  return enrichTask(task);
}

/**
 * Fetch a single task in an accessible project.
 *
 * @param {number} projectId
 * @param {number} taskId
 * @param {number} userId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getTaskForProject(projectId, taskId, userId) {
  await assertProjectAccess(projectId, userId);

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, projectId)));

  if (!task) {
    throw createHttpError(404, "Task not found");
  }

  return enrichTask(task);
}

/**
 * Update a task in an accessible project.
 *
 * @param {number} projectId
 * @param {number} taskId
 * @param {number} userId
 * @param {{ title?: string, description?: string | null, status?: string, priority?: string, assigneeId?: number | null, dueDate?: Date | string | null }} payload
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateTaskForProject(projectId, taskId, userId, payload) {
  const role = await assertProjectAccess(projectId, userId);

  const [existingTask] = await db
    .select()
    .from(tasksTable)
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, projectId)));

  if (!existingTask) {
    throw createHttpError(404, "Task not found");
  }

  if (role !== "admin" && existingTask.assigneeId !== userId) {
    throw createHttpError(403, "You can only update tasks assigned to you");
  }

  const updates = { updatedAt: new Date() };

  if (payload.title !== undefined) {
    updates.title = payload.title;
  }

  if (payload.description !== undefined) {
    updates.description = payload.description;
  }

  if (payload.status !== undefined) {
    updates.status = payload.status;
  }

  if (payload.priority !== undefined) {
    updates.priority = payload.priority;
  }

  if (payload.assigneeId !== undefined) {
    updates.assigneeId = payload.assigneeId;
  }

  if (payload.dueDate !== undefined) {
    updates.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
  }

  const [task] = await db
    .update(tasksTable)
    .set(updates)
    .where(eq(tasksTable.id, taskId))
    .returning();

  const actionParts = [];

  if (payload.status && payload.status !== existingTask.status) {
    actionParts.push(`changed status to ${payload.status}`);
  }

  if (payload.assigneeId !== undefined && payload.assigneeId !== existingTask.assigneeId) {
    actionParts.push("reassigned task");
  }

  if (actionParts.length === 0) {
    actionParts.push("updated task");
  }

  await db.insert(taskActivityTable).values({
    taskId: task.id,
    projectId,
    actorId: userId,
    action: actionParts.join(", "),
  });

  return enrichTask(task);
}

/**
 * Delete a task from a project as an admin.
 *
 * @param {number} projectId
 * @param {number} taskId
 * @param {number} userId
 * @returns {Promise<void>}
 */
export async function deleteTaskForProject(projectId, taskId, userId) {
  await assertProjectAccess(projectId, userId, { requireAdmin: true });

  await db
    .delete(tasksTable)
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.projectId, projectId)));
}

/**
 * List members that belong to a project.
 *
 * @param {number} projectId
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listProjectAssignees(projectId) {
  return db
    .select()
    .from(projectMembersTable)
    .where(eq(projectMembersTable.projectId, projectId));
}
