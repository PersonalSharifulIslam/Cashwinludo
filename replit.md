# Royal Ludo Arena

A real-money multiplayer Ludo betting platform for Bengali-speaking players with casino-style premium dark UI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/royal-ludo run dev` — run the frontend (port 20646)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Wouter routing
- API: Express 5 with JWT auth (bcryptjs + jsonwebtoken)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle DB schema (users, wallets, rooms, matches, deposits, withdrawals, notifications, settings)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/royal-ludo/src/` — React frontend (pages, components, auth context)

## Architecture decisions

- JWT tokens stored in localStorage under key `royal_ludo_token`, injected via custom-fetch
- Admin access restricted to `jakirulmd1088@gmail.com` at the API level (adminMiddleware)
- Withdrawal balance deducted immediately upon request submission (before admin approval)
- Matchmaking uses DB polling — joining creates a match in "searching" state, second player updates to "matched"
- All prices in Bangladeshi Taka (৳ symbol)

## Product

- **User auth:** Phone + password registration/login with referral code support
- **Wallet:** Three balance types (main, winning, bonus), deposit via Bkash/Nagad
- **Game rooms:** 6 rooms from ৳10 to ৳500 entry fee, admin-editable
- **Matchmaking:** 30-second countdown, auto-refund if no opponent found
- **Admin panel:** `/admin-login` → full dashboard (users, deposits, withdrawals, rooms, notifications, settings)
- **Referral system:** Unique codes, ৳20 bonus per referral (admin-configurable)

## User preferences

- Bengali-language app — prices use ৳ (Taka) symbol
- Admin email: jakirulmd1088@gmail.com, admin password: Admin@2024!Ludo
- Dark casino theme: deep purple/indigo backgrounds, gold (#FFD700) accents
- Mobile-first layout (max-width 430px)

## Gotchas

- After schema changes, always run `pnpm --filter @workspace/db run push` then restart api-server workflow
- After OpenAPI spec changes, run codegen before using updated types
- The referral bonus on register is hardcoded at ৳20 in auth.ts — configurable in settings for future referrals
- Admin rooms are soft-deleted (active=false), not hard-deleted

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
