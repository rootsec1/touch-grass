# Development contract

Read `PRODUCT.md`, `DESIGN.md`, and `README.md` before changing behavior. Apply the installed Ponytail and One Way Code skills. Follow the shadcn skill for all UI work.

- Keep the existing Bun/Turborepo, TanStack Start, Hono/tRPC, Better Auth, Drizzle/PostgreSQL architecture.
- One owner per responsibility: shared domain schemas/constants in `packages/api/src/domain.ts`; one database, auth, AI, storage, and push service per server process; shared UI primitives and CSS tokens in `packages/ui`.
- Validate external inputs and model output with Zod. Authorize every journal/media operation by the session user. Never trust a client-supplied owner ID.
- All personal data is private. Do not log credentials, image content, session tokens, or precise locations. Never commit `.env` or generated local data.
- PostgreSQL migrations are checked in. Inspect schemas before writes. Use only this project's `touch_grass` database and object bucket. Never mutate remote Kubernetes.
- Use semantic colors and component variants. Forms use FieldGroup/Field. Base UI triggers use `render`. No raw replacement buttons, inputs, callouts, badges, or dialogs.
- Prefer CSS/native browser APIs over new libraries. Keep offline drafts recoverable and account caches isolated. Do not cache authenticated HTTP responses in a shared cache.
- Run focused behavior tests, type checks, and production builds. Browser-test core journeys at mobile and desktop widths. Do not report mocked integrations as live success.
- Track and stop processes started for verification. Do not stop other projects' services.
- Remove unused starter paths, debug output, and duplicate implementations. Document configuration and any remaining external setup.
