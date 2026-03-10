const OPFS_DIR = "ustafix-media";

let opfsSupported: boolean | null = null;

async function checkOpfsSupport(): Promise<boolean> {
  if (opfsSupported !== null) return opfsSupported;
  try {
    const root = await navigator.storage.getDirectory();
    await root.getDirectoryHandle(OPFS_DIR, { create: true });
    opfsSupported = true;
  } catch {
    opfsSupported = false;
  }
  return opfsSupported;
}

async function getMediaDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(OPFS_DIR, { create: true });
}

export async function saveBlob(id: string, blob: Blob): Promise<string> {
  const supported = await checkOpfsSupport();
  if (!supported) {
    throw new Error("OPFS not supported");
  }

  const dir = await getMediaDir();
  const fileHandle = await dir.getFileHandle(id, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  return `${OPFS_DIR}/${id}`;
}

export async function loadBlob(id: string): Promise<File | null> {
  const supported = await checkOpfsSupport();
  if (!supported) return null;

  try {
    const dir = await getMediaDir();
    const fileHandle = await dir.getFileHandle(id);
    return fileHandle.getFile();
  } catch {
    return null;
  }
}

export async function deleteBlob(id: string): Promise<void> {
  const supported = await checkOpfsSupport();
  if (!supported) return;

  try {
    const dir = await getMediaDir();
    await dir.removeEntry(id);
  } catch {
    // already deleted
  }
}

export async function isOpfsAvailable(): Promise<boolean> {
  return checkOpfsSupport();
}
