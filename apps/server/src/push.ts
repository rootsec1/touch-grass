import webpush from "web-push";
import { and, eq, isNull, lt, or } from "drizzle-orm";
import { discovery, pushSubscription } from "@touch-grass/db/schema/nature";
import { db } from "./services";
import { ENV } from "./env.server";

const keys = ENV.VAPID_KEYS?.split(":");
export const pushKey = keys?.[0] || null;
if (keys?.[0] && keys[1])
  webpush.setVapidDetails(
    ENV.CORS_ORIGIN.replace(/^http:/, "https:"),
    keys[0],
    keys[1],
  );

async function send(
  subscription: typeof pushSubscription.$inferSelect,
  title: string,
  body: string,
  url = "/journal",
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({ title, body, url }),
      { TTL: 86400, timeout: 10000 },
    );
    return true;
  } catch (error) {
    if (
      error instanceof webpush.WebPushError &&
      [404, 410].includes(error.statusCode)
    ) {
      await db
        .delete(pushSubscription)
        .where(eq(pushSubscription.endpoint, subscription.endpoint));
    }
    return false;
  }
}

export async function sendTestPush(userId: string) {
  if (!pushKey) return 0;
  const subscriptions = await db
    .select()
    .from(pushSubscription)
    .where(eq(pushSubscription.userId, userId));
  const results = await Promise.all(
    subscriptions.map((s) =>
      send(
        s,
        "A little closer to nature",
        "Your reminders are ready. We'll gently remind you to revisit trees you follow.",
      ),
    ),
  );
  return results.filter(Boolean).length;
}

export async function sendReminders() {
  if (!pushKey) return;
  const cutoff = new Date(Date.now() - 14 * 86400000);
  const subscriptions = await db
    .select()
    .from(pushSubscription)
    .where(
      or(
        isNull(pushSubscription.lastSentAt),
        lt(pushSubscription.lastSentAt, cutoff),
      ),
    );
  for (const subscription of subscriptions) {
    const [tree] = await db
      .select()
      .from(discovery)
      .where(
        and(
          eq(discovery.userId, subscription.userId),
          eq(discovery.followed, true),
          lt(discovery.createdAt, cutoff),
        ),
      )
      .limit(1);
    if (!tree) continue;
    // Claim before sending so overlapping scheduler runs cannot duplicate reminders.
    const claimed = await db
      .update(pushSubscription)
      .set({ lastSentAt: new Date() })
      .where(
        and(
          eq(pushSubscription.endpoint, subscription.endpoint),
          or(
            isNull(pushSubscription.lastSentAt),
            lt(pushSubscription.lastSentAt, cutoff),
          ),
        ),
      )
      .returning();
    if (claimed.length)
      await send(
        subscription,
        "Time for another look?",
        `See what's changed with ${tree.nickname || tree.commonName}.`,
        `/journal/${tree.id}`,
      );
  }
}
