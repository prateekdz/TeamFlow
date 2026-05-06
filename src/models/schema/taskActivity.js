import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { tasksTable } from "./tasks.js";
import { usersTable } from "./users.js";
import { projectsTable } from "./projects.js";
export const taskActivityTable = pgTable("task_activity", {
    id: serial("id").primaryKey(),
    taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
    projectId: integer("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
    actorId: integer("actor_id").notNull().references(() => usersTable.id),
    action: text("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
