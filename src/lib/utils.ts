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

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB (Groq limit)
export const MAX_VIDEO_DURATION = 60; // seconds
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const ACCEPTED_AUDIO_TYPES = ["audio/mp4", "audio/webm", "audio/mpeg", "audio/wav"];
