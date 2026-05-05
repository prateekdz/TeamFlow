import { Router, type IRouter } from "express";
import { db, projectsTable, projectMembersTable, tasksTable, usersTable } from "@workspace/db";
import { eq, and, count, sql, lt, ne } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Helper: check if user is member of project
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

// GET /projects
router.get("/projects", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const memberships = await db
    .select({ projectId: projectMembersTable.projectId, role: projectMembersTable.role })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, req.dbUserId!));

  if (memberships.length === 0) {
    res.json([]);
    return;
  }

  const projectIds = memberships.map((m) => m.projectId);
  const roleMap = new Map(memberships.map((m) => [m.projectId, m.role]));

  const now = new Date();

  const projects = await Promise.all(
    projectIds.map(async (projectId) => {
      const [project] = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, projectId));

      if (!project) return null;

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
        myRole: roleMap.get(projectId) ?? "member",
      };
    }),
  );

  res.json(projects.filter(Boolean));
});

// POST /projects
router.post("/projects", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [project] = await db
    .insert(projectsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      color: parsed.data.color ?? "#6366f1",
    })
    .returning();

  // Add creator as admin
  await db.insert(projectMembersTable).values({
    projectId: project.id,
    userId: req.dbUserId!,
    role: "admin",
  });

  res.status(201).json(project);
});

// GET /projects/:projectId
router.get("/projects/:projectId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const role = await getProjectRole(params.data.projectId, req.dbUserId!);
  if (!role) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.projectId));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const now = new Date();

  const [totalResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(eq(tasksTable.projectId, project.id));

  const [completedResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(and(eq(tasksTable.projectId, project.id), eq(tasksTable.status, "done")));

  const [overdueResult] = await db
    .select({ count: count() })
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.projectId, project.id),
        ne(tasksTable.status, "done"),
        ne(tasksTable.status, "cancelled"),
        lt(tasksTable.dueDate, now),
        sql`${tasksTable.dueDate} IS NOT NULL`,
      ),
    );

  const [memberCountResult] = await db
    .select({ count: count() })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.projectId, project.id));

  res.json({
    ...project,
    totalTasks: totalResult?.count ?? 0,
    completedTasks: completedResult?.count ?? 0,
    overdueTasks: overdueResult?.count ?? 0,
    memberCount: memberCountResult?.count ?? 0,
    myRole: role,
  });
});

// PATCH /projects/:projectId
router.patch("/projects/:projectId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
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
    res.status(403).json({ error: "Only admins can update this project" });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.color !== undefined) updates.color = parsed.data.color;

  const [project] = await db
    .update(projectsTable)
    .set(updates)
    .where(eq(projectsTable.id, params.data.projectId))
    .returning();

  res.json(project);
});

// DELETE /projects/:projectId
router.delete("/projects/:projectId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
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
    res.status(403).json({ error: "Only admins can delete this project" });
    return;
  }

  await db.delete(projectsTable).where(eq(projectsTable.id, params.data.projectId));

  res.sendStatus(204);
});

export default router;
