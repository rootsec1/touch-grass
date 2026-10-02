/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
  matchPrecache,
} from "workbox-precaching";
import { registerRoute } from "workbox-routing";
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();
// Anonymous landing and app shells remain available offline. Private APIs are never HTTP-cached.
registerRoute(
  ({ request, url }) =>
    request.mode === "navigate" &&
    url.origin === self.location.origin &&
    !url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/trpc"),
  async ({ request }) => {
    try {
      const response = await fetch(request);
      if (response.status >= 500) throw new Error("Server unavailable");
      return response;
    } catch {
      const cached = await matchPrecache(
        new URL(request.url).pathname === "/" ? "/index.html" : "/_shell.html",
      );
      return cached || Response.error();
    }
  },
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});
self.addEventListener("push", (event) => {
  let data: { title?: string; body?: string; url?: string } = {};
  try {
    data = event.data?.json() || {};
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Touch Grass", {
      body: data.body || "Time for a little fresh air?",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "gentle-revisit",
      data: { url: data.url || "/journal" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/journal",
    self.location.origin,
  );
  if (target.origin !== self.location.origin) return;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = windows.find(
        (client) => new URL(client.url).origin === target.origin,
      ) as WindowClient | undefined;
      if (existing) {
        await existing.navigate(target.href);
        await existing.focus();
      } else await self.clients.openWindow(target.href);
    })(),
  );
});
