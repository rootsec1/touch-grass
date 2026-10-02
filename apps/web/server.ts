import { resolve, sep } from "node:path";
const { default: app } = await import("./dist/server/server.js");
const publicRoot = resolve(import.meta.dir, "dist/client");
Bun.serve({
  port: 4311,
  hostname: "0.0.0.0",
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/trpc/")) {
      url.protocol = "http:";
      url.host = "127.0.0.1:4310";
      try {
        return await fetch(new Request(url, request), { redirect: "manual" });
      } catch {
        return Response.json(
          {
            error:
              "The journal is temporarily unavailable. Your local draft is safe.",
          },
          { status: 503 },
        );
      }
    }
    let path: string;
    try {
      path = resolve(publicRoot, `.${decodeURIComponent(url.pathname)}`);
    } catch {
      return new Response("Bad path", { status: 400 });
    }
    if (path.startsWith(publicRoot + sep)) {
      const file = Bun.file(path);
      if (await file.exists())
        return new Response(file, {
          headers: {
            "Cache-Control": url.pathname.startsWith("/assets/")
              ? "public,max-age=31536000,immutable"
              : "no-cache",
          },
        });
    }
    return app.fetch(request);
  },
});
console.log("Touch Grass is ready at http://localhost:4311");
