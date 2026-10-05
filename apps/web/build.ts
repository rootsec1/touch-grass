import { createBuilder } from "vite";
import type { VitePluginPWAAPI } from "vite-plugin-pwa";
import { SITE_URL } from "./src/lib/seo";
import { guides } from "./src/lib/guides";
const builder = await createBuilder();
await builder.buildApp();
// TanStack's environment build finishes on SSR. Generate the worker once after both outputs.
const pwa = builder.config.plugins.find(
  (plugin) => plugin.name === "vite-plugin-pwa",
)?.api as VitePluginPWAAPI | undefined;
if (!pwa) throw new Error("PWA build plugin missing");
await pwa.generateSW();

// Derive crawler files from the same public route inventory as prerendering.
const urls = ["/", ...guides.map((guide) => `/guide/${guide.slug}`)];
await Bun.write(
  "dist/client/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((path) => `<url><loc>${new URL(path, SITE_URL).href}</loc></url>`).join("")}</urlset>
`,
);
await Bun.write(
  "dist/client/robots.txt",
  `User-agent: *
Allow: /
Disallow: /api/
Disallow: /trpc/
Sitemap: ${SITE_URL}/sitemap.xml
`,
);
