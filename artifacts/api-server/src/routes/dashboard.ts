import { Router, type IRouter } from "express";
import {
  db,
  tasksTable,
  projectsTable,
  projectMembersTable,
  usersTable,
  taskActivityTable,
} from "@workspace/db";
import { eq, and, lt, ne, gte, count, sql, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.dbUserId!;
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get all projects the user belongs to
  const memberships = await db
    .select({ projectId: projectMembersTable.projectId })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, userId));

  const projectIds = memberships.map((m) => m.projectId);
  const totalProjects = projectIds.length;

  if (projectIds.length === 0) {
    res.json({
      totalProjects: 0,
      totalTasks: 0,
      myOpenTasks: 0,
      overdueTasks: 0,
      completedThisWeek: 0,
      tasksByStatus: [],
      tasksByPriority: [],
    });
    return;
  }

  // Total tasks across all user's projects
  const [totalTasksResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(inArray(tasksTable.projectId, projectIds));

  // My open tasks
  const [myOpenResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(
      and(
        inArray(tasksTable.projectId, projectIds),
        eq(tasksTable.assigneeId, userId),
        ne(tasksTable.status, "done"),
        ne(tasksTable.status, "cancelled"),
      ),
    );

  // Overdue tasks (assigned to me, not done, past due date)
  const [overdueResult] = await db
    .select({ count: count() })
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
    );

  // Completed this week
  const [completedThisWeekResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(
      and(
        inArray(tasksTable.projectId, projectIds),
        eq(tasksTable.status, "done"),
        gte(tasksTable.updatedAt, oneWeekAgo),
      ),
    );

  // Tasks by status (across all user's projects)
  const tasksByStatus = await db
    .select({ status: tasksTable.status, count: count() })
    .from(tasksTable)
    .where(inArray(tasksTable.projectId, projectIds))
    .groupBy(tasksTable.status);

  // Tasks by priority (across all user's projects)
  const tasksByPriority = await db
    .select({ priority: tasksTable.priority, count: count() })
    .from(tasksTable)
    .where(inArray(tasksTable.projectId, projectIds))
    .groupBy(tasksTable.priority);

  res.json({
    totalProjects,
    totalTasks: totalTasksResult?.count ?? 0,
    myOpenTasks: myOpenResult?.count ?? 0,
    overdueTasks: overdueResult?.count ?? 0,
    completedThisWeek: completedThisWeekResult?.count ?? 0,
    tasksByStatus: tasksByStatus.map((r) => ({ status: r.status, count: r.count })),
    tasksByPriority: tasksByPriority.map((r) => ({ priority: r.priority, count: r.count })),
  });
});

// GET /dashboard/my-tasks
router.get("/dashboard/my-tasks", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.dbUserId!;

  const memberships = await db
    .select({ projectId: projectMembersTable.projectId })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, userId));

  const projectIds = memberships.map((m) => m.projectId);

  if (projectIds.length === 0) {
    res.json([]);
    return;
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
      ),
    )
    .orderBy(tasksTable.createdAt);

  const enriched = await Promise.all(
    tasks.map(async (task) => {
      const [project] = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, task.projectId));

      const [assignee] = task.assigneeId
        ? await db.select().from(usersTable).where(eq(usersTable.id, task.assigneeId))
        : [null];

      return { ...task, project, assignee: assignee ?? null };
    }),
  );

  res.json(enriched);
});

// GET /dashboard/overdue-tasks
router.get(
  "/dashboard/overdue-tasks",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const userId = req.dbUserId!;
    const now = new Date();

    const memberships = await db
      .select({ projectId: projectMembersTable.projectId })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, userId));

    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      res.json([]);
      return;
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

    const enriched = await Promise.all(
      tasks.map(async (task) => {
        const [project] = await db
          .select()
          .from(projectsTable)
          .where(eq(projectsTable.id, task.projectId));

        const [assignee] = task.assigneeId
          ? await db.select().from(usersTable).where(eq(usersTable.id, task.assigneeId))
          : [null];

        return { ...task, project, assignee: assignee ?? null };
      }),
    );

    res.json(enriched);
  },
);

// GET /dashboard/activity
router.get("/dashboard/activity", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.dbUserId!;

  const memberships = await db
    .select({ projectId: projectMembersTable.projectId })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, userId));

  const projectIds = memberships.map((m) => m.projectId);

  if (projectIds.length === 0) {
    res.json([]);
    return;
  }

  const activities = await db
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

  res.json(activities);
});

export default router;
