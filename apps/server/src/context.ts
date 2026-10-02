import type { Context as ApiContext } from "@touch-grass/api/context";
import type { Context as HonoContext } from "hono";

import { db } from "./services";
import { auth } from "./services";
import { identify } from "./ai";
import { pushKey, sendTestPush } from "./push";
import { cleanUnusedPhotos } from "./storage";
import { getSignedCookie, setSignedCookie } from "hono/cookie";
import { ENV } from "./env.server";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({
  context,
}: CreateContextOptions): Promise<ApiContext> {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  let guest = await getSignedCookie(
    context,
    ENV.BETTER_AUTH_SECRET,
    "tg_guest",
  );
  if (!guest) {
    guest = crypto.randomUUID();
    await setSignedCookie(context, "tg_guest", guest, ENV.BETTER_AUTH_SECRET, {
      httpOnly: true,
      secure: ENV.CORS_ORIGIN.startsWith("https:"),
      sameSite: "Lax",
      maxAge: 86400,
      path: "/",
    });
  }
  return {
    cleanUnusedPhotos,
    db,
    session,
    identify,
    sendTestPush,
    publicConfig: {
      google: Boolean(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET),
      ai: Boolean(ENV.GEMINI_API_KEY),
      pushKey,
    },
    rateLimitKey: guest,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
