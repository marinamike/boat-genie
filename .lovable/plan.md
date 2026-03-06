

## Revert Role Change

The `provider@provider.com` user's role was changed from `admin` to `provider` in the database. This needs to be reverted back to `admin`.

### Action
Run a data update to set the role back:
```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = '625d51fb-ffce-4a1d-9efa-44a2de812140';
```

No code changes needed — this is a single data fix to restore the previous state.

