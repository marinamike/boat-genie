

## Problem

The user `provider@provider.com` has role **`admin`** in the `user_roles` table. This is why they see the Business dashboard at `/business/jobs` instead of the Provider dashboard. The previous code changes (adding provider to types, routing, role selector) were all correct but did not change the existing database record.

## Plan

### 1. Update the user's role in the database
Run a migration to update the `user_roles` row for `provider@provider.com` from `admin` to `provider`:

```sql
UPDATE public.user_roles 
SET role = 'provider' 
WHERE user_id = '625d51fb-ffce-4a1d-9efa-44a2de812140';
```

After this, when the user logs in or refreshes, the `AuthContext` will read `provider` from the database, the `RoleBasedRoutes` switch will hit `case "provider"`, and they will be routed to the Provider Dashboard with the Daily Schedule.

### 2. Verify routing works
After the role update, the user should be redirected to `/provider` automatically and see the provider dashboard with the schedule, date range filter, and pending job status features that were built in earlier prompts.

No code changes are needed -- this is purely a data fix.

