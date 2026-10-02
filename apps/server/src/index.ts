import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@touch-grass/api/routers/index";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { and, eq, lt, sql } from "drizzle-orm";
import sharp from "sharp";
import { z } from "zod";
import { photo, rateLimit } from "@touch-grass/db/schema/nature";
import { MAX_PHOTO_BYTES } from "@touch-grass/api/domain";

import { createContext } from "./context";
import { ENV } from "./env.server";
import { auth, db } from "./services";
import {
  ensureBucket,
  putPhoto,
  getPhoto,
  deletePhoto,
  cleanUnusedPhotos,
} from "./storage";
import { sendReminders } from "./push";

const app = new Hono();

app.use(
  bodyLimit({
    maxSize: MAX_PHOTO_BYTES * 4,
    onError: (c) =>
      c.json(
        { error: "These photos are too large. Choose smaller images." },
        413,
      ),
  }),
);
app.use(async (c, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    const origin = c.req.header("origin");
    if (origin && origin !== ENV.CORS_ORIGIN)
      return c.json({ error: "Untrusted origin" }, 403);
  }
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "same-origin");
});
app.use(
  "/*",
  cors({
    origin: ENV.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", async (c) => auth.handler(c.req.raw));

app.post("/api/photos", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session)
    return c.json({ error: "Sign in to back up photographs." }, 401);
  const body = await c.req.parseBody();
  const id = z.uuid().safeParse(body.id);
  if (
    !id.success ||
    !(body.file instanceof File) ||
    body.file.size > MAX_PHOTO_BYTES ||
    !body.file.type.startsWith("image/")
  )
    return c.json({ error: "Choose a valid image under 8 MB." }, 400);
  const [existing] = await db.select().from(photo).where(eq(photo.id, id.data));
  if (existing)
    return existing.userId === session.user.id
      ? c.json({ id: existing.id })
      : c.json({ error: "Photo already exists" }, 409);
  let bytes: Buffer;
  try {
    bytes = await sharp(await body.file.arrayBuffer(), {
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize(1800, 1800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return c.json(
      {
        error:
          "We couldn't read this image. Try a JPEG, PNG, or WebP photograph.",
      },
      400,
    );
  }
  const key = `${session.user.id}/${id.data}/${crypto.randomUUID()}.webp`;
  await putPhoto(key, bytes);
  try {
    const inserted = await db
      .insert(photo)
      .values({ id: id.data, userId: session.user.id, key })
      .onConflictDoNothing()
      .returning();
    if (!inserted.length) {
      await deletePhoto(key);
      const [winner] = await db
        .select()
        .from(photo)
        .where(eq(photo.id, id.data));
      if (winner?.userId !== session.user.id)
        return c.json({ error: "Photo already exists" }, 409);
    }
  } catch (error) {
    await deletePhoto(key);
    throw error;
  }
  return c.json({ id: id.data });
});

app.get("/api/photos/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Sign in required" }, 401);
  const id = z.uuid().safeParse(c.req.param("id"));
  if (!id.success) return c.notFound();
  const [asset] = await db
    .select()
    .from(photo)
    .where(and(eq(photo.id, id.data), eq(photo.userId, session.user.id)));
  if (!asset) return c.notFound();
  const object = await getPhoto(asset.key);
  if (!object.Body) return c.notFound();
  c.header("Content-Type", "image/webp");
  c.header("Cache-Control", "private, no-store");
  return c.body(
    new Uint8Array(await object.Body.transformToByteArray()).buffer,
  );
});

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/healthz", async (c) => {
  try {
    await db.execute(sql`select 1`);
    return c.json({ status: "ok" });
  } catch {
    return c.json({ status: "unavailable" }, 503);
  }
});

app.onError((error, c) => {
  console.error("Request failed:", error.name);
  return c.json(
    {
      error:
        "Something went wrong. Your local photos are safe. Please try again.",
    },
    500,
  );
});

await ensureBucket();
const reminders = setInterval(
  () => {
    void cleanUnusedPhotos();
    void sendReminders().catch(() => console.error("Reminder delivery failed"));
    void db
      .delete(rateLimit)
      .where(lt(rateLimit.expiresAt, new Date()))
      .catch(() => console.error("Rate-limit cleanup failed"));
  },
  60 * 60 * 1000,
);
reminders.unref();
export default { port: ENV.PORT, fetch: app.fetch };
