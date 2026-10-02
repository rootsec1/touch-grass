import { entries, get, set, del } from "idb-keyval";
import type { Identification } from "@touch-grass/api/domain";
import { MAX_PHOTOS, stages } from "@touch-grass/api/domain";
import { api, uploadPhoto, type JournalEntry } from "./api";

export interface Draft {
  id: string;
  owner: string | null;
  photos: { id: string; blob: Blob }[];
  commonName: string;
  scientificName: string;
  nickname: string;
  notes: string;
  place: string;
  identification: Identification | null;
  latitude: number | null;
  longitude: number | null;
  stage: (typeof stages)[number];
  observedAt: string;
  discoveryId?: string;
}
export const newDraft = (
  owner: string | null,
  discoveryId?: string,
): Draft => ({
  id: crypto.randomUUID(),
  owner,
  photos: [],
  commonName: "Unknown plant",
  scientificName: "",
  nickname: "",
  notes: "",
  place: "",
  identification: null,
  latitude: null,
  longitude: null,
  stage: "Not sure",
  observedAt: new Date().toISOString(),
  discoveryId,
});
export async function getDrafts(owner: string | null) {
  return (await entries<string, Draft>())
    .filter(
      ([key, value]) =>
        key.startsWith("draft:") &&
        (value.owner === owner || value.owner === null),
    )
    .map(([, value]) => value)
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}
export const saveDraft = (draft: Draft) => set(`draft:${draft.id}`, draft);
export const removeDraft = (id: string) => del(`draft:${id}`);
export const readDraft = (id: string) => get<Draft>(`draft:${id}`);
export const cacheJournal = (userId: string, data: JournalEntry[]) =>
  set(`journal:${userId}`, data);
export const readJournal = (userId: string) =>
  get<JournalEntry[]>(`journal:${userId}`);

export async function syncDraft(draft: Draft, userId: string) {
  if (draft.owner && draft.owner !== userId)
    throw new Error("Sign in to the account that saved this draft.");
  const perform = async () => {
    const current = await readDraft(draft.id);
    if (!current) return;
    if (current.owner && current.owner !== userId)
      throw new Error("This draft belongs to another account.");
    if (!current.photos.length) throw new Error("Add a photograph first.");
    const claimed = { ...current, owner: userId };
    await saveDraft(claimed);
    await Promise.all(
      claimed.photos.map((photo) => uploadPhoto(photo.id, photo.blob)),
    );
    const photoIds = claimed.photos.map((photo) => photo.id);
    if (claimed.discoveryId) {
      await api.journal.addVisit.mutate({
        id: claimed.id,
        discoveryId: claimed.discoveryId,
        photoIds,
        notes: claimed.notes,
        stage: claimed.stage,
        observedAt: claimed.observedAt,
      });
    } else {
      const {
        owner: _owner,
        photos: _photos,
        discoveryId: _discoveryId,
        ...fields
      } = claimed;
      await api.journal.create.mutate({ ...fields, photoIds });
    }
    // Retain private photos locally for offline journal reading. The HTTP cache never stores them.
    await Promise.all(
      claimed.photos.map((photo) =>
        set(`photo:${userId}:${photo.id}`, photo.blob),
      ),
    );
    await removeDraft(claimed.id);
  };
  if (navigator.locks)
    await navigator.locks.request(`sync:${draft.id}`, perform);
  else await perform();
}
export async function clearAccountCache(userId: string) {
  const keys = (await entries())
    .map(([key]) => key)
    .filter(
      (key) =>
        typeof key === "string" &&
        (key === `journal:${userId}` || key.startsWith(`photo:${userId}:`)),
    );
  await Promise.all(keys.map((key) => del(key)));
}
export async function preparePhotos(files: FileList | File[]) {
  return Promise.all(
    Array.from(files)
      .slice(0, MAX_PHOTOS)
      .map(async (file) => {
        if (!file.type.startsWith("image/") || file.size > 25 * 1024 * 1024)
          throw new Error("Choose an image under 25 MB.");
        let bitmap: ImageBitmap;
        try {
          bitmap = await createImageBitmap(file);
        } catch {
          throw new Error(
            "This photo format isn't supported here. Try JPEG, PNG, or WebP.",
          );
        }
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas
          .getContext("2d")!
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) =>
              b ? resolve(b) : reject(new Error("Couldn't prepare the photo.")),
            "image/jpeg",
            0.85,
          ),
        );
        return { id: crypto.randomUUID(), blob };
      }),
  );
}
export async function imageInput(blob: Blob) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]!);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return {
    data,
    mimeType:
      blob.type === "image/webp"
        ? ("image/webp" as const)
        : blob.type === "image/png"
          ? ("image/png" as const)
          : ("image/jpeg" as const),
  };
}
