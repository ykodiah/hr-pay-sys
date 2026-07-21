# AGENTS.md

## Cursor Cloud specific instructions

AkwaabaHRPay is a single **Next.js 15** (App Router, React 19) app — an HR & Payroll system for Ghana. Package manager is **pnpm** (Node >= 18; the VM has Node 22 + pnpm 10). It is not a monorepo; one `package.json` at the root serves all surfaces (main HR/payroll app, `superadmin`, public `careers`, communication module).

### Running / building / linting
Standard scripts live in `package.json`:
- Dev server: `pnpm dev` (http://localhost:3000).
- Build: `pnpm build`. Lint: `pnpm lint`. `pnpm smoke` runs `scripts/smoke-tests.sh` (lint + build).
- `pnpm lint` currently reports a **pre-existing** error in `components/error-boundary.tsx` (`no-html-link-for-pages`) plus several `react-hooks/exhaustive-deps` warnings. This is unrelated to environment setup; because of that error `pnpm smoke` fails at the lint step even though `pnpm build` succeeds on its own.

### Demo mode (no external services needed)
The app auto-detects **demo mode** whenever `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset (see `lib/demo/memory-db.ts`, `isDemoMode()`). In demo mode Supabase is replaced by a seeded in-memory DB and auth is stubbed, so `pnpm dev` runs the whole product end-to-end with **zero external services**. For real, persistent multi-tenant data, provide the Supabase env vars and apply `supabase/migrations/*.sql` + the numbered `scripts/*.sql`.

### Demo-mode gotchas
- Log in at `/login` and click **"Admin Demo"** to get a demo session (user `demo@akwaaba.local`). App pages live under the `/app` segment (dashboard `/app`, payroll `/app/payroll`, etc.) but are guarded by `middleware.ts` and **redirect (307) without the demo session** — so navigate via the in-app sidebar after clicking Admin Demo rather than deep-linking to `/app/...` URLs.
- The intended demo flow that works end-to-end is **Payroll: Process / Approvals / Reports / Export** (memory DB is seeded with a demo company + 3 employees for exactly this). The payroll `Process Payroll` page loads a worksheet, `Recalculate`, then `Run Payroll` queues the run for approval.
- The **Employees page (`app/app/employees/page.tsx`) crashes in demo mode** with `supabase.channel is not a function` — the mock client in `lib/supabase/client.ts` has no realtime `channel()`. This is a known pre-existing demo-only limitation; avoid it when demoing on demo mode.

### Testing
There is **no Jest setup committed** (no jest config, no jest deps in `package.json`, no `test` script). The files in `__tests__/` and the guidance in `TESTING.md` are aspirational — do not expect `pnpm test` to work without first installing/configuring Jest per `TESTING.md`.

### Misc
- Root `README.md` is the unrelated **Supabase CLI** readme; ignore it for setup. Use `START_HERE.md` / `SYSTEM_ARCHITECTURE.md` for real product docs.
- pnpm ignores native build scripts (`bcrypt`, `sharp`, `@tailwindcss/oxide`, `unrs-resolver`); `pnpm dev` and `pnpm build` still work without approving them.
