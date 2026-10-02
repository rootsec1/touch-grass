# Touch Grass

A mobile-first PWA for getting to know the trees and plants around you. Take up to three photographs, ask Gemini for a cautious identification, and keep a private field journal. Return to the same tree, follow its seasons, and build a map of familiar places.

Live app: https://touch-grass-journal.vercel.app. [Deployment and CI](docs/deployment.md) documents the personal Railway/Vercel projects and release flow.

## Run locally

Requires Bun 1.4, PostgreSQL, and an S3-compatible service such as MinIO. This workspace uses the existing local PostgreSQL instance with a dedicated `touch_grass` database and the existing MinIO instance with a private `touch-grass` bucket. The API creates the bucket if needed; it never changes other databases or buckets.

```sh
bun install
bun run db:migrate
bun run dev
```

Open http://localhost:4311. The API runs on 4310; the web server proxies `/api` and `/trpc` so cookies, private photos, and the PWA share one origin.

```sh
bun run check-types
bun run test
bun run build
bun run start
```

`start` runs the compiled API and the production web server. Stop them with Ctrl+C. The web build explicitly generates the service worker after TanStack's client and server builds; this is required by the current Vite environment integration.

## Configuration

Secrets belong in `apps/server/.env`, which is ignored by Git. Schema and validation live in `.env.schema`; `bun install` generates typed accessors.

| Variable | Purpose |
| --- | --- |
| `PORT` | API listening port; defaults to 4310 locally |
| `DATABASE_URL` | PostgreSQL URL for this app's database |
| `BETTER_AUTH_SECRET` | Random secret, at least 32 characters |
| `BETTER_AUTH_URL` | Public web origin; locally `http://localhost:4311` |
| `CORS_ORIGIN` | The same public web origin |
| `S3_URL` | `http://ACCESS_KEY:URL_ENCODED_SECRET@127.0.0.1:9000/touch-grass`; Railway adds `?region=auto&style=virtual` |
| `GEMINI_API_KEY` | Google Gemini key; optional to save photos without identification |
| `VAPID_KEYS` | Web Push `publicKey:privateKey`; optional to disable reminders |

`apps/web/.env` has `VITE_SERVER_URL=http://localhost:4311`, used as the server-rendering fallback origin. Browser requests always use the current origin.

Google sign-in is deferred. Email/password works now. Adding both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` enables the existing Google provider and button; configure Google's callback to `PUBLIC_ORIGIN/api/auth/callback/google` when ready.

Generate VAPID keys from `apps/server` with `bun -e 'console.log(require("web-push").generateVAPIDKeys())'`, then store them privately. Keep the same keys across deployments so installed clients retain their subscriptions. Production requires HTTPS and public-origin values above. VAPID uses that HTTPS origin as its subject; localhost is unsuitable for real Apple push delivery.

## What is implemented

- Camera/library capture, client image preparation and metadata removal, up to three detail photos.
- Official `@google/genai` SDK with `gemini-3.5-flash-lite`, validated structured output, qualitative uncertainty, distinguishing features, alternatives, and another-photo guidance.
- Save without identification; retry identification on a saved discovery. No health, edible, exact-age, or false-certainty claims.
- Email/password sessions, private authenticated image access, names/notes corrections, follow/unfollow, return visits, search, and deletion including unreferenced objects.
- Private optional geolocation pins on an OpenStreetMap basemap; no public location feed.
- Gentle challenges derived from actual journal data, field notes, and private journal JSON export.
- Installable manifest, maskable icons, app shortcuts, safe-area navigation, self-hosted fonts, reduced motion, and an update prompt in Settings.
- Precached app shell and routes. IndexedDB stores drafts and downloaded journal/photos per account. Failed saves remain recoverable; explicit sync is idempotent. Signing out clears downloaded account data while retaining that account's unsynced drafts.
- Opt-in Web Push, subscription cleanup, test reminders, and a server scheduler for followed discoveries, at most once per two weeks per device. Unsubscribing affects the current device.

## Boundaries

Image identification is a suggestion. It is not verified taxonomy, and the two-case smoke evaluation is not a species-accuracy benchmark. Location permissions and installation vary by browser. Map tiles and identification require a connection. Offline photos are available after being opened/downloaded on that device; browser storage may be evicted by the operating system. JSON export includes journal text and metadata, not image binaries.

Google OAuth has not been exercised because it is intentionally deferred. Password reset/email verification are not configured: no mail service was requested. Native app store packaging, public social feeds, background GPS tracking, and offline AI are outside this build.

## Architecture

- `apps/web`: React, TanStack Router/Start and Query, PWA worker, canonical API client and account-scoped IndexedDB helpers.
- `apps/server`: Hono, Better Auth, one Gemini client, one S3 client, Web Push scheduler.
- `packages/api`: tRPC authorization, journal operations, shared schemas and domain constants.
- `packages/db`: PostgreSQL Drizzle schemas and checked-in migration.
- `packages/ui`: shadcn Base UI primitives and design tokens. There is one toast system and one button implementation.

Read [AGENTS.md](AGENTS.md), [PRODUCT.md](PRODUCT.md), and [DESIGN.md](DESIGN.md) before contributing. Verification evidence and known device-testing limits are in [QA.md](QA.md).

## Assets and reference material

The pocket-journal redesign uses original woodland, oak, and fern illustrations. See [artwork provenance](apps/web/public/images/ARTWORK.md). Public editorial photographs are locally optimized WebP copies from Unsplash: [forest](https://images.unsplash.com/photo-1441974231531-c6227db76b6e), [canopy](https://images.unsplash.com/photo-1518495973542-4542c06a5843), [woodland](https://images.unsplash.com/photo-1473448912268-2022ce9509d8). They are editorial assets, never fabricated personal discoveries.

Implementation references: [Vite PWA custom worker](https://vite-pwa-org.netlify.app/guide/inject-manifest), [Web Push subscription API](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe). Design references are linked in DESIGN.md.

The public marketing homepage is `/`; open `/explore` for the compact journal. Sign-in links use `/login?mode=signin`, while journal-start links use signup mode. Installed PWAs start at `/explore`. Landing art and the 1200 × 630 social-sharing image are in `apps/web/public/images/`; the campaign's composition and reference links are documented in `DESIGN.md`.
