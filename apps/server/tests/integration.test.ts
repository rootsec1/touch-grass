import { countSpecies } from "@touch-grass/api/domain";
import { z } from "zod";
import { expect, test } from "bun:test";
import sharp from "sharp";
import { eq, inArray } from "drizzle-orm";
import app from "../src/index";
import { db } from "../src/services";
import { ENV } from "../src/env.server";
import { user } from "@touch-grass/db/schema/auth";
import { photo } from "@touch-grass/db/schema/nature";
import { cleanUnusedPhotos, getPhoto } from "../src/storage";

const origin = ENV.CORS_ORIGIN;
async function request(path: string, cookie = "", body?: unknown) {
  return app.fetch(
    new Request(`${origin}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        origin,
        cookie,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}
async function rpc(path: string, cookie: string, input?: unknown) {
  const response = await request(`/trpc/${path}`, cookie, input);
  return { status: response.status, body: await response.json() };
}
function rows(body: unknown) {
  return z
    .object({
      result: z.object({
        data: z.array(z.object({ visits: z.array(z.unknown()) })),
      }),
    })
    .parse(body).result.data;
}
test("real auth, private storage, idempotent saves, visits, ownership, deletion and recovery", async () => {
  const users: string[] = [];
  const photoIds: string[] = [];
  try {
    const health = await request("/healthz");
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ status: "ok" });
    const sessions = [];
    for (const suffix of ["a", "b"]) {
      const response = await request("/api/auth/sign-up/email", "", {
        name: "Integration QA",
        email: `qa-${crypto.randomUUID()}-${suffix}@example.com`,
        password: "NatureJournal-test-2026!",
      });
      expect(response.status).toBe(200);
      const data = z
        .object({ user: z.object({ id: z.string() }) })
        .parse(await response.json());
      users.push(data.user.id);
      sessions.push(
        response.headers
          .getSetCookie()
          .map((c) => c.split(";")[0])
          .join(";"),
      );
    }
    const [owner, other] = sessions as [string, string];
    expect((await rpc("journal.list", "")).status).toBe(401);
    const photoId = crypto.randomUUID();
    photoIds.push(photoId);
    const bytes = await sharp({
      create: { width: 40, height: 40, channels: 3, background: "#254d38" },
    })
      .png()
      .toBuffer();
    async function upload(cookie: string) {
      const data = new FormData();
      data.set("id", photoId);
      data.set(
        "file",
        new Blob(["not an image"], { type: "image/png" }),
        "sample.png",
      );
      return app.fetch(
        new Request(`${origin}/api/photos`, {
          method: "POST",
          headers: { cookie, origin },
          body: data,
        }),
      );
    }
    // Claimed image MIME types never bypass actual image decoding.
    expect((await upload(owner)).status).toBe(400);
    async function validUpload() {
      const data = new FormData();
      data.set("id", photoId);
      data.set("file", new Blob([bytes], { type: "image/png" }), "sample.png");
      return app.fetch(
        new Request(`${origin}/api/photos`, {
          method: "POST",
          headers: { cookie: owner, origin },
          body: data,
        }),
      );
    }
    const uploads = await Promise.all([validUpload(), validUpload()]);
    expect(uploads.map((r) => r.status)).toEqual([200, 200]);
    const asset = await request(`/api/photos/${photoId}`, owner);
    expect(asset.status).toBe(200);
    expect(asset.headers.get("cache-control")).toBe("private, no-store");
    expect((await sharp(await asset.arrayBuffer()).metadata()).format).toBe(
      "webp",
    );
    expect((await request(`/api/photos/${photoId}`, other)).status).toBe(404);
    expect((await request(`/api/photos/${photoId}`)).status).toBe(401);
    const id = crypto.randomUUID();
    const input = {
      id,
      photoIds: [photoId],
      commonName: "Unknown tree",
      identification: null,
      observedAt: new Date().toISOString(),
    };
    expect((await rpc("journal.create", other, input)).status).toBe(400);
    expect(
      (await rpc("journal.create", owner, { ...input, latitude: 95 })).status,
    ).toBe(400);
    const saves = await Promise.all([
      rpc("journal.create", owner, input),
      rpc("journal.create", owner, input),
    ]);
    expect(saves.map((r) => r.status)).toEqual([200, 200]);
    let list = await rpc("journal.list", owner);
    expect(rows(list.body)).toHaveLength(1);
    expect(rows((await rpc("journal.list", other)).body)).toHaveLength(0);
    const edit = {
      id,
      commonName: "Oak",
      scientificName: "Quercus",
      nickname: "Old friend",
      notes: "A quiet morning",
      place: "Test garden",
      followed: true,
    };
    expect((await rpc("journal.update", other, edit)).status).toBe(404);
    expect((await rpc("journal.update", owner, edit)).status).toBe(200);
    const visit = {
      id: crypto.randomUUID(),
      discoveryId: id,
      photoIds: [photoId],
      stage: "New leaves",
      notes: "A return visit",
      observedAt: new Date().toISOString(),
    };
    expect((await rpc("journal.addVisit", other, visit)).status).toBe(404);
    const visits = await Promise.all([
      rpc("journal.addVisit", owner, visit),
      rpc("journal.addVisit", owner, visit),
    ]);
    expect(visits.map((r) => r.status)).toEqual([200, 200]);
    list = await rpc("journal.list", owner);
    expect(rows(list.body)[0]!.visits).toHaveLength(1);
    expect(
      (
        await rpc("notifications.subscribe", owner, {
          endpoint: "http://127.0.0.1/internal",
          keys: { p256dh: "a".repeat(80), auth: "b".repeat(24) },
        })
      ).status,
    ).toBe(400);
    expect((await rpc("notifications.test", owner, {})).status).toBe(503);
    expect((await rpc("journal.remove", other, { id })).status).toBe(404);
    const [stored] = await db.select().from(photo).where(eq(photo.id, photoId));
    expect((await rpc("journal.remove", owner, { id })).status).toBe(200);
    expect(rows((await rpc("journal.list", owner)).body)).toHaveLength(0);
    expect((await request(`/api/photos/${photoId}`, owner)).status).toBe(404);
    expect(
      await db.select().from(photo).where(eq(photo.id, photoId)),
    ).toHaveLength(0);
    await expect(getPhoto(stored!.key)).rejects.toThrow();
    const csrf = await app.fetch(
      new Request(`${origin}/trpc/journal.create`, {
        method: "POST",
        headers: {
          origin: "https://untrusted.example",
          "content-type": "application/json",
          cookie: owner,
        },
        body: JSON.stringify(input),
      }),
    );
    expect(csrf.status).toBe(403);
    expect((await request("/api/auth/sign-out", owner, {})).status).toBe(200);
    expect((await rpc("journal.list", owner)).status).toBe(401);
  } finally {
    if (photoIds.length) await cleanUnusedPhotos(photoIds);
    if (users.length) await db.delete(user).where(inArray(user.id, users));
  }
}, 30000);

test("species progress counts binomials once and excludes unresolved genera", () => {
  expect(
    countSpecies([
      { scientificName: "Quercus" },
      { scientificName: "Quercus sp" },
      { scientificName: "" },
    ]),
  ).toBe(0);
  expect(
    countSpecies([
      { scientificName: "Quercus robur" },
      { scientificName: "quercus robur" },
      { scientificName: "Ficus macrophylla" },
    ]),
  ).toBe(2);
});
