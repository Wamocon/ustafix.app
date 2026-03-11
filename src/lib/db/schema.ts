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
  "problem",
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

export const mediaPhaseEnum = pgEnum("media_phase", [
  "erfassung",
  "fortschritt",
  "abnahme",
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
    phase: mediaPhaseEnum("phase").default("erfassung").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_media_defect").on(table.defectId),
    index("idx_media_phase").on(table.defectId, table.phase),
  ]
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

export const defectStatusTransitions = pgTable(
  "defect_status_transitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    defectId: uuid("defect_id")
      .references(() => defects.id, { onDelete: "cascade" })
      .notNull(),
    fromStatus: defectStatusEnum("from_status").notNull(),
    toStatus: defectStatusEnum("to_status").notNull(),
    note: text("note").notNull(),
    changedBy: uuid("changed_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_transitions_defect").on(table.defectId),
    index("idx_transitions_created").on(table.defectId, table.createdAt),
  ]
);

export const transitionMedia = pgTable(
  "transition_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transitionId: uuid("transition_id")
      .references(() => defectStatusTransitions.id, { onDelete: "cascade" })
      .notNull(),
    type: mediaTypeEnum("type").notNull(),
    storagePath: text("storage_path").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    phase: mediaPhaseEnum("phase").default("fortschritt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_transition_media").on(table.transitionId)]
);

export const phaseUpdates = pgTable(
  "phase_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    defectId: uuid("defect_id")
      .references(() => defects.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    phase: mediaPhaseEnum("phase").notNull(),
    note: text("note").notNull(),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_phase_updates_defect").on(table.defectId, table.createdAt)]
);

export const phaseUpdateMedia = pgTable(
  "phase_update_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    phaseUpdateId: uuid("phase_update_id")
      .references(() => phaseUpdates.id, { onDelete: "cascade" })
      .notNull(),
    type: mediaTypeEnum("type").notNull(),
    storagePath: text("storage_path").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_phase_update_media").on(table.phaseUpdateId)]
);

export type Organization = typeof organizations.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Defect = typeof defects.$inferSelect;
export type DefectMedia = typeof defectMedia.$inferSelect;
export type DefectComment = typeof defectComments.$inferSelect;
export type DefectStatusTransition = typeof defectStatusTransitions.$inferSelect;
export type TransitionMedia = typeof transitionMedia.$inferSelect;
export const acceptanceVerdictEnum = pgEnum("acceptance_verdict", [
  "akzeptiert",
  "beanstandet",
  "zurueckgestellt",
]);

export const acceptanceProtocols = pgTable(
  "acceptance_protocols",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    location: text("location"),
    inspectionDate: timestamp("inspection_date", { withTimezone: true })
      .defaultNow()
      .notNull(),
    participants: text("participants").notNull(),
    generalNotes: text("general_notes"),
    consentClause: text("consent_clause")
      .default(
        "Beide Parteien stimmen der elektronischen Form dieses Protokolls zu."
      )
      .notNull(),
    signatureContractor: text("signature_contractor"),
    signatureClient: text("signature_client"),
    integrityHash: text("integrity_hash"),
    pdfStoragePath: text("pdf_storage_path"),
    supersedesId: uuid("supersedes_id"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_protocols_project").on(table.projectId),
    index("idx_protocols_unit").on(table.unitId),
  ]
);

export const protocolDefectVerdicts = pgTable(
  "protocol_defect_verdicts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    protocolId: uuid("protocol_id")
      .references(() => acceptanceProtocols.id, { onDelete: "cascade" })
      .notNull(),
    defectId: uuid("defect_id")
      .references(() => defects.id, { onDelete: "cascade" })
      .notNull(),
    verdict: acceptanceVerdictEnum("verdict").notNull(),
    correctionDeadline: timestamp("correction_deadline", { withTimezone: true }),
    note: text("note"),
  },
  (table) => [
    index("idx_verdicts_protocol").on(table.protocolId),
    unique("verdict_protocol_defect").on(table.protocolId, table.defectId),
  ]
);

export type AcceptanceProtocol = typeof acceptanceProtocols.$inferSelect;
export type ProtocolDefectVerdict = typeof protocolDefectVerdicts.$inferSelect;
export type AcceptanceVerdict = "akzeptiert" | "beanstandet" | "zurueckgestellt";
export type PhaseUpdate = typeof phaseUpdates.$inferSelect;
export type PhaseUpdateMedia = typeof phaseUpdateMedia.$inferSelect;
export type MediaPhase = "erfassung" | "fortschritt" | "abnahme";
export type DefectStatus = "offen" | "in_arbeit" | "erledigt" | "problem";
export type DefectPriority = "niedrig" | "mittel" | "hoch";
export type MemberRole = "admin" | "manager" | "worker";

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

export const projectInvitations = pgTable(
  "project_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    email: text("email").notNull(),
    role: memberRoleEnum("role").default("worker").notNull(),
    token: text("token").notNull().unique(),
    invitedBy: uuid("invited_by").notNull(),
    status: invitationStatusEnum("status").default("pending").notNull(),
    acceptedBy: uuid("accepted_by"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_invitations_project").on(table.projectId),
    index("idx_invitations_token").on(table.token),
    index("idx_invitations_status").on(table.projectId, table.status),
  ]
);

export type ProjectInvitation = typeof projectInvitations.$inferSelect;
export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";
