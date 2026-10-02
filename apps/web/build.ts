import { createBuilder } from "vite";
import type { VitePluginPWAAPI } from "vite-plugin-pwa";
const builder = await createBuilder();
await builder.buildApp();
// TanStack's environment build finishes on SSR. Generate the worker once after both outputs.
const pwa = builder.config.plugins.find(
  (plugin) => plugin.name === "vite-plugin-pwa",
)?.api as VitePluginPWAAPI | undefined;
if (!pwa) throw new Error("PWA build plugin missing");
await pwa.generateSW();
