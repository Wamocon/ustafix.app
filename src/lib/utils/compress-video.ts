import { MAX_VIDEO_RESOLUTION } from "@/lib/utils";

/**
 * Compresses a video to max 720p using Canvas + MediaRecorder API.
 * Falls back to original file if compression is not supported.
 */
export async function compressVideo(
  file: File,
  onProgress?: (percent: number) => void
): Promise<File> {
  if (typeof document === "undefined") return file;

  const { width, height } = await getVideoMeta(file);

  const maxWidth = 1280;
  const maxHeight = MAX_VIDEO_RESOLUTION;

  if (height <= maxHeight && width <= maxWidth) {
    return file;
  }

  const scaleW = width > maxWidth ? maxWidth / width : 1;
  const scaleH = height > maxHeight ? maxHeight / height : 1;
  const scale = Math.min(scaleW, scaleH);

  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const w = targetWidth % 2 === 0 ? targetWidth : targetWidth - 1;
  const h = targetHeight % 2 === 0 ? targetHeight : targetHeight - 1;

  try {
    return await reencodeVideo(file, w, h, onProgress);
  } catch {
    return file;
  }
}

function getVideoMeta(
  file: File
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Kann Video-Metadaten nicht lesen"));
    };

    video.src = url;
  });
}

function reencodeVideo(
  file: File,
  targetW: number,
  targetH: number,
  onProgress?: (percent: number) => void
): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      reject(new Error("Canvas nicht verfügbar"));
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";

    if (!mimeType) {
      URL.revokeObjectURL(url);
      reject(new Error("Video-Kompression nicht unterstützt"));
      return;
    }

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const stream = canvas.captureStream(24);

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_500_000,
      });

      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        const blob = new Blob(chunks, { type: "video/webm" });
        const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".webm"), {
          type: "video/webm",
        });
        resolve(compressed);
      };

      recorder.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Aufnahme fehlgeschlagen"));
      };

      recorder.start();

      function drawFrame() {
        if (video.ended || video.paused) {
          recorder.stop();
          return;
        }
        ctx!.drawImage(video, 0, 0, targetW, targetH);
        if (onProgress && isFinite(duration) && duration > 0) {
          onProgress(Math.min(99, Math.round((video.currentTime / duration) * 100)));
        }
        requestAnimationFrame(drawFrame);
      }

      video.onended = () => recorder.stop();
      video.play().then(drawFrame).catch(reject);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video konnte nicht geladen werden"));
    };

    video.src = url;
  });
}
