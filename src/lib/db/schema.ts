import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const projectStatusEnum = pgEnum("project_status", [
  "aktiv",
  "abgeschlossen",
]);

export const memberRoleEnum = pgEnum("member_role", [
  "admin",
  "manager",
  "worker",
]);

export const defectStatusEnum = pgEnum("defect_status", [
  "offen",
  "in_arbeit",
  "erledigt",
]);

export const defectPriorityEnum = pgEnum("defect_priority", [
  "niedrig",
  "mittel",
  "hoch",
]);

export const mediaTypeEnum = pgEnum("media_type", [
  "image",
  "video",
  "audio",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  address: text("address"),
  status: projectStatusEnum("status").default("aktiv").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    role: memberRoleEnum("role").default("worker").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("project_user_unique").on(table.projectId, table.userId),
  ]
);

export const units = pgTable("units", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const defects = pgTable(
  "defects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    descriptionOriginal: text("description_original"),
    descriptionDe: text("description_de"),
    descriptionTr: text("description_tr"),
    descriptionRu: text("description_ru"),
    status: defectStatusEnum("status").default("offen").notNull(),
    priority: defectPriorityEnum("priority").default("mittel").notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_defects_project").on(table.projectId),
    index("idx_defects_status").on(table.projectId, table.status),
  ]
);

export const defectMedia = pgTable(
  "defect_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    defectId: uuid("defect_id")
      .references(() => defects.id, { onDelete: "cascade" })
      .notNull(),
    type: mediaTypeEnum("type").notNull(),
    storagePath: text("storage_path").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_media_defect").on(table.defectId)]
);

export const defectComments = pgTable(
  "defect_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    defectId: uuid("defect_id")
      .references(() => defects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_defect_comments_defect").on(table.defectId)]
);

export type Organization = typeof organizations.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Defect = typeof defects.$inferSelect;
export type DefectMedia = typeof defectMedia.$inferSelect;
export type DefectComment = typeof defectComments.$inferSelect;
export type DefectStatus = "offen" | "in_arbeit" | "erledigt";
export type DefectPriority = "niedrig" | "mittel" | "hoch";
export type MemberRole = "admin" | "manager" | "worker";
