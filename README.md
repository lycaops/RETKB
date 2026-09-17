# Retailer Incentive Statement Generator

A React + Vite web application that generates retailer incentive statements from structured incentive data. Deployed on **Supabase (Postgres + Auth + Row Level Security)** + **Vercel (static SPA hosting)**. CSV upload has been removed — all data is managed directly in the Supabase database.

---

## 1. Architecture Overview

```
┌──────────────────────┐         ┌──────────────────────────┐
│  Vercel (Frontend)   │  HTTPS  │     Supabase (Backend)   │
│                      │ ──────► │                          │
│  React 18 + Vite     │         │  ┌─────────────────────┐ │
│  SPA (dist/ static)  │         │  │  Postgres DB (v15+)  │ │
│                      │         │  │  - branches          │ │
│  Routes:             │         │  │  - zones             │ │
│  /login, /register   │         │  │  - profiles          │ │
│  / (Dashboard)       │◄────────│  │  - retailer_incent.  │ │
│  /calculator         │  Auth   │  │  RLS Policies + RPCs │ │
│  /statement          │  Data   │  └─────────────────────┘ │
│  /scheme             │         │  ┌─────────────────────┐ │
│  /users (admin)      │         │  │  Supabase Auth       │ │
│                      │         │  │  email+OTP / reset   │ │
└──────────────────────┘         │  └─────────────────────┘ │
                                 └──────────────────────────┘
```

- **RBAC Roles**: `admin` (full) · `branch_user` (scoped to 1 branch) · `zone_user` (scoped to 1 zone) · `viewer` (read-all).
- **Row Level Security** enforces scope on every `select/insert/update/delete` to `retailer_incentives`, `profiles`, `branches`, and `zones`.
- **Column-name normalizer** bridges Postgres `snake_case` columns ↔ the original display names (with spaces, `M-1`, `(SBT+BT+VOU)`, `%`) used by statement & calculator components.

---

## 2. Prerequisites

1. A **Supabase** account — https://supabase.com/dashboard (free tier works).
2. A **Vercel** account — https://vercel.com (free tier works).
3. Node.js **18+** and npm installed locally.
4. Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) if you prefer `supabase db push` over the SQL Editor.

---

## 3. Create a Supabase Project & Apply the Migration

### Step 3a — New Supabase project

1. Go to https://supabase.com/dashboard → **New Project**.
2. Choose a name, region, and database password (save the password — you'll need it for direct SQL tools if you use CLI).
3. Wait for the project to finish provisioning (~2 minutes).

### Step 3b — Run the migration SQL

Open **SQL Editor** → **New query** and paste the entire contents of:

```
supabase/migrations/20250916000001_retailer_incentive_schema.sql
```

Then click **Run**. It should complete in < 1s.

What this migration creates:

| Object | Purpose |
|--------|---------|
| `branches`, `zones` tables | Lookup tables for RBAC scope; `zones.branch_id` FK → branches |
| `profiles` table | 1 row per user. `id` FK → `auth.users.id`. Columns: `email`, `full_name`, `role`, `branch_id`, `zone_id`, `is_disabled`. |
| `retailer_incentives` table | 42+ explicit incentive columns + `branch`/`zone` text columns + `branch_id`/`zone_id` FKs |
| 6 indexes | Speed up queries by retailer, month, branch, zone, group |
| `public.is_admin(uid)` helper | Used by policies & RPCs to detect admins |
| RLS policies (all tables) | Admin full; branch/zone scoped; viewer read-all; profiles self-read |
| `create_app_profile(p_auth_uid, p_role, …)` RPC | SECURITY-DEFINER, admin-only. Assigns profile + role/scope to an existing Auth user by UUID |
| `on_auth_user_created` trigger | When Supabase Auth creates a user, auto-insert a `viewer` profile so they can sign in even before the admin touches them |

The admin user-management page manages Auth users through the protected Vercel
API route at `/api/admin-create-user`. The route verifies the signed-in admin,
creates confirmed Auth accounts, updates Auth/profile details, and permanently
removes users when requested. The page also supports reversible profile
disable/enable for access control.

### Step 3c — Insert branches & zones

Branches & zones are **already seeded** at the bottom of the migration file (8 branches: LMIT-HS-BARI/BOLOGNA/MILAN/NAPLES/PADOVA/PALERMO/ROME/TORINO, plus 29 zones — BARI 1-3, BOLOGNA 1-3, MILANO 1-4, NAPOLI 1-7, PADOVA 1-2, PALERMO 1-3, ROMA 1-5, TORINOO 1-3). If you ever need to re-add them, the seed is idempotent (`on conflict do nothing`) — just re-run the inserts from §8a/§8b of the migration.

### Step 3d — Create your Admin user

1. In the Supabase Dashboard go to **Authentication → Users → Add user** → **Create new user**.
   - Email: e.g. `admin@retailerapp.local` (or your real email).
   - Check **Auto-confirm user**.
   - Set a strong password.
2. After the user appears in the list, click on them and copy their **User UID** (looks like `a1b2c3d4-1234-5678-9abc-def012345678`).
3. In SQL Editor, run the seed query from the migration's tail-end comments — replace `<ADMIN_AUTH_UUID>` with the UID you just copied:

```sql
-- Seed the admin profile (change the UUID to your real one!)
select public.create_app_profile(
  p_auth_uid  := '<ADMIN_AUTH_UUID>',
  p_role      := 'admin',
  p_branch_id := null,
  p_zone_id   := null,
  p_full_name := 'Application Admin'
);
```

That's it. The admin can now sign in at `/login` and access `/users` to create
and manage other team members.

### Step 3e — Configure admin API secrets in Vercel

The admin API runs as a Vercel serverless function and must never expose the
service-role key to the frontend. In Vercel project settings, add these
Production environment variables, then redeploy:

```dotenv
SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key...
```

The service-role key is used only by `/api/admin-create-user`. Never prefix it
with `VITE_`, commit it, or add it to `.env` files used by the frontend.

---

## 4. Configure Environment Variables

Create `.env.local` at the project root by copying the template:

```bash
cp .env.example .env.local
```

Then fill it in:

```dotenv
# Supabase URL — find in: Project → Settings → API → Project URL
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co

# Supabase anon key — find in: Project → Settings → API → Project API keys → anon public
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...long.string...here...
```

⚠️ **Never commit `.env.local`** (it's already in `.gitignore`). Never paste the `service_role` key — it bypasses RLS and must live only on servers.

---

## 5. Run Locally (Frontend)

```bash
# 1. Install deps (once)
npm install

# 2. Start the Vite dev server against your remote Supabase backend
npm run dev
```

Open `http://localhost:5173` and sign in with the admin credentials you created in §3d.

### Useful scripts in `package.json`

| Script | What it does |
|--------|--------------|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Builds `dist/` for Vercel deploy |
| `npm run preview` | Preview `dist/` locally |
| `npm run lint` | ESLint over `src/` |

---

## 6. Deploy to Vercel

### 6a — Push your repo to GitHub/GitLab/Bitbucket

Vercel imports directly from your Git provider.

### 6b — Import project into Vercel

1. Go to https://vercel.com/new → Import your repository.
2. **Framework Preset**: Vite (should be auto-detected).
3. **Build Command**: `npm run build` (default for Vite — leave it).
4. **Output Directory**: `dist` (default — leave it).
5. **Environment Variables** — add the frontend and server variables:
   - `VITE_SUPABASE_URL` = `https://…supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOi…`
   - `SUPABASE_URL` = `https://…supabase.co`
   - `SUPABASE_ANON_KEY` = `eyJhbGciOi…`
   - `SUPABASE_SERVICE_ROLE_KEY` = the secret service-role key
6. Click **Deploy**.

### 6c — Whitelist the Vercel domain in Supabase Auth

Supabase Auth blocks unknown callback URLs by default.

1. In Supabase Dashboard → **Authentication → URL Configuration**.
2. Under **Site URL** you can leave it as your Vercel production URL, e.g. `https://your-app.vercel.app/`.
3. Under **Redirect URLs**, add:
   ```
   https://your-app.vercel.app/**
   http://localhost:5173/**
   ```
   (If you also have a preview branch pattern, add `https://*-your-org.vercel.app/**` too.)

### 6d — (Optional) Custom domain & Vercel rewrites

Vercel hosts a static SPA, so deep-link refreshes (e.g. directly visiting `/users`) should not 404. Vite automatically generates `vercel.json` behavior via the build if present. If you hit 404s on refresh, drop a `vercel.json` at the project root with:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 7. Manage Incentive Data (No CSV Upload)

CSV upload was removed. Data enters `retailer_incentives` via:

### Option A — Supabase Table Editor (GUI)

Dashboard → **Table Editor** → `retailer_incentives` → **Insert row**. Best for one-offs.

### Option B — SQL Editor (bulk INSERT)

Most convenient when you have data from another source (Excel export, BI tool, etc.). Example bulk insert:

```sql
insert into public.retailer_incentives
  (retailer_id, accmgrid, hotspotid, month, payment_mood, incentive_group, scheme,
   total_noofactivations, total_topup_less_6_portin, total_topup_great_6_portin,
   total_topup_less_6, total_topup_great_6, blocked_noofactivations, total_portout,
   bundle1_comm, quality_bonus_m_1, volume_bonus_m_1, portout_deduction,
   portin_comm, onboarding_comm, nonhp_comm, gara_comm, usage_clawback,
   usage_refund, t3ren_bonus, total_comm, opening_balance, total_paid_sbt_bt_vou,
   new_act_cnt, new_act_renewal_cnt, new_activations, portin_act_cnt,
   portin_act_renewal_cnt, port_in, total_bundle_act, bundle_act_not_eligible,
   usage_percentage, t1_bonus, t2_bonus, t1_renewal, t2_renewal, fake_port_out_pct,
   branch, zone, branch_id, zone_id)
values
  ('R001', 'AM01', 'HS01', '2025-09', 'Bank Transfer', 'NOR_RET', 'special',
   120, 5000, 15000, 3000, 10000, 2, 4,
   25000, 3000, 4000, 500,
   1500, 800, 300, 700, 200,
   100, 500, 36400, 0, 0,
   80, 60, 140, 30,
   20, 50, 150, 10,
   85.5, 1200, 900, 800, 600, 1.2,
   'LMIT-HS-BOLOGNA', 'HS BOLOGNA ZONE 1',
   (select id from branches where code='BOL'),
   (select id from zones where code='BOL-Z1')),
  ('R002', 'AM02', 'HS02', '2025-09', 'Voucher', 'SPL_RET', 'normal',
   80, 3000, 9000, 2000, 6000, 0, 1,
   15000, 2000, 2500, 100,
   900, 400, 150, 300, 150,
   50, 300, 21400, 1500, 0,
   50, 35, 85, 20,
   10, 30, 90, 5,
   78.0, 700, 500, 500, 400, 0.5,
   'LMIT-HS-MILAN', 'HS MILANO ZONE 2',
   (select id from branches where code='MIL'),
   (select id from zones where code='MIL-Z2'));
```

### Option C — Supabase CLI / API / ETL

If you want to automate ingestion, write an ETL (e.g. a small Node script using `@supabase/supabase-js` with the `service_role` key, running as a scheduled job) that calls:

```js
await supabaseAdmin.from('retailer_incentives').upsert(rows, { onConflict: 'retailer_id,month' });
```

Add a SQL unique index for upsert semantics:

```sql
create unique index if not exists retailer_incentives_retailer_month_uniq
  on public.retailer_incentives (retailer_id, month);
```

### Important: how RLS filters data for non-admins

For a row to be visible to a non-admin:

- **`branch_user`**: `retailer_incentives.branch_id = profiles.branch_id` **OR** `retailer_incentives.branch = <branch_name>`
- **`zone_user`**: `retailer_incentives.zone_id = profiles.zone_id` **OR** `retailer_incentives.zone = <zone_name>`

Populate either the FK (`branch_id`, `zone_id`) or the text columns (`branch`, `zone`) — policies match both.

---

## 8. User Management (Admin only)

Logged in as an admin, visit **Users** (`/users`) in the left sidebar.

**To add a team member**:
1. First create them in **Supabase Auth** (Authentication → Users → Add user, auto-confirm). Copy their User UID.
2. Click **Assign Profile** on the `/users` page → paste the UID → choose a role → pick branch/zone as needed → **Assign Profile**.
   - Admin → full access
   - Branch user → choose a **Branch** (required)
   - Zone user → choose a **Zone** (required); Branch optional (filters zone list)
   - Viewer → read-only (no scope needed)

**To edit an existing user**: click **Edit** on their row → change role / branch / zone → **Save Changes**.

**To remove access**: click **Disable**. The user stays in Supabase Auth but their profile is soft-disabled (all policies reject). To permanently delete the Auth user and profile, click **Remove** and confirm.

---

## 9. Column Reference

Postgres columns are `snake_case`; the app exposes them under their original display names. When writing SQL, use the **Postgres** column. When reading a statement's output or debugging the UI, you'll see the **Display** name.

| # | Display Name (what UI/statements show) | Postgres Column | Type |
|---|---------------------------------------|-----------------|------|
| 1 | RETAILER ID | `retailer_id` | text |
| 2 | ACCMGRID | `accmgrid` | text |
| 3 | HOTSPOTID | `hotspotid` | text |
| 4 | MONTH | `month` | text |
| 5 | PAYMENT MOOD | `payment_mood` | text |
| 6 | TOTAL_NOOFACTIVATIONS | `total_noofactivations` | numeric |
| 7 | TOTAL_TOPUP_LESS_6_PORTIN | `total_topup_less_6_portin` | numeric |
| 8 | TOTAL_TOPUP_GREAT_6_PORTIN | `total_topup_great_6_portin` | numeric |
| 9 | TOTAL_TOPUP_LESS_6 | `total_topup_less_6` | numeric |
| 10 | TOTAL_TOPUP_GREAT_6 | `total_topup_great_6` | numeric |
| 11 | BLOCKED_NOOFACTIVATIONS | `blocked_noofactivations` | numeric |
| 12 | TOTAL_PORTOUT | `total_portout` | numeric |
| 13 | BUNDLE1_COMM | `bundle1_comm` | numeric |
| 14 | QUALITY_BONUS M-1 | `quality_bonus_m_1` | numeric |
| 15 | VOLUME_BONUS M-1 | `volume_bonus_m_1` | numeric |
| 16 | PORTOUT DEDUCTION | `portout_deduction` | numeric |
| 17 | PORTIN_COMM | `portin_comm` | numeric |
| 18 | ONBOARDING_COMM | `onboarding_comm` | numeric |
| 19 | NONHP_COMM | `nonhp_comm` | numeric |
| 20 | GARA_COMM | `gara_comm` | numeric |
| 21 | USAGE_CLAWBACK | `usage_clawback` | numeric |
| 22 | USAGE_REFUND | `usage_refund` | numeric |
| 23 | T3REN_BONUS | `t3ren_bonus` | numeric |
| 24 | TOTAL_COMM | `total_comm` | numeric |
| 25 | OPENING BALANCE | `opening_balance` | numeric |
| 26 | TOTAL PAID (SBT+BT+VOU) | `total_paid_sbt_bt_vou` | numeric |
| 27 | NEW_ACT_CNT | `new_act_cnt` | numeric |
| 28 | NEW_ACT_RENEWAL_CNT | `new_act_renewal_cnt` | numeric |
| 29 | NEW ACTIVATIONS | `new_activations` | numeric |
| 30 | PORTIN_ACT_CNT | `portin_act_cnt` | numeric |
| 31 | PORTIN_ACT_RENEWAL_CNT | `portin_act_renewal_cnt` | numeric |
| 32 | PORT IN | `port_in` | numeric |
| 33 | TOTAL_BUNDLE_ACT | `total_bundle_act` | numeric |
| 34 | BUNDLE ACT NOT ELIGIBLE | `bundle_act_not_eligible` | numeric |
| 35 | USAGE_PERCENTAGE | `usage_percentage` | numeric |
| 36 | T1 BONUS | `t1_bonus` | numeric |
| 37 | T2 BONUS | `t2_bonus` | numeric |
| 38 | T1 RENEWAL | `t1_renewal` | numeric |
| 39 | T2 RENEWAL | `t2_renewal` | numeric |
| 40 | INCENTIVE GROUP | `incentive_group` | text (NOR_RET/SPL_RET) |
| 41 | FAKE PORT OUT % | `fake_port_out_pct` | numeric |
| 42 | BRANCH | `branch` | text |
| 43 | ZONE | `zone` | text |
| 44 | — (FK, not displayed) | `branch_id` | uuid → branches |
| 45 | — (FK, not displayed) | `zone_id` | uuid → zones |
| 46 | — (enum, used by AppContext) | `scheme` | text (normal/special) |

The map lives in `src/lib/AppContext.jsx` → `SNAKE_TO_DISPLAY` and its inverse `DISPLAY_TO_SNAKE`. Add a new column in both the SQL migration and this map if your dataset grows.

---

## 10. Troubleshooting

| Symptom | Likely fix |
|---------|-----------|
| Sign in works but I see no data | You're a non-admin without scope, or no `retailer_incentives` rows match your branch/zone. Insert rows (§7) or promote yourself to admin (§3d). |
| I get a 401 / "User not registered" | The `on_auth_user_created` trigger didn't run for this user (rare). Ask an admin to click **Assign Profile** on `/users` for your Auth UUID, or manually `insert into public.profiles (id, email, role) values (uuid, email, 'viewer');`. |
| "New password" reset URL is broken / redirects to localhost | Update Supabase **Authentication → URL Configuration → Redirect URLs** to include your deployed Vercel domain with a `/**` suffix (§6c). |
| Statement fields show 0 / NaN where you expect numbers | The display key in the statement doesn't match any column. Double-check §9, or trace the field in `src/lib/analysis.js` and `src/lib/AppContext.jsx:6` `SNAKE_TO_DISPLAY`. |
| `npm run build` fails with supabase import errors | Run `npm install` first. Verify `package.json` has `@supabase/supabase-js` listed. |
| PowerShell: `npm.ps1 is not digitally signed` | Wrap: `powershell -ExecutionPolicy Bypass -Command "npm run build"`. |

---

## 11. Local Quickstart Recap

```bash
# 0) Create Supabase project + run migration from §3
# 1)
cp .env.example .env.local           # fill in Supabase URL + anon key
# 2)
npm install
# 3)
npm run dev
# 4) Open http://localhost:5173 → log in as the admin you created in §3d
# 5) Add incentive data via Supabase SQL Editor (§7 example INSERT)
```
