import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users.js";
import { projectsTable } from "./projects.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
export const projectMembersTable = pgTable("project_members", {
    id: serial("id").primaryKey(),
    projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    unique().on(t.projectId, t.userId),
]);
export const insertProjectMemberSchema = createInsertSchema(projectMembersTable).omit({ id: true, joinedAt: true });
