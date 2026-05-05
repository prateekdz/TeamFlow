import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  dbUserId?: number;
  clerkId?: string;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const auth = getAuth(req);
  const clerkId = auth?.userId;

  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.clerkId = clerkId;

  // Upsert user in our DB
  const firstName = (auth.sessionClaims?.["first_name"] as string) ?? "";
  const lastName = (auth.sessionClaims?.["last_name"] as string) ?? "";
  const email = (auth.sessionClaims?.["email"] as string) ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || email || clerkId;
  const avatarUrl = (auth.sessionClaims?.["image_url"] as string) ?? null;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);

  if (existing.length > 0) {
    req.dbUserId = existing[0].id;
  } else {
    const [created] = await db
      .insert(usersTable)
      .values({ clerkId, name, email, avatarUrl })
      .onConflictDoUpdate({
        target: usersTable.clerkId,
        set: { name, email, avatarUrl },
      })
      .returning();
    req.dbUserId = created.id;
  }

  next();
};
