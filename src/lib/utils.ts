import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 15 * 1024 * 1024; // 15MB
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB (Groq limit)
export const MAX_VIDEO_DURATION = 30; // seconds
export const MAX_VIDEO_RESOLUTION = 720; // max height in pixels
export const IMAGE_COMPRESSION_MAX_PX = 1920;
export const IMAGE_COMPRESSION_MAX_MB = 2;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const ACCEPTED_AUDIO_TYPES = ["audio/mp4", "audio/webm", "audio/mpeg", "audio/wav"];

export type TransitionRule = {
  requiresMedia: boolean;
  requiresNote: boolean;
  allowedRoles: ("admin" | "manager" | "worker")[];
  label: string;
  labelKey: string;
};

export const TRANSITION_RULES: Record<string, TransitionRule> = {
  "offen->in_arbeit": {
    requiresMedia: true,
    requiresNote: true,
    allowedRoles: ["admin", "manager", "worker"],
    label: "Arbeit beginnen",
    labelKey: "statusModal.label.workBegin",
  },
  "in_arbeit->erledigt": {
    requiresMedia: true,
    requiresNote: true,
    allowedRoles: ["admin", "manager"],
    label: "Als erledigt markieren",
    labelKey: "statusModal.label.markDone",
  },
  "in_arbeit->problem": {
    requiresMedia: false,
    requiresNote: true,
    allowedRoles: ["admin", "manager", "worker"],
    label: "Problem melden",
    labelKey: "statusModal.label.reportProblem",
  },
  "erledigt->problem": {
    requiresMedia: true,
    requiresNote: true,
    allowedRoles: ["admin", "manager"],
    label: "Problem festgestellt",
    labelKey: "statusModal.label.foundProblem",
  },
  "problem->in_arbeit": {
    requiresMedia: false,
    requiresNote: true,
    allowedRoles: ["admin", "manager", "worker"],
    label: "Erneut bearbeiten",
    labelKey: "statusModal.label.rework",
  },
  "problem->offen": {
    requiresMedia: false,
    requiresNote: true,
    allowedRoles: ["admin", "manager"],
    label: "Zurück auf Offen",
    labelKey: "statusModal.label.backToOpen",
  },
  "erledigt->offen": {
    requiresMedia: false,
    requiresNote: true,
    allowedRoles: ["admin", "manager"],
    label: "Mangel wiedereröffnen",
    labelKey: "statusModal.label.reopenDefect",
  },
  "in_arbeit->offen": {
    requiresMedia: false,
    requiresNote: true,
    allowedRoles: ["admin", "manager", "worker"],
    label: "Arbeit stoppen",
    labelKey: "statusModal.label.stopWork",
  },
  "offen->erledigt": {
    requiresMedia: true,
    requiresNote: true,
    allowedRoles: ["admin", "manager"],
    label: "Direkt als erledigt markieren",
    labelKey: "statusModal.label.directDone",
  },
};

export function getTransitionRule(
  from: string,
  to: string
): TransitionRule | null {
  return TRANSITION_RULES[`${from}->${to}`] ?? null;
}
