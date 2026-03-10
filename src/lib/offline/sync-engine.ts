import { offlineDb, type SyncStatus } from "./db";
import { loadBlob, deleteBlob } from "./opfs";
import { createClient } from "@/lib/supabase/client";

const MAX_RETRIES = 3;
const POLL_INTERVAL_MS = 30_000;
const LOCK_NAME = "ustafix-sync-lock";

type SyncListener = (state: SyncState) => void;

export interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncAt: string | null;
}

class SyncEngine {
  private listeners = new Set<SyncListener>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private state: SyncState = {
    isSyncing: false,
    pendingCount: 0,
    failedCount: 0,
    lastSyncAt: null,
  };
  private started = false;

  start() {
    if (this.started || typeof window === "undefined") return;
    this.started = true;

    window.addEventListener("online", this.handleOnline);
    document.addEventListener("visibilitychange", this.handleVisibility);
    this.pollTimer = setInterval(() => this.trySync(), POLL_INTERVAL_MS);

    this.refreshCounts();
    if (navigator.onLine) this.trySync();
  }

  stop() {
    if (!this.started) return;
    this.started = false;

    window.removeEventListener("online", this.handleOnline);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): SyncState {
    return this.state;
  }

  async refreshCounts() {
    const pendingCount = await this.countPending();
    const failedCount = await this.countFailed();
    this.updateState({ pendingCount, failedCount });
  }

  private handleOnline = () => {
    this.trySync();
  };

  private handleVisibility = () => {
    if (document.visibilityState === "visible" && navigator.onLine) {
      this.trySync();
    }
  };

  private updateState(partial: Partial<SyncState>) {
    this.state = { ...this.state, ...partial };
    for (const fn of this.listeners) fn(this.state);
  }

  async trySync() {
    if (!navigator.onLine || this.state.isSyncing) return;

    if ("locks" in navigator) {
      try {
        await navigator.locks.request(
          LOCK_NAME,
          { ifAvailable: true },
          async (lock) => {
            if (!lock) return;
            await this.executeSyncCycle();
          }
        );
      } catch {
        await this.executeSyncCycle();
      }
    } else {
      await this.executeSyncCycle();
    }
  }

  private async executeSyncCycle() {
    this.updateState({ isSyncing: true });

    try {
      await this.syncDefects();
      await this.syncDefectMedia();
      await this.syncTransitions();
      await this.syncTransitionMedia();
      await this.syncPhaseUpdates();
      await this.syncPhaseUpdateMedia();
      await this.syncVoice();
      this.updateState({ lastSyncAt: new Date().toISOString() });
    } catch (err) {
      console.error("[sync] cycle error:", err);
    } finally {
      await this.refreshCounts();
      this.updateState({ isSyncing: false });
    }
  }

  private async syncDefects() {
    const items = await offlineDb.pendingDefects
      .where("syncStatus")
      .anyOf(["pending", "failed"])
      .and((d) => d.retries < MAX_RETRIES)
      .toArray();

    const supabase = createClient();

    for (const item of items) {
      await offlineDb.pendingDefects.update(item.id, {
        syncStatus: "syncing" as SyncStatus,
      });

      try {
        const { error } = await supabase.from("defects").insert({
          id: item.id,
          project_id: item.projectId,
          title: item.title,
          description_original: item.descriptionOriginal,
          description_de: item.descriptionDe,
          description_tr: item.descriptionTr,
          description_ru: item.descriptionRu,
          unit_id: item.unitId || null,
          priority: item.priority,
          created_by: item.createdBy,
        });

        if (error) {
          if (error.code === "23505") {
            await offlineDb.pendingDefects.update(item.id, {
              syncStatus: "synced" as SyncStatus,
            });
          } else {
            throw error;
          }
        } else {
          await offlineDb.pendingDefects.update(item.id, {
            syncStatus: "synced" as SyncStatus,
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await offlineDb.pendingDefects.update(item.id, {
          syncStatus: "failed" as SyncStatus,
          retries: item.retries + 1,
          errorMessage: msg,
        });
      }
    }
  }

  private async syncDefectMedia() {
    const items = await offlineDb.pendingMedia
      .where("syncStatus")
      .anyOf(["pending", "failed"])
      .and((d) => d.retries < MAX_RETRIES)
      .toArray();

    const supabase = createClient();

    for (const item of items) {
      const defectSynced = await this.isDefectSynced(item.defectId);
      if (!defectSynced) continue;

      await offlineDb.pendingMedia.update(item.id, {
        syncStatus: "syncing" as SyncStatus,
      });

      try {
        const blob = await loadBlob(item.id);
        if (!blob) throw new Error("Blob not found in OPFS");

        const ext = item.fileName.split(".").pop() || "bin";
        const storagePath = `${item.projectId}/${item.defectId}/${item.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("defect-media")
          .upload(storagePath, blob, {
            contentType: item.mimeType,
            upsert: false,
          });

        if (uploadError && !uploadError.message.includes("already exists")) {
          throw uploadError;
        }

        const { data: { user } } = await supabase.auth.getUser();
        const { error: dbError } = await supabase
          .from("defect_media")
          .insert({
            defect_id: item.defectId,
            type: item.type,
            storage_path: storagePath,
            file_size: item.fileSize,
            mime_type: item.mimeType,
            created_by: user?.id ?? null,
          });

        if (dbError && dbError.code !== "23505") throw dbError;

        await offlineDb.pendingMedia.update(item.id, {
          syncStatus: "synced" as SyncStatus,
        });
        await deleteBlob(item.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await offlineDb.pendingMedia.update(item.id, {
          syncStatus: "failed" as SyncStatus,
          retries: item.retries + 1,
          errorMessage: msg,
        });
      }
    }
  }

  private async syncTransitions() {
    const items = await offlineDb.pendingTransitions
      .where("syncStatus")
      .anyOf(["pending", "failed"])
      .and((d) => d.retries < MAX_RETRIES)
      .toArray();

    const supabase = createClient();

    for (const item of items) {
      await offlineDb.pendingTransitions.update(item.id, {
        syncStatus: "syncing" as SyncStatus,
      });

      try {
        const { error: transError } = await supabase
          .from("defect_status_transitions")
          .insert({
            id: item.id,
            defect_id: item.defectId,
            from_status: item.fromStatus,
            to_status: item.toStatus,
            note: item.note,
            changed_by: item.changedBy,
          });

        if (transError && transError.code !== "23505") throw transError;

        const { error: updateError } = await supabase
          .from("defects")
          .update({
            status: item.toStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.defectId);

        if (updateError) {
          console.warn("[sync] defect status update warning:", updateError);
        }

        await offlineDb.pendingTransitions.update(item.id, {
          syncStatus: "synced" as SyncStatus,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await offlineDb.pendingTransitions.update(item.id, {
          syncStatus: "failed" as SyncStatus,
          retries: item.retries + 1,
          errorMessage: msg,
        });
      }
    }
  }

  private async syncTransitionMedia() {
    const items = await offlineDb.pendingTransitionMedia
      .where("syncStatus")
      .anyOf(["pending", "failed"])
      .and((d) => d.retries < MAX_RETRIES)
      .toArray();

    const supabase = createClient();

    for (const item of items) {
      const transitionSynced = await this.isTransitionSynced(
        item.pendingTransitionId
      );
      if (!transitionSynced) continue;

      await offlineDb.pendingTransitionMedia.update(item.id, {
        syncStatus: "syncing" as SyncStatus,
      });

      try {
        const blob = await loadBlob(item.id);
        if (!blob) throw new Error("Blob not found in OPFS");

        const ext = item.fileName.split(".").pop() || "bin";
        const storagePath = `${item.projectId}/${item.defectId}/transitions/${item.pendingTransitionId}/${item.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("defect-media")
          .upload(storagePath, blob, {
            contentType: item.mimeType,
            upsert: false,
          });

        if (uploadError && !uploadError.message.includes("already exists")) {
          throw uploadError;
        }

        const { error: dbError } = await supabase
          .from("transition_media")
          .insert({
            transition_id: item.pendingTransitionId,
            type: item.type,
            storage_path: storagePath,
            file_size: item.fileSize,
            mime_type: item.mimeType,
          });

        if (dbError && dbError.code !== "23505") throw dbError;

        await offlineDb.pendingTransitionMedia.update(item.id, {
          syncStatus: "synced" as SyncStatus,
        });
        await deleteBlob(item.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await offlineDb.pendingTransitionMedia.update(item.id, {
          syncStatus: "failed" as SyncStatus,
          retries: item.retries + 1,
          errorMessage: msg,
        });
      }
    }
  }

  private async syncVoice() {
    const items = await offlineDb.pendingVoice
      .where("syncStatus")
      .anyOf(["pending", "failed"])
      .and((d) => d.retries < MAX_RETRIES)
      .toArray();

    for (const item of items) {
      const defectSynced = await this.isDefectSynced(item.defectId);
      if (!defectSynced) continue;

      await offlineDb.pendingVoice.update(item.id, {
        syncStatus: "syncing" as SyncStatus,
      });

      try {
        const blob = await loadBlob(item.id);
        if (!blob) throw new Error("Blob not found in OPFS");

        const formData = new FormData();
        formData.append("audio", blob, item.fileName);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const voiceUrl =
          typeof window !== "undefined" &&
          window.location.hostname === "localhost"
            ? "http://localhost:3001/api/voice"
            : "/api/voice";

        const response = await fetch(voiceUrl, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Voice API error: ${response.status}`);
        }

        const data = await response.json();
        const supabase = createClient();

        if (data.transcript) {
          const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };
          if (data.transcript) updates.description_original = data.transcript;
          if (data.translations?.de) updates.description_de = data.translations.de;
          if (data.translations?.tr) updates.description_tr = data.translations.tr;
          if (data.translations?.ru) updates.description_ru = data.translations.ru;

          await supabase
            .from("defects")
            .update(updates)
            .eq("id", item.defectId);
        }

        await offlineDb.pendingVoice.update(item.id, {
          syncStatus: "synced" as SyncStatus,
        });
        await deleteBlob(item.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        const isAiError =
          msg.includes("Voice API") || msg.includes("aborted");
        await offlineDb.pendingVoice.update(item.id, {
          syncStatus: (isAiError ? "ai_failed" : "failed") as SyncStatus,
          retries: item.retries + 1,
          errorMessage: msg,
        });
      }
    }
  }

  private async syncPhaseUpdates() {
    const items = await offlineDb.pendingPhaseUpdates
      .where("syncStatus")
      .anyOf(["pending", "failed"])
      .and((d) => d.retries < MAX_RETRIES)
      .toArray();

    const supabase = createClient();

    for (const item of items) {
      await offlineDb.pendingPhaseUpdates.update(item.id, {
        syncStatus: "syncing" as SyncStatus,
      });

      try {
        const { error } = await supabase.from("phase_updates").insert({
          id: item.id,
          defect_id: item.defectId,
          project_id: item.projectId,
          phase: item.phase,
          note: item.note,
          created_by: item.createdBy,
        });

        if (error && error.code !== "23505") throw error;

        await offlineDb.pendingPhaseUpdates.update(item.id, {
          syncStatus: "synced" as SyncStatus,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await offlineDb.pendingPhaseUpdates.update(item.id, {
          syncStatus: "failed" as SyncStatus,
          retries: item.retries + 1,
          errorMessage: msg,
        });
      }
    }
  }

  private async syncPhaseUpdateMedia() {
    const items = await offlineDb.pendingPhaseUpdateMedia
      .where("syncStatus")
      .anyOf(["pending", "failed"])
      .and((d) => d.retries < MAX_RETRIES)
      .toArray();

    const supabase = createClient();

    for (const item of items) {
      const updateSynced = await this.isPhaseUpdateSynced(
        item.pendingPhaseUpdateId
      );
      if (!updateSynced) continue;

      await offlineDb.pendingPhaseUpdateMedia.update(item.id, {
        syncStatus: "syncing" as SyncStatus,
      });

      try {
        const blob = await loadBlob(item.id);
        if (!blob) throw new Error("Blob not found in OPFS");

        const ext = item.fileName.split(".").pop() || "bin";
        const storagePath = `${item.projectId}/${item.defectId}/phase-updates/${item.pendingPhaseUpdateId}/${item.id}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("defect-media")
          .upload(storagePath, blob, {
            contentType: item.mimeType,
            upsert: false,
          });

        if (uploadError && !uploadError.message.includes("already exists")) {
          throw uploadError;
        }

        const { error: dbError } = await supabase
          .from("phase_update_media")
          .insert({
            phase_update_id: item.pendingPhaseUpdateId,
            type: item.type,
            storage_path: storagePath,
            file_size: item.fileSize,
            mime_type: item.mimeType,
          });

        if (dbError && dbError.code !== "23505") throw dbError;

        await offlineDb.pendingPhaseUpdateMedia.update(item.id, {
          syncStatus: "synced" as SyncStatus,
        });
        await deleteBlob(item.id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await offlineDb.pendingPhaseUpdateMedia.update(item.id, {
          syncStatus: "failed" as SyncStatus,
          retries: item.retries + 1,
          errorMessage: msg,
        });
      }
    }
  }

  private async isPhaseUpdateSynced(updateId: string): Promise<boolean> {
    const pending = await offlineDb.pendingPhaseUpdates.get(updateId);
    return !pending || pending.syncStatus === "synced";
  }

  private async isDefectSynced(defectId: string): Promise<boolean> {
    const pending = await offlineDb.pendingDefects.get(defectId);
    return !pending || pending.syncStatus === "synced";
  }

  private async isTransitionSynced(transitionId: string): Promise<boolean> {
    const pending = await offlineDb.pendingTransitions.get(transitionId);
    return !pending || pending.syncStatus === "synced";
  }

  private async countPending(): Promise<number> {
    const [d, m, t, tm, v, pu, pum] = await Promise.all([
      offlineDb.pendingDefects
        .where("syncStatus")
        .anyOf(["pending", "syncing"])
        .count(),
      offlineDb.pendingMedia
        .where("syncStatus")
        .anyOf(["pending", "syncing"])
        .count(),
      offlineDb.pendingTransitions
        .where("syncStatus")
        .anyOf(["pending", "syncing"])
        .count(),
      offlineDb.pendingTransitionMedia
        .where("syncStatus")
        .anyOf(["pending", "syncing"])
        .count(),
      offlineDb.pendingVoice
        .where("syncStatus")
        .anyOf(["pending", "syncing"])
        .count(),
      offlineDb.pendingPhaseUpdates
        .where("syncStatus")
        .anyOf(["pending", "syncing"])
        .count(),
      offlineDb.pendingPhaseUpdateMedia
        .where("syncStatus")
        .anyOf(["pending", "syncing"])
        .count(),
    ]);
    return d + m + t + tm + v + pu + pum;
  }

  private async countFailed(): Promise<number> {
    const [d, m, t, tm, v, pu, pum] = await Promise.all([
      offlineDb.pendingDefects
        .where("syncStatus")
        .anyOf(["failed", "ai_failed"])
        .count(),
      offlineDb.pendingMedia
        .where("syncStatus")
        .anyOf(["failed", "ai_failed"])
        .count(),
      offlineDb.pendingTransitions
        .where("syncStatus")
        .anyOf(["failed", "ai_failed"])
        .count(),
      offlineDb.pendingTransitionMedia
        .where("syncStatus")
        .anyOf(["failed", "ai_failed"])
        .count(),
      offlineDb.pendingVoice
        .where("syncStatus")
        .anyOf(["failed", "ai_failed"])
        .count(),
      offlineDb.pendingPhaseUpdates
        .where("syncStatus")
        .anyOf(["failed", "ai_failed"])
        .count(),
      offlineDb.pendingPhaseUpdateMedia
        .where("syncStatus")
        .anyOf(["failed", "ai_failed"])
        .count(),
    ]);
    return d + m + t + tm + v + pu + pum;
  }
}

export const syncEngine = new SyncEngine();
