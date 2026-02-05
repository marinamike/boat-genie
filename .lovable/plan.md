
## What’s actually happening (root cause)
Your account is not “staying Customer” because the role write is failing—it’s because the app currently **prevents switching into Business unless a separate “marina” record exists**.

In `src/pages/Profile.tsx`, when you tap **Business** it runs this guard:

- If newRole is `"admin"` (Business) AND `hasMarina` is false → it navigates you away (or causes a flow that never writes the role), so `user_roles` stays `boat_owner`.
- We confirmed in the backend that `test@test.com` still has `user_roles.role = boat_owner`.

So the reload lands you back in Customer because the role never changes in the database.

This is also why you “don’t see the business layout”: the Business layout is behind the Business role, and you’re never actually becoming Business.

## Goal (what you asked for)
- Enforce **3 roles only**: Customer, Business, Staff (no “God mode”).
- **Business role should switch immediately**, and if there’s no business profile yet, show a **setup/empty state**, not a blocker.
- Business bottom navigation should be module-driven (already largely implemented).
- Continue the larger refactor items (unified estimate builder, business_id merge) in a controlled, verifiable way.

---

## Plan to fix this (in order, with verification steps)

### Phase 1 — Fix role switching so Business actually sticks (high priority)
**Changes**
1. **Remove the `hasMarina` gate** from Profile role switching.
   - Replace it with “allow Business role immediately”.
2. Update the Business onboarding expectation:
   - If user switches to Business and has no `businesses` record yet:
     - Either (A) auto-create a minimal business row (safe defaults), then route to `/business/settings`
     - Or (B) switch role and route to `/business` where a setup card prompts for business name and module toggles.
   - Based on your answer, we will do **(B) allow + show setup** (no blocking registration).
3. Align role reads everywhere:
   - Ensure both `AuthContext` and `useUserRole` read the same single source of truth (`user_roles`).
   - Add explicit logging (dev-only) + toast on failure so it can’t “silently do nothing”.

**Backend check we’ll run after**
- Confirm that `public.user_roles` row for your user becomes `admin` after tapping Business.

**Acceptance criteria**
- On `/profile`, tap **Business**:
  - page reloads (if we keep reload)
  - role remains Business
  - landing route becomes `/business` (BusinessLayout is visible)

---

### Phase 2 — Replace “Register Marina” flow with “Business Setup” flow (so the UI matches the new schema)
Right now there’s a mismatch:
- Business pages use `businesses` + `enabled_modules`
- But setup flow and `RegisterMarina.tsx` still writes to `marinas` and routes to `/marina`

**Changes**
1. Update `BusinessDashboard` “No Business Found” CTA:
   - It should go to `/business/settings` (or `/business/setup`) instead of `/register-marina`.
2. Update or retire `RegisterMarina.tsx`:
   - Either remove it from the Business path, or repurpose it into a Business Setup page that creates/edits a `businesses` record (not `marinas`).
3. Update `useUserRole.registerMarina` (or delete/replace it):
   - It currently sets role to admin then inserts into `marinas`. That’s not the modular-business model.
   - We’ll replace with `ensureBusinessProfile()` that upserts into `businesses` for owners.

**Acceptance criteria**
- Switching to Business never sends you to a marina-specific registration page.
- Business setup happens inside Business settings.

---

### Phase 3 — Remove any remaining “God mode / Admin UI” surfaces (audit + clean)
You said “God mode still exists” earlier; even if you now only see 3 roles, we should still **audit for leftover admin-only UI routes/components** so they can’t reappear.

**Changes**
1. Repository audit:
   - Search for “god mode”, “isGodModeUser”, `/admin`, “ExecutiveDashboard”, “UserManagement”, etc.
2. Confirm:
   - No `/admin` routes are reachable
   - No nav items expose admin tooling
3. If admin tooling still exists as code (components/admin/*), we’ll ensure:
   - Not routable
   - Not linked
   - Not conditionally shown based on role in a way that conflicts with the 3-role architecture

**Acceptance criteria**
- There is no UI path that looks like platform-wide admin/god mode.

---

### Phase 4 — Module Switchboard + Dynamic Bottom Nav (finish & verify end-to-end)
This is mostly implemented already (`BusinessLayout` filters tabs by `enabled_modules` and permissions), but we’ll ensure it’s actually connected to real data and visible.

**Changes**
1. Ensure `BusinessSettings` uses the **Module Manager** toggles to update `businesses.enabled_modules`.
2. Ensure toggling modules immediately changes bottom nav (after refresh).
3. Staff assignment:
   - Confirm Staff can only see modules they have read permission for (`business_staff.module_permissions` JSONB).

**Acceptance criteria**
- Turn on Fuel → Fuel tab appears
- Turn off Service → Jobs tab disappears
- Staff user sees only permitted module tabs

---

### Phase 5 — Unified Estimating Engine (new build, shared across modules)
This is not yet present, so we’ll implement it cleanly as a shared “Estimate Builder” UI + backend tables.

**Backend design (proposed)**
- `estimates`: id, business_id, created_by, status, customer_id (optional), related work_order_id/reservation_id (optional), totals
- `estimate_line_items`: id, estimate_id, title, description, quantity, unit_price, module_source (slips/service/fuel/store), taxable flags, etc.

**UI design**
- A shared `<EstimateBuilder />` component that:
  - adds/removes line items
  - supports mixed line items (“Daily Slip Fee” + “Oil Change”)
  - is usable from multiple module pages

**Acceptance criteria**
- One estimate can contain line items from multiple modules and totals correctly.

---

### Phase 6 — Database Migration: merge `marina_id` and `provider_id` into `business_id` (large, staged)
This is a bigger schema change. We’ll do it safely in steps:
1. Add `business_id` columns where needed (work_orders, reservations, invoices, quotes, etc.)
2. Backfill `business_id` based on current data (mapping marinas/providers to businesses)
3. Update code queries to use `business_id`
4. Deprecate/stop using `marina_id`/`provider_id` in app logic
5. Only then consider dropping old columns (after checking Live data)

**Acceptance criteria**
- No features rely on marina_id/provider_id for ownership/filters anymore.
- RLS policies reference business_id via `is_business_owner/is_business_staff`.

---

## Why this plan will stop the credit-wasting loop
- We’re addressing the **exact reason role changes don’t persist**: the Business role is currently blocked by `hasMarina`.
- We’ll verify success with an explicit backend check (your role row changes to admin).
- We’ll remove the outdated “marina registration” dependency so the Business layout can appear consistently.

## Implementation checklist (what I’ll touch)
- `src/pages/Profile.tsx` (remove marina gating; route to business setup)
- `src/hooks/useUserRole.ts` (replace marina-specific logic with business-specific helpers)
- `src/pages/RegisterMarina.tsx` (repurpose or remove from Business path)
- `src/pages/BusinessDashboard.tsx` (CTA should go to business settings/setup)
- `src/contexts/AuthContext.tsx` (ensure role sync is consistent; remove legacy role handling if needed)
- (Later phases) new estimate tables + shared EstimateBuilder component + module entry points

## Testing plan (what you’ll do in Preview)
1. Log in as `test@test.com`
2. Go to `/profile`
3. Tap Business
4. Confirm you land in `/business`
5. Go to Business Settings, toggle Fuel/Service modules and verify bottom nav updates
6. (Later) create an estimate with mixed line items and confirm totals

