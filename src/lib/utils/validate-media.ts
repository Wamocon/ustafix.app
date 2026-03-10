import {
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_AUDIO_SIZE,
  MAX_VIDEO_DURATION,
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

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (!isFinite(video.duration) || video.duration === 0) {
        reject(new Error("Video-Dauer konnte nicht ermittelt werden."));
        return;
      }
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video konnte nicht geladen werden."));
    };

    video.src = url;
  });
}

export function getVideoResolution(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({ width: video.videoWidth, height: video.videoHeight });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video konnte nicht geladen werden."));
    };

    video.src = url;
  });
}

export async function validateVideoConstraints(file: File): Promise<ValidationResult> {
  const basicCheck = validateMediaFile(file);
  if (!basicCheck.valid) return basicCheck;

  try {
    const duration = await getVideoDuration(file);
    if (duration > MAX_VIDEO_DURATION) {
      return {
        valid: false,
        error: `Video ist zu lang (${Math.ceil(duration)}s). Maximal ${MAX_VIDEO_DURATION} Sekunden erlaubt.`,
      };
    }
  } catch {
    return {
      valid: false,
      error: "Video konnte nicht validiert werden. Bitte versuchen Sie es mit einer anderen Datei.",
    };
  }

  return { valid: true };
}
