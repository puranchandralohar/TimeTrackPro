import { pgTable, text, serial, integer, boolean, timestamp, decimal, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Employees table
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  employeeId: text("employee_id").notNull().unique(),
  position: text("position").notNull(),
  phone: text("phone"),
  notifications: integer("notifications").default(0),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  notifications: true,
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  channelName: text("channel_name"),
  channelId: text("channel_id"),
  projectManagerEmail: text("project_manager_email"),
  clientName: text("client_name"),
  active: boolean("active").default(true),
  priority: text("priority").default("P2"), // P0, P1, P2, P3
  budget: text("budget"),
  description: text("description"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // Store as YYYY-MM-DD format
  hours: decimal("hours", { precision: 4, scale: 2 }).notNull(),
  description: text("description").notNull(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type TimeEntry = typeof timeEntries.$inferSelect & {
  project?: Project;
};
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
