import { api } from "./api";

export async function getPushManager() {
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  const registration = await navigator.serviceWorker.getRegistration();
  // Safari tabs can have service workers without exposing the Push API.
  return registration?.pushManager;
}

export async function disableReminders() {
  const manager = await getPushManager();
  const subscription = await manager?.getSubscription();
  if (!subscription) return;
  // Attempt both removals even if the server or the browser push service fails.
  const results = await Promise.allSettled([
    api.notifications.unsubscribe.mutate({ endpoint: subscription.endpoint }),
    subscription.unsubscribe(),
  ]);
  const failed = results.find((result) => result.status === "rejected");
  if (failed?.status === "rejected") throw failed.reason;
}
