# Deployment

Touch Grass follows the sibling Rounds project's split: Vercel serves the frontend and proxies requests to a persistent Bun API on Railway. PostgreSQL and private photo storage belong to this project alone.

| Resource | Location |
| --- | --- |
| App | https://touch-grass.abhishekmurthy.com |
| GitHub | https://github.com/rootsec1/touch-grass, branch `main` |
| Vercel | `touch-grass` in the Hobby scope `abhishek-murthys-projects` |
| Railway | `touch-grass` in `Personal Projects`, production environment |
| API | https://api-production-5643b.up.railway.app |
| Database | Dedicated `Postgres` service, database `touch_grass`, 5 GB volume |
| Photos | Private `touch-grass` Railway bucket in Virginia |

## Release flow

GitHub Actions runs type checks, builds, migrations, and the auth/journal/storage integration tests on pushes to `main` and on pull requests. CI uses disposable PostgreSQL and an S3rver protocol fixture; production storage is checked separately against Railway. Test credentials in the workflow are disposable and never used in production.

Vercel and Railway use their native GitHub connections. Vercel builds the frontend immediately. Railway waits for successful CI checks, then builds the API's Dockerfile, runs the checked-in Drizzle migrations, and requires `/healthz` to verify database connectivity before routing traffic. Branch previews are disabled so they do not share production accounts and photos. No deployment tokens are stored in GitHub Actions.

```sh
bun install --frozen-lockfile
bun run check-types
bun run test
bun run build
git push origin main
```

`vercel.json` owns frontend builds, API rewrites, canonical-domain redirects, and cache headers. TanStack generates the landing page as static HTML for search engines and sharing, plus a separate SPA shell for app routes. The PWA precaches both build outputs. Missing static assets remain 404s. Auth and media requests use the frontend origin and are never publicly cached.

The Railway API uses one always-running instance in US East because the reminder scheduler runs inside that process. `Dockerfile` pins Bun 1.4.0. The server respects `PORT`; the default remains 4310 locally.

## Infrastructure and secrets

`.railway/railway.ts` records the project's resources and deployment settings. Git pushes deploy application code; they do not apply the project infrastructure file. Inspect changes with `railway config plan` and apply reviewed infrastructure changes explicitly.

```sh
railway link --project 2afda8b0-4ccf-4d97-98e7-11f7a9821b9a --environment production --service api
railway config plan
railway config apply
```

Database and bucket credentials use Railway variable references. The S3 connection remains one `S3_URL`, with `?region=auto&style=virtual` for Railway's virtual-hosted bucket addressing. Local MinIO keeps its existing path-style URL. The Gemini key comes from the configured server key; production auth and VAPID keys are generated separately and remain in Railway. Do not rotate them during normal releases.

Only the public `VITE_SERVER_URL` is configured on Vercel. `BETTER_AUTH_URL` and `CORS_ORIGIN` on Railway match the canonical frontend origin. Google OAuth remains deferred and is hidden until its two credentials are configured.

The custom domain is the only attached Vercel project domain. The old `touch-grass-journal.vercel.app` and `touch-grass-self-gamma.vercel.app` domains are retired. Generated deployment URLs redirect to the custom domain through one host rule in `vercel.json`. Keep the Railway API domain: Vercel's same-origin API rewrites depend on it. Changing the public origin requires updating both Railway origin variables, Vercel's public origin variable, and the checked-in domain rule, then deploying both apps. Existing accounts and server-side journals remain intact; browser sessions, offline drafts, installed PWAs, and push permissions are scoped to their original origin.

The local database and MinIO data are not copied to production. Production begins with an empty journal. `/healthz` checks the database; verify a real authenticated photo upload after storage changes. Platform rollback does not undo database migrations.

References: [TanStack SPA mode](https://tanstack.com/start/latest/docs/framework/react/guide/spa-mode), [static prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering), [Railway buckets](https://docs.railway.com/storage-buckets), [Vercel rewrites](https://vercel.com/docs/routing/rewrites).
