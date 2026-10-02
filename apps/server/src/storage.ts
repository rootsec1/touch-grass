import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { db } from "./services";
import { photo, discovery, visit } from "@touch-grass/db/schema/nature";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { ENV } from "./env.server";

const url = new URL(ENV.S3_URL);
const bucket = url.pathname.slice(1);
const storage = new S3Client({
  endpoint: url.origin,
  region: url.searchParams.get("region") || "us-east-1",
  forcePathStyle: url.searchParams.get("style") !== "virtual",
  credentials: {
    accessKeyId: decodeURIComponent(url.username),
    secretAccessKey: decodeURIComponent(url.password),
  },
});

export async function ensureBucket() {
  try {
    await storage.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (error) {
    if (
      error instanceof Error &&
      "\u0024metadata" in error &&
      (error as { $metadata: { httpStatusCode?: number } }).$metadata
        .httpStatusCode === 404
    ) {
      await storage.send(new CreateBucketCommand({ Bucket: bucket }));
    } else throw error;
  }
}
export const putPhoto = (key: string, bytes: Uint8Array) =>
  storage.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: bytes,
      ContentType: "image/webp",
    }),
  );
export const getPhoto = (key: string) =>
  storage.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
export const deletePhoto = (key: string) =>
  storage.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

// Keep a failed object deletion discoverable in Postgres for the next cleanup pass.
export async function cleanUnusedPhotos(ids?: string[]) {
  if (ids && !ids.length) return;
  const unused = await db
    .select()
    .from(photo)
    .where(
      and(
        ids
          ? inArray(photo.id, ids)
          : lt(photo.createdAt, new Date(Date.now() - 7 * 86400000)),
        sql`not exists (select 1 from ${discovery} where ${discovery.photoIds} @> jsonb_build_array(${photo.id}::text))`,
        sql`not exists (select 1 from ${visit} where ${visit.photoIds} @> jsonb_build_array(${photo.id}::text))`,
      ),
    );
  for (const asset of unused) {
    try {
      await deletePhoto(asset.key);
      await db.delete(photo).where(eq(photo.id, asset.id));
    } catch {
      console.error("Photo cleanup will retry");
    }
  }
}
