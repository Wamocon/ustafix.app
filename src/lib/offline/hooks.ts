"use client";

import { useState, useEffect, useCallback } from "react";
import { syncEngine, type SyncState } from "./sync-engine";
import { offlineDb, type PendingDefect, type SyncStatus } from "./db";
import { saveBlob, isOpfsAvailable } from "./opfs";

export function useOfflineSync() {
  const [syncState, setSyncState] = useState<SyncState>(syncEngine.getState());
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    syncEngine.start();
    const unsubscribe = syncEngine.subscribe(setSyncState);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  const triggerSync = useCallback(() => {
    syncEngine.trySync();
  }, []);

  return { ...syncState, isOffline, triggerSync };
}

export async function saveDefectOffline(params: {
  projectId: string;
  title: string;
  descriptionOriginal?: string;
  descriptionDe?: string;
  descriptionTr?: string;
  descriptionRu?: string;
  unitId?: string;
  priority: "niedrig" | "mittel" | "hoch";
  createdBy: string;
}): Promise<string> {
  const id = crypto.randomUUID();

  await offlineDb.pendingDefects.add({
    id,
    projectId: params.projectId,
    title: params.title,
    descriptionOriginal: params.descriptionOriginal,
    descriptionDe: params.descriptionDe,
    descriptionTr: params.descriptionTr,
    descriptionRu: params.descriptionRu,
    unitId: params.unitId,
    priority: params.priority,
    createdBy: params.createdBy,
    syncStatus: "pending",
    retries: 0,
    createdAt: new Date().toISOString(),
  });

  syncEngine.refreshCounts();
  return id;
}

export async function saveMediaOffline(params: {
  defectId: string;
  projectId: string;
  file: File;
  type: "image" | "video" | "audio";
}): Promise<void> {
  const id = crypto.randomUUID();

  const opfsAvailable = await isOpfsAvailable();
  if (opfsAvailable) {
    await saveBlob(id, params.file);
  }

  await offlineDb.pendingMedia.add({
    id,
    defectId: params.defectId,
    projectId: params.projectId,
    fileName: params.file.name,
    mimeType: params.file.type,
    fileSize: params.file.size,
    type: params.type,
    opfsPath: opfsAvailable ? `ustafix-media/${id}` : undefined,
    syncStatus: "pending",
    retries: 0,
    createdAt: new Date().toISOString(),
  });

  syncEngine.refreshCounts();
}

export async function saveTransitionOffline(params: {
  defectId: string;
  projectId: string;
  fromStatus: string;
  toStatus: string;
  note: string;
  changedBy: string;
  files: File[];
}): Promise<string> {
  const transitionId = crypto.randomUUID();

  await offlineDb.pendingTransitions.add({
    id: transitionId,
    defectId: params.defectId,
    projectId: params.projectId,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    note: params.note,
    changedBy: params.changedBy,
    syncStatus: "pending",
    retries: 0,
    createdAt: new Date().toISOString(),
  });

  const opfsAvailable = await isOpfsAvailable();

  for (const file of params.files) {
    const mediaId = crypto.randomUUID();
    if (opfsAvailable) {
      await saveBlob(mediaId, file);
    }

    const type: "image" | "video" = file.type.startsWith("image/")
      ? "image"
      : "video";

    await offlineDb.pendingTransitionMedia.add({
      id: mediaId,
      pendingTransitionId: transitionId,
      defectId: params.defectId,
      projectId: params.projectId,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      type,
      opfsPath: opfsAvailable ? `ustafix-media/${mediaId}` : undefined,
      syncStatus: "pending",
      retries: 0,
      createdAt: new Date().toISOString(),
    });
  }

  syncEngine.refreshCounts();
  return transitionId;
}

export async function saveVoiceOffline(params: {
  defectId: string;
  projectId: string;
  blob: Blob;
  fileName: string;
}): Promise<void> {
  const id = crypto.randomUUID();

  const opfsAvailable = await isOpfsAvailable();
  if (opfsAvailable) {
    await saveBlob(id, params.blob);
  }

  await offlineDb.pendingVoice.add({
    id,
    defectId: params.defectId,
    projectId: params.projectId,
    fileName: params.fileName,
    mimeType: params.blob.type,
    fileSize: params.blob.size,
    opfsPath: opfsAvailable ? `ustafix-media/${id}` : undefined,
    syncStatus: "pending",
    retries: 0,
    createdAt: new Date().toISOString(),
  });

  syncEngine.refreshCounts();
}

export async function savePhaseUpdateOffline(params: {
  defectId: string;
  projectId: string;
  phase: "erfassung" | "fortschritt" | "abnahme";
  note: string;
  createdBy: string;
  files: File[];
}): Promise<string> {
  const updateId = crypto.randomUUID();

  await offlineDb.pendingPhaseUpdates.add({
    id: updateId,
    defectId: params.defectId,
    projectId: params.projectId,
    phase: params.phase,
    note: params.note,
    createdBy: params.createdBy,
    syncStatus: "pending",
    retries: 0,
    createdAt: new Date().toISOString(),
  });

  const opfsAvailable = await isOpfsAvailable();

  for (const file of params.files) {
    const mediaId = crypto.randomUUID();
    if (opfsAvailable) {
      await saveBlob(mediaId, file);
    }

    const type: "image" | "video" = file.type.startsWith("image/")
      ? "image"
      : "video";

    await offlineDb.pendingPhaseUpdateMedia.add({
      id: mediaId,
      pendingPhaseUpdateId: updateId,
      defectId: params.defectId,
      projectId: params.projectId,
      phase: params.phase,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      type,
      opfsPath: opfsAvailable ? `ustafix-media/${mediaId}` : undefined,
      syncStatus: "pending",
      retries: 0,
      createdAt: new Date().toISOString(),
    });
  }

  syncEngine.refreshCounts();
  return updateId;
}

export async function getPendingDefectsForProject(
  projectId: string
): Promise<PendingDefect[]> {
  return offlineDb.pendingDefects
    .where("projectId")
    .equals(projectId)
    .and((d) => d.syncStatus !== ("synced" as SyncStatus))
    .toArray();
}
