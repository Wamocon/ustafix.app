import Dexie, { type EntityTable } from "dexie";

export type SyncStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "failed"
  | "ai_failed";

export interface PendingDefect {
  id: string;
  projectId: string;
  title: string;
  descriptionOriginal?: string;
  descriptionDe?: string;
  descriptionTr?: string;
  descriptionRu?: string;
  unitId?: string;
  priority: "niedrig" | "mittel" | "hoch";
  createdBy: string;
  syncStatus: SyncStatus;
  retries: number;
  createdAt: string;
  errorMessage?: string;
}

export interface PendingMedia {
  id: string;
  defectId: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  type: "image" | "video" | "audio";
  opfsPath?: string;
  syncStatus: SyncStatus;
  retries: number;
  createdAt: string;
  errorMessage?: string;
}

export interface PendingTransition {
  id: string;
  defectId: string;
  projectId: string;
  fromStatus: string;
  toStatus: string;
  note: string;
  changedBy: string;
  syncStatus: SyncStatus;
  retries: number;
  createdAt: string;
  errorMessage?: string;
}

export interface PendingTransitionMedia {
  id: string;
  pendingTransitionId: string;
  defectId: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  type: "image" | "video";
  opfsPath?: string;
  syncStatus: SyncStatus;
  retries: number;
  createdAt: string;
  errorMessage?: string;
}

export interface PendingVoice {
  id: string;
  defectId: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  opfsPath?: string;
  syncStatus: SyncStatus;
  retries: number;
  createdAt: string;
  errorMessage?: string;
}

export interface PendingPhaseUpdate {
  id: string;
  defectId: string;
  projectId: string;
  phase: "erfassung" | "fortschritt" | "abnahme";
  note: string;
  createdBy: string;
  syncStatus: SyncStatus;
  retries: number;
  createdAt: string;
  errorMessage?: string;
}

export interface PendingPhaseUpdateMedia {
  id: string;
  pendingPhaseUpdateId: string;
  defectId: string;
  projectId: string;
  phase: "erfassung" | "fortschritt" | "abnahme";
  fileName: string;
  mimeType: string;
  fileSize: number;
  type: "image" | "video";
  opfsPath?: string;
  syncStatus: SyncStatus;
  retries: number;
  createdAt: string;
  errorMessage?: string;
}

const offlineDb = new Dexie("ustafix-offline") as Dexie & {
  pendingDefects: EntityTable<PendingDefect, "id">;
  pendingMedia: EntityTable<PendingMedia, "id">;
  pendingTransitions: EntityTable<PendingTransition, "id">;
  pendingTransitionMedia: EntityTable<PendingTransitionMedia, "id">;
  pendingVoice: EntityTable<PendingVoice, "id">;
  pendingPhaseUpdates: EntityTable<PendingPhaseUpdate, "id">;
  pendingPhaseUpdateMedia: EntityTable<PendingPhaseUpdateMedia, "id">;
};

offlineDb.version(2).stores({
  pendingDefects: "id, projectId, syncStatus, createdAt",
  pendingMedia: "id, defectId, projectId, syncStatus, createdAt",
  pendingTransitions: "id, defectId, projectId, syncStatus, createdAt",
  pendingTransitionMedia:
    "id, pendingTransitionId, defectId, projectId, syncStatus, createdAt",
  pendingVoice: "id, defectId, projectId, syncStatus, createdAt",
  pendingPhaseUpdates: "id, defectId, projectId, syncStatus, createdAt",
  pendingPhaseUpdateMedia:
    "id, pendingPhaseUpdateId, defectId, projectId, syncStatus, createdAt",
});

export { offlineDb };
