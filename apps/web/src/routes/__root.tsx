import type { QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  useLocation,
  Outlet,
  Scripts,
  Link,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { Toaster } from "@touch-grass/ui/components/toast";
import { Button } from "@touch-grass/ui/components/button";
import { Shell } from "@/components/shell";
import { PwaProvider } from "@/lib/pwa";
import appCss from "../index.css?url";
export interface RouterAppContext {
  queryClient: QueryClient;
}
export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Touch Grass — A little closer to nature" },
      {
        name: "description",
        content:
          "Meet the trees around you. Identify plants, keep a private nature journal, and watch your discoveries change with the seasons.",
      },
      { name: "robots", content: "noindex, follow" },
      { name: "theme-color", content: "#445b35" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon.svg" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  component: () => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <PwaProvider>
          <Toaster>
            <RouteLayout />
          </Toaster>
        </PwaProvider>
        <Scripts />
      </body>
    </html>
  ),
  notFoundComponent: () => (
    <div className="page page-narrow">
      <h1 className="detail-title">A little off the path.</h1>
      <p className="my-5">
        We couldn't find that page. Your next discovery is still out there.
      </p>
      <Button nativeButton={false} render={<Link to="/" />}>
        Back to the clearing
      </Button>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="page page-narrow">
      <h1 className="detail-title">Let's take that again.</h1>
      <p className="my-5">
        Something interrupted this page. Your saved drafts are still on this
        device.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  ),
});

function RouteLayout() {
  const path = useLocation({ select: (location) => location.pathname });
  return path === "/" ? (
    <Outlet />
  ) : (
    <Shell>
      <Outlet />
    </Shell>
  );
}
