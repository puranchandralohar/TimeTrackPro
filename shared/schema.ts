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

// Leave types table
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#2563EB"), // Color for UI display
});

export const insertLeaveTypeSchema = createInsertSchema(leaveTypes).omit({
  id: true,
});

// Employee leave allocations table
export const leaveAllocations = pgTable("leave_allocations", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  leaveTypeId: integer("leave_type_id").notNull().references(() => leaveTypes.id),
  allocatedDays: decimal("allocated_days", { precision: 4, scale: 1 }).notNull(),
  year: integer("year").notNull(), // The year for this allocation
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeaveAllocationSchema = createInsertSchema(leaveAllocations).omit({
  id: true,
  createdAt: true,
});

// Leave applications table
export const leaveApplications = pgTable("leave_applications", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  leaveTypeId: integer("leave_type_id").notNull().references(() => leaveTypes.id),
  fromDate: text("from_date").notNull(), // YYYY-MM-DD format
  toDate: text("to_date").notNull(),     // YYYY-MM-DD format
  isHalfDay: boolean("is_half_day").default(false),
  reason: text("reason").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  approvedById: integer("approved_by_id").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeaveApplicationSchema = createInsertSchema(leaveApplications).omit({
  id: true,
  status: true,
  approvedById: true,
  approvedAt: true,
  rejectionReason: true,
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

export type LeaveType = typeof leaveTypes.$inferSelect;
export type InsertLeaveType = z.infer<typeof insertLeaveTypeSchema>;

export type LeaveAllocation = typeof leaveAllocations.$inferSelect;
export type InsertLeaveAllocation = z.infer<typeof insertLeaveAllocationSchema>;

export type LeaveApplication = typeof leaveApplications.$inferSelect & {
  leaveType?: LeaveType;
};
export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;
