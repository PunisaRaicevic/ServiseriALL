import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, date, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey(),
  userName: text("user_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("client_id").primaryKey(),
  name: text("client_name").notNull(),
  email: text("client_email"),
  phone: text("client_phone"),
  address: text("client_address"),
  pib: text("client_pib"),
  pdv: text("client_pdv"),
  account: text("client_account"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const appliances = pgTable("appliances", {
  id: varchar("appliance_id").primaryKey(),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("appliance_name").notNull(),
  maker: text("appliance_maker"),
  iga: integer("appliance_iga"),
  serialNumber: text("appliance_serial_number"),
  picture: text("appliance_picture"),
  lastServiceDate: date("last_service_date"),
  nextServiceDate: date("next_service_date"),
  location: text("appliance_location"),
  installDate: date("appliance_install_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("task_id").primaryKey(),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  applianceId: varchar("appliance_id").references(() => appliances.id, { onDelete: "set null" }),
  userId: varchar("user_id").references(() => profiles.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"),
  taskType: text("task_type").notNull().default("one-time"),
  description: text("task_description").notNull(),
  dueDate: date("task_due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  reportId: varchar("report_id"),
});

export const reports = pgTable("reports", {
  id: varchar("report_id").primaryKey(),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => profiles.id, { onDelete: "set null" }),
  description: text("description"),
  photos: json("photos"),
  sparePartsUsed: json("spare_parts_used"),
  workDuration: integer("work_duration"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("document_id").primaryKey(),
  name: text("document_name").notNull(),
  url: text("document_url").notNull(),
  type: text("document_type"),
  uploadedBy: varchar("uploaded_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const spareParts = pgTable("spare_parts", {
  id: varchar("spare_part_id").primaryKey(),
  name: text("spare_part_name").notNull(),
  maker: text("spare_part_maker"),
  detail: text("spare_part_detail"),
  picture: text("spare_part_picture"),
  quantity: integer("spare_part_quantity").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertApplianceSchema = createInsertSchema(appliances).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, completedAt: true, reportId: true });
export const insertReportSchema = createInsertSchema(reports).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertSparePartSchema = createInsertSchema(spareParts).omit({ id: true, createdAt: true });

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Appliance = typeof appliances.$inferSelect;
export type InsertAppliance = z.infer<typeof insertApplianceSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type SparePart = typeof spareParts.$inferSelect;
export type InsertSparePart = z.infer<typeof insertSparePartSchema>;

export type User = Profile;
