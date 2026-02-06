
## Summary
The "Marina Mike's" business you created isn't appearing in the Platform Admin verification queue because of a missing database security policy. The platform admin account can't read pending businesses from the database.

## Root Cause
The `businesses` table has Row-Level Security (RLS) enabled with these policies:
- Business owners can only see their own business
- Customers can only see verified businesses (`is_verified = true`)
- Staff can only see their assigned business

**Missing**: A policy that allows the platform admin (info@marinamike.com) to view ALL businesses, including those with `verification_status = 'pending'`.

## Solution
Add a new RLS policy that grants the platform admin full SELECT access to all businesses. This uses the existing `is_platform_admin()` function that's already configured for your account.

## Database Changes Required
### Add Platform Admin SELECT Policy
```sql
CREATE POLICY "Platform admin can view all businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (is_platform_admin());
```

This policy will allow info@marinamike.com to read all business records, which means the Verification Queue will properly display pending businesses.

## Files Changed
No code changes needed - the `VerificationQueue.tsx` component is already correctly querying for `verification_status = 'pending'`. The issue is purely a database permission problem.

## Testing Steps
1. Log in as info@marinamike.com
2. Navigate to Platform Admin (/platform-admin)
3. The "Verification Queue" should now show "Marina Mike's" with a pending status
4. You should be able to Verify, Reject, or Suspend the business
