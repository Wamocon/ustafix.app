import {
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_AUDIO_SIZE,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  ACCEPTED_AUDIO_TYPES,
  formatFileSize,
} from "@/lib/utils";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateMediaFile(file: File): ValidationResult {
  if (file.type.startsWith("image/")) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Bildformat nicht unterstützt. Erlaubt: JPEG, PNG, WebP.`,
      };
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: `Bild zu groß (${formatFileSize(file.size)}). Maximal ${formatFileSize(MAX_IMAGE_SIZE)} erlaubt.`,
      };
    }
    return { valid: true };
  }

  if (file.type.startsWith("video/")) {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Videoformat nicht unterstützt. Erlaubt: MP4, MOV, WebM.`,
      };
    }
    if (file.size > MAX_VIDEO_SIZE) {
      return {
        valid: false,
        error: `Video zu groß (${formatFileSize(file.size)}). Maximal ${formatFileSize(MAX_VIDEO_SIZE)} erlaubt. Bitte kürzer aufnehmen.`,
      };
    }
    return { valid: true };
  }

  if (file.type.startsWith("audio/")) {
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Audioformat nicht unterstützt.`,
      };
    }
    if (file.size > MAX_AUDIO_SIZE) {
      return {
        valid: false,
        error: `Audiodatei zu groß (${formatFileSize(file.size)}). Maximal ${formatFileSize(MAX_AUDIO_SIZE)} erlaubt.`,
      };
    }
    return { valid: true };
  }

  return { valid: false, error: "Dateityp nicht unterstützt." };
}
