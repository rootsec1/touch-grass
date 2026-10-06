import { beforeEach, expect, mock, test } from "bun:test";

const records = new Map<string, unknown>();
let rejectWrites = false;
function containsBlob(value: unknown): boolean {
  if (value instanceof Blob) return true;
  return Boolean(
    value &&
    typeof value === "object" &&
    Object.values(value).some(containsBlob),
  );
}
mock.module("idb-keyval", () => ({
  get: async (key: string) => records.get(key),
  set: async (key: string, value: unknown) => {
    // Reproduce WebKit's null rejection when persisting Blobs, without
    // weakening the requirement that a draft really reaches durable storage.
    if (rejectWrites || containsBlob(value)) throw null;
    records.set(key, structuredClone(value));
  },
  entries: async () => [...records.entries()],
  del: async (key: string) => {
    records.delete(key);
  },
}));
mock.module("../src/lib/api", () => ({ api: {}, uploadPhoto: async () => {} }));
const { cachePhoto, readPhoto } = await import("../src/lib/photo-storage");
const { newDraft, saveDraft, readDraft, getDrafts, clearAccountCache } =
  await import("../src/lib/journal");
const bytes = new Uint8Array([0xff, 0xd8, 0x00, 0x0a, 0xff, 0xd9]);
const image = () => new Blob([bytes], { type: "image/jpeg" });
beforeEach(() => {
  records.clear();
  rejectWrites = false;
});

test("drafts persist without Blobs and round-trip original photo bytes and metadata", async () => {
  const draft = {
    ...newDraft("owner"),
    photos: [{ id: "photo", blob: image() }],
    notes: "A leaf",
    discoveryId: "return-visit",
  };
  await saveDraft(draft);
  expect(containsBlob(records.get(`draft:${draft.id}`))).toBe(false);
  const restored = (await readDraft(draft.id))!;
  expect(restored.notes).toBe("A leaf");
  expect(restored.discoveryId).toBe("return-visit");
  expect(restored.photos[0]!.blob.type).toBe("image/jpeg");
  expect(new Uint8Array(await restored.photos[0]!.blob.arrayBuffer())).toEqual(
    bytes,
  );
  expect((await getDrafts("owner"))[0]!.photos[0]!.blob).toBeInstanceOf(Blob);
  expect(await getDrafts("other")).toEqual([]);
});
test("legacy Blob drafts and cached photos remain readable and migrate on write", async () => {
  const draft = { ...newDraft(null), photos: [{ id: "old", blob: image() }] };
  records.set(`draft:${draft.id}`, draft);
  records.set("photo:owner:old", image());
  const restored = (await readDraft(draft.id))!;
  expect(await restored.photos[0]!.blob.arrayBuffer()).toEqual(
    await image().arrayBuffer(),
  );
  expect((await getDrafts("owner"))[0]!.id).toBe(draft.id);
  expect(await (await readPhoto("owner", "old"))!.arrayBuffer()).toEqual(
    await image().arrayBuffer(),
  );
  await saveDraft(restored);
  expect(containsBlob(records.get(`draft:${draft.id}`))).toBe(false);
});
test("private photo bytes stay account-scoped and sign-out preserves unsynced drafts", async () => {
  const draft = {
    ...newDraft("owner"),
    photos: [{ id: "draft-photo", blob: image() }],
  };
  await saveDraft(draft);
  await cachePhoto("owner", "saved", image());
  await cachePhoto("other", "saved", image());
  expect(containsBlob(records.get("photo:owner:saved"))).toBe(false);
  expect(await (await readPhoto("owner", "saved"))!.arrayBuffer()).toEqual(
    await image().arrayBuffer(),
  );
  expect(await readPhoto("stranger", "saved")).toBeUndefined();
  await clearAccountCache("owner");
  expect(await readPhoto("owner", "saved")).toBeUndefined();
  expect(await readPhoto("other", "saved")).toBeInstanceOf(Blob);
  expect(await readDraft(draft.id)).toBeDefined();
});
test("storage failure is reported as persistence failure and does not overwrite the prior draft", async () => {
  const draft = {
    ...newDraft("owner"),
    photos: [{ id: "photo", blob: image() }],
  };
  await saveDraft(draft);
  rejectWrites = true;
  await expect(saveDraft({ ...draft, notes: "not yet saved" })).rejects.toThrow(
    "Couldn't save this draft on your device",
  );
  expect((await readDraft(draft.id))!.notes).toBe("");
});
