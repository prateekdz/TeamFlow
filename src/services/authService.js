import { clerkClient } from "@clerk/express";
import { db, usersTable } from "../models/index.js";
import { eq } from "drizzle-orm";

/**
 * Upsert the authenticated Clerk user into the local database.
 * Uses Clerk's backend API to get real name/email when session claims are empty.
 *
 * @param {import("@clerk/express").AuthObject | null | undefined} auth
 * @returns {Promise<{ clerkId: string, dbUserId: number }>}
 */
export async function syncAuthenticatedUser(auth) {
  const clerkId = auth?.userId;

  if (!clerkId) {
    const error = new Error("Unauthorized");
    error.status = 401;
    throw error;
  }

  // Try session claims first (fast path — no extra network call)
  let firstName = auth.sessionClaims?.first_name ?? "";
  let lastName = auth.sessionClaims?.last_name ?? "";
  let rawEmail = auth.sessionClaims?.email ?? auth.sessionClaims?.primary_email_address ?? "";
  let avatarUrl = auth.sessionClaims?.image_url ?? null;

  // If claims are empty (default Clerk JWT template), fetch from Clerk backend API
  if (!firstName && !lastName && !rawEmail) {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      firstName = clerkUser.firstName ?? "";
      lastName = clerkUser.lastName ?? "";
      rawEmail = clerkUser.emailAddresses?.[0]?.emailAddress ?? "";
      avatarUrl = clerkUser.imageUrl ?? null;
    } catch {
      // Non-fatal: fall back to placeholder values below
    }
  }

  const email = rawEmail || `${clerkId}@clerk.local`;
  // Only use placeholder email as name if we truly have nothing better
  const name = [firstName, lastName].filter(Boolean).join(" ") || (rawEmail || "") || clerkId;

  const [user] = await db
    .insert(usersTable)
    .values({ clerkId, name, email, avatarUrl })
    .onConflictDoUpdate({
      target: usersTable.clerkId,
      set: { name, email, avatarUrl },
    })
    .returning();

  return { clerkId, dbUserId: user.id };
}
