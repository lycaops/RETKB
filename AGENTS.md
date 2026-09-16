
# AGENTS.md

## Project Context

This is a Retailer Incentive Statement web app migrated to **Supabase (Postgres + Auth + RLS) + Vercel (frontend)**. Treat code as user-owned and preserve existing conventions.

Start with `README.md` for local setup, Supabase migration steps, env vars, and Vercel deployment workflow.

## References

- Supabase CLI: https://supabase.com/docs/guides/cli
- Supabase JS SDK: https://supabase.com/docs/reference/javascript
- Vite: https://vitejs.dev/guide/

## Key Files

- `src/`: frontend React/Vite application source.
- `src/api/supabaseClient.js`: Supabase JS SDK client (anon key).
- `src/lib/AuthContext.jsx`: React auth context (Supabase Auth + profiles role merge).
- `src/lib/AppContext.jsx`: App state + retailer_incentives loader + column-name normalizer.
- `supabase/migrations/*.sql`: Postgres migrations (tables, RLS policies, triggers, seed hints, admin-only RPCs).
- `vite.config.js`: Vite config with `@/` → `./src` alias and `process.env` shim.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `npm run dev` for frontend-only work against a remote Supabase backend.
- Use `npm run build` to produce the Vercel static deploy bundle (`dist/`).
- Apply migrations via Supabase SQL Editor or `supabase db push` from the CLI.
- The migration creates an SECURITY-DEFINER RPC `create_app_profile()`; only admins can call it (guarded by `public.is_admin()` check inside the function).
- `retailer_incentives` columns are snake_cased in Postgres; `SNAKE_TO_DISPLAY` in AppContext.jsx maps them back to the original display names used by statement/calculator components.
- Row-Level Security is enabled on all tables. Policies: admins get full access; `branch_user`/`zone_user` are scoped to their branch/zone; `viewer` can read everything.
- Directly deleting `auth.users` rows from the browser client requires the `service_role` key, which never ships to the frontend. The User Management page soft-disables via `profiles.is_disabled`; admins delete auth users via the Supabase Dashboard.
- Run `npm run lint` and `npm run build` before finishing code changes.
