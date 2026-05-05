import { Router, type IRouter } from "express";
import { db, tasksTable, usersTable, projectMembersTable, taskActivityTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  ListTasksParams,
  ListTasksQueryParams,
  CreateTaskParams,
  CreateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getProjectRole(
  projectId: number,
  userId: number,
): Promise<"admin" | "member" | null> {
  const [membership] = await db
    .select()
    .from(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, userId),
      ),
    );
  return membership ? (membership.role as "admin" | "member") : null;
}

async function enrichTask(task: typeof tasksTable.$inferSelect) {
  const [assignee] = task.assigneeId
    ? await db.select().from(usersTable).where(eq(usersTable.id, task.assigneeId))
    : [null];
  const [createdBy] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, task.createdById));

  return { ...task, assignee: assignee ?? null, createdBy };
}

// GET /projects/:projectId/tasks
router.get(
  "/projects/:projectId/tasks",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const params = ListTasksParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const role = await getProjectRole(params.data.projectId, req.dbUserId!);
    if (!role) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const query = ListTasksQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }

    const conditions = [eq(tasksTable.projectId, params.data.projectId)];
    if (query.data.status) conditions.push(eq(tasksTable.status, query.data.status));
    if (query.data.priority) conditions.push(eq(tasksTable.priority, query.data.priority));
    if (query.data.assigneeId) conditions.push(eq(tasksTable.assigneeId, query.data.assigneeId));

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(and(...conditions))
      .orderBy(tasksTable.createdAt);

    const enriched = await Promise.all(tasks.map(enrichTask));
    res.json(enriched);
  },
);

// POST /projects/:projectId/tasks
router.post(
  "/projects/:projectId/tasks",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const params = CreateTaskParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const role = await getProjectRole(params.data.projectId, req.dbUserId!);
    if (!role) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const parsed = CreateTaskBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [task] = await db
      .insert(tasksTable)
      .values({
        projectId: params.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        status: parsed.data.status ?? "todo",
        priority: parsed.data.priority ?? "medium",
        assigneeId: parsed.data.assigneeId ?? null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        createdById: req.dbUserId!,
      })
      .returning();

    // Log activity
    await db.insert(taskActivityTable).values({
      taskId: task.id,
      projectId: params.data.projectId,
      actorId: req.dbUserId!,
      action: "created task",
    });

    const enriched = await enrichTask(task);
    res.status(201).json(enriched);
  },
);

// GET /projects/:projectId/tasks/:taskId
router.get(
  "/projects/:projectId/tasks/:taskId",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const params = GetTaskParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const role = await getProjectRole(params.data.projectId, req.dbUserId!);
    if (!role) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const [task] = await db
      .select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.id, params.data.taskId),
          eq(tasksTable.projectId, params.data.projectId),
        ),
      );

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const enriched = await enrichTask(task);
    res.json(enriched);
  },
);

// PATCH /projects/:projectId/tasks/:taskId
router.patch(
  "/projects/:projectId/tasks/:taskId",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const params = UpdateTaskParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const role = await getProjectRole(params.data.projectId, req.dbUserId!);
    if (!role) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const [existingTask] = await db
      .select()
      .from(tasksTable)
      .where(
        and(
          eq(tasksTable.id, params.data.taskId),
          eq(tasksTable.projectId, params.data.projectId),
        ),
      );

    if (!existingTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Members can only update tasks assigned to them (or admins can update any)
    if (role !== "admin" && existingTask.assigneeId !== req.dbUserId) {
      res.status(403).json({ error: "You can only update tasks assigned to you" });
      return;
    }

    const parsed = UpdateTaskBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority;
    if (parsed.data.assigneeId !== undefined) updates.assigneeId = parsed.data.assigneeId;
    if (parsed.data.dueDate !== undefined) {
      updates.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    }

    const [task] = await db
      .update(tasksTable)
      .set(updates)
      .where(eq(tasksTable.id, params.data.taskId))
      .returning();

    // Log activity
    const actionParts: string[] = [];
    if (parsed.data.status && parsed.data.status !== existingTask.status) {
      actionParts.push(`changed status to ${parsed.data.status}`);
    }
    if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== existingTask.assigneeId) {
      actionParts.push("reassigned task");
    }
    if (actionParts.length === 0) actionParts.push("updated task");

    await db.insert(taskActivityTable).values({
      taskId: task.id,
      projectId: params.data.projectId,
      actorId: req.dbUserId!,
      action: actionParts.join(", "),
    });

    const enriched = await enrichTask(task);
    res.json(enriched);
  },
);

// DELETE /projects/:projectId/tasks/:taskId
router.delete(
  "/projects/:projectId/tasks/:taskId",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const params = DeleteTaskParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const role = await getProjectRole(params.data.projectId, req.dbUserId!);
    if (!role) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (role !== "admin") {
      res.status(403).json({ error: "Only admins can delete tasks" });
      return;
    }

    await db
      .delete(tasksTable)
      .where(
        and(
          eq(tasksTable.id, params.data.taskId),
          eq(tasksTable.projectId, params.data.projectId),
        ),
      );

    res.sendStatus(204);
  },
);

export default router;
