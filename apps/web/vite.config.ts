import { guides } from "./src/lib/guides";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 4311,
    host: "0.0.0.0",
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:4310",
      "/trpc": "http://127.0.0.1:4310",
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    varlockVitePlugin({ ssrInjectMode: "auto-load" }),
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true, maskPath: "/explore" },
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        failOnError: true,
      },
      pages: ["/", ...guides.map((guide) => `/guide/${guide.slug}`)].map(
        (path) => ({ path, prerender: { enabled: true } }),
      ),
    }),
    viteReact(),
    VitePWA({
      outDir: "dist/client",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        id: "/",
        name: "Touch Grass — Your nature journal",
        short_name: "Touch Grass",
        description: "Get to know the nature you walk past every day.",
        theme_color: "#445b35",
        background_color: "#f6f3ea",
        display: "standalone",
        start_url: "/explore",
        scope: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          {
            name: "New discovery",
            url: "/capture",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }],
          },
          { name: "My journal", url: "/journal" },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,webp}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: { enabled: true, type: "module" },
    }),
  ],
});
