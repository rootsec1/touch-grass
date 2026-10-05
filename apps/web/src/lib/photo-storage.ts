import { get, set } from "idb-keyval";

// WebKit can decode a photo but fail when IndexedDB stores a Blob. Persist
// its bytes instead; keep Blob objects at the capture/upload/display boundary.
export type StoredPhoto = { bytes: ArrayBuffer; type: string };
export type PersistedPhoto = StoredPhoto | Blob;

export async function encodePhoto(blob: Blob): Promise<StoredPhoto> {
  return { bytes: await blob.arrayBuffer(), type: blob.type };
}
export function decodePhoto(photo: PersistedPhoto): Blob {
  // Older journals and unsynced drafts already contain Blobs.
  return photo instanceof Blob
    ? photo
    : new Blob([photo.bytes], { type: photo.type });
}
export async function cachePhoto(userId: string, id: string, blob: Blob) {
  await set(`photo:${userId}:${id}`, await encodePhoto(blob));
}
export async function readPhoto(userId: string, id: string) {
  const photo = await get<PersistedPhoto>(`photo:${userId}:${id}`);
  return photo ? decodePhoto(photo) : undefined;
}
