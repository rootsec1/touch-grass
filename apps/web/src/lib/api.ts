import { createTRPCClient, httpBatchLink, TRPCClientError } from "@trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@touch-grass/api/routers/index";
import { z } from "zod";
import { ENV } from "../env";

export const api = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${typeof window === "undefined" ? ENV.VITE_SERVER_URL : ""}/trpc`,
      fetch: (url, options) =>
        fetch(url, { ...options, credentials: "include" }),
    }),
  ],
});
export type JournalEntry =
  inferRouterOutputs<AppRouter>["journal"]["list"][number];
export const photoUrl = (id: string) => `/api/photos/${id}`;

export async function uploadPhoto(id: string, blob: Blob) {
  const body = new FormData();
  body.set("id", id);
  body.set("file", blob, "discovery.jpg");
  const response = await fetch("/api/photos", {
    method: "POST",
    body,
    credentials: "include",
  });
  const result = z
    .object({ id: z.uuid().optional(), error: z.string().optional() })
    .safeParse(await response.json().catch(() => null));
  if (!response.ok || !result.success || result.data.id !== id)
    throw new Error(
      result.success && result.data.error
        ? result.data.error
        : "Couldn't upload this photograph. Your draft is still on this device.",
    );
}

export function errorMessage(error: unknown, fallback: string) {
  if (error instanceof TRPCClientError && !error.data) return fallback;
  if (error instanceof TypeError) return fallback;
  return error instanceof Error ? error.message : fallback;
}
