import { and, count, eq, gte, inArray, lt, ne, or, sql } from "drizzle-orm";
import {
  db,
  projectsTable,
  taskActivityTable,
  tasksTable,
  usersTable,
} from "../models/index.js";
import { listProjectIdsForUser } from "./projectMembershipService.js";

/**
 * Build the dashboard summary for the current user.
 *
 * @param {number} userId
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getDashboardSummaryForUser(userId) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const projectIds = await listProjectIdsForUser(userId);

  if (projectIds.length === 0) {
    return {
      totalProjects: 0,
      totalTasks: 0,
      myOpenTasks: 0,
      overdueTasks: 0,
      completedThisWeek: 0,
      tasksByStatus: [],
      tasksByPriority: [],
    };
  }

  const [
    [totalTasksResult],
    [myOpenResult],
    [overdueResult],
    [completedThisWeekResult],
    tasksByStatus,
    tasksByPriority,
  ] = await Promise.all([
    db.select({ count: count() }).from(tasksTable).where(inArray(tasksTable.projectId, projectIds)),
    db.select({ count: count() }).from(tasksTable).where(
      and(
        inArray(tasksTable.projectId, projectIds),
        eq(tasksTable.assigneeId, userId),
        ne(tasksTable.status, "done"),
        ne(tasksTable.status, "cancelled"),
      ),
    ),
    db.select({ count: count() }).from(tasksTable).where(
      and(
        inArray(tasksTable.projectId, projectIds),
        eq(tasksTable.assigneeId, userId),
        ne(tasksTable.status, "done"),
        ne(tasksTable.status, "cancelled"),
        lt(tasksTable.dueDate, now),
        sql`${tasksTable.dueDate} IS NOT NULL`,
      ),
    ),
    db.select({ count: count() }).from(tasksTable).where(
      and(
        inArray(tasksTable.projectId, projectIds),
        eq(tasksTable.status, "done"),
        gte(tasksTable.updatedAt, oneWeekAgo),
      ),
    ),
    db.select({ status: tasksTable.status, count: count() }).from(tasksTable).where(inArray(tasksTable.projectId, projectIds)).groupBy(tasksTable.status),
    db.select({ priority: tasksTable.priority, count: count() }).from(tasksTable).where(inArray(tasksTable.projectId, projectIds)).groupBy(tasksTable.priority),
  ]);

  return {
    totalProjects: projectIds.length,
    totalTasks: totalTasksResult?.count ?? 0,
    myOpenTasks: myOpenResult?.count ?? 0,
    overdueTasks: overdueResult?.count ?? 0,
    completedThisWeek: completedThisWeekResult?.count ?? 0,
    tasksByStatus: tasksByStatus.map((item) => ({ status: item.status, count: item.count })),
    tasksByPriority: tasksByPriority.map((item) => ({ priority: item.priority, count: item.count })),
  };
}

/**
 * List all open tasks assigned to the current user.
 *
 * @param {number} userId
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function getMyTasksForUser(userId) {
  const projectIds = await listProjectIdsForUser(userId);

  if (projectIds.length === 0) {
    return [];
  }

  // Show tasks the user created OR is assigned to
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(
      and(
        inArray(tasksTable.projectId, projectIds),
        ne(tasksTable.status, "done"),
        ne(tasksTable.status, "cancelled"),
        or(
          eq(tasksTable.assigneeId, userId),
          eq(tasksTable.createdById, userId),
        ),
      ),
    )
    .orderBy(tasksTable.createdAt);

  if (tasks.length === 0) return [];

  const uniqueProjectIds = [...new Set(tasks.map((t) => t.projectId))];
  const assigneeIds = [...new Set(tasks.map((t) => t.assigneeId).filter(Boolean))];

  const [projects, assignees] = await Promise.all([
    db.select().from(projectsTable).where(inArray(projectsTable.id, uniqueProjectIds)),
    assigneeIds.length > 0
      ? db.select().from(usersTable).where(inArray(usersTable.id, assigneeIds))
      : Promise.resolve([]),
  ]);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const assigneeMap = Object.fromEntries(assignees.map((u) => [u.id, u]));

  return tasks.map((task) => ({
    ...task,
    project: projectMap[task.projectId] ?? null,
    assignee: task.assigneeId ? (assigneeMap[task.assigneeId] ?? null) : null,
  }));
}

/**
 * List all overdue tasks assigned to the current user.
 *
 * @param {number} userId
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function getOverdueTasksForUser(userId) {
  const now = new Date();
  const projectIds = await listProjectIdsForUser(userId);

  if (projectIds.length === 0) {
    return [];
  }

  const tasks = await db
    .select()
    .from(tasksTable)
    .where(
      and(
        inArray(tasksTable.projectId, projectIds),
        eq(tasksTable.assigneeId, userId),
        ne(tasksTable.status, "done"),
        ne(tasksTable.status, "cancelled"),
        lt(tasksTable.dueDate, now),
        sql`${tasksTable.dueDate} IS NOT NULL`,
      ),
    )
    .orderBy(tasksTable.dueDate);

  if (tasks.length === 0) return [];

  const uniqueProjectIds = [...new Set(tasks.map((t) => t.projectId))];
  const assigneeIds = [...new Set(tasks.map((t) => t.assigneeId).filter(Boolean))];

  const [projects, assignees] = await Promise.all([
    db.select().from(projectsTable).where(inArray(projectsTable.id, uniqueProjectIds)),
    assigneeIds.length > 0
      ? db.select().from(usersTable).where(inArray(usersTable.id, assigneeIds))
      : Promise.resolve([]),
  ]);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const assigneeMap = Object.fromEntries(assignees.map((u) => [u.id, u]));

  return tasks.map((task) => ({
    ...task,
    project: projectMap[task.projectId] ?? null,
    assignee: task.assigneeId ? (assigneeMap[task.assigneeId] ?? null) : null,
  }));
}

/**
 * List recent task activity across every project the current user belongs to.
 *
 * @param {number} userId
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function getRecentActivityForUser(userId) {
  const projectIds = await listProjectIdsForUser(userId);

  if (projectIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: taskActivityTable.id,
      taskId: taskActivityTable.taskId,
      projectId: taskActivityTable.projectId,
      action: taskActivityTable.action,
      createdAt: taskActivityTable.createdAt,
      actorName: usersTable.name,
      actorAvatarUrl: usersTable.avatarUrl,
      taskTitle: tasksTable.title,
      projectName: projectsTable.name,
    })
    .from(taskActivityTable)
    .innerJoin(usersTable, eq(taskActivityTable.actorId, usersTable.id))
    .innerJoin(tasksTable, eq(taskActivityTable.taskId, tasksTable.id))
    .innerJoin(projectsTable, eq(taskActivityTable.projectId, projectsTable.id))
    .where(inArray(taskActivityTable.projectId, projectIds))
    .orderBy(sql`${taskActivityTable.createdAt} DESC`)
    .limit(30);
}
