import { Router, type IRouter } from "express";
import { db, projectMembersTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/requireAuth";
import {
  ListProjectMembersParams,
  AddProjectMemberParams,
  AddProjectMemberBody,
  UpdateProjectMemberRoleParams,
  UpdateProjectMemberRoleBody,
  RemoveProjectMemberParams,
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

// GET /projects/:projectId/members
router.get(
  "/projects/:projectId/members",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const params = ListProjectMembersParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const role = await getProjectRole(params.data.projectId, req.dbUserId!);
    if (!role) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const members = await db
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
      .where(eq(projectMembersTable.projectId, params.data.projectId));

    res.json(members);
  },
);

// POST /projects/:projectId/members
router.post(
  "/projects/:projectId/members",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const params = AddProjectMemberParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const myRole = await getProjectRole(params.data.projectId, req.dbUserId!);
    if (!myRole) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (myRole !== "admin") {
      res.status(403).json({ error: "Only admins can add members" });
      return;
    }

    const parsed = AddProjectMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    // Find user by email
    const [targetUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, parsed.data.email));

    if (!targetUser) {
      res.status(404).json({ error: "User not found. They must sign up first." });
      return;
    }

    // Check if already a member
    const existing = await getProjectRole(params.data.projectId, targetUser.id);
    if (existing) {
      res.status(409).json({ error: "User is already a member of this project" });
      return;
    }

    const [member] = await db
      .insert(projectMembersTable)
      .values({
        projectId: params.data.projectId,
        userId: targetUser.id,
        role: parsed.data.role,
      })
      .returning();

    res.status(201).json({
      ...member,
      user: targetUser,
    });
  },
);

// PATCH /projects/:projectId/members/:userId
router.patch(
  "/projects/:projectId/members/:userId",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const params = UpdateProjectMemberRoleParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const myRole = await getProjectRole(params.data.projectId, req.dbUserId!);
    if (!myRole) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (myRole !== "admin") {
      res.status(403).json({ error: "Only admins can update member roles" });
      return;
    }

    const parsed = UpdateProjectMemberRoleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [member] = await db
      .update(projectMembersTable)
      .set({ role: parsed.data.role })
      .where(
        and(
          eq(projectMembersTable.projectId, params.data.projectId),
          eq(projectMembersTable.userId, params.data.userId),
        ),
      )
      .returning();

    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, member.userId));

    res.json({ ...member, user });
  },
);

// DELETE /projects/:projectId/members/:userId
router.delete(
  "/projects/:projectId/members/:userId",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const params = RemoveProjectMemberParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const myRole = await getProjectRole(params.data.projectId, req.dbUserId!);
    if (!myRole) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    if (myRole !== "admin") {
      res.status(403).json({ error: "Only admins can remove members" });
      return;
    }

    await db
      .delete(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.projectId, params.data.projectId),
          eq(projectMembersTable.userId, params.data.userId),
        ),
      );

    res.sendStatus(204);
  },
);

export default router;
