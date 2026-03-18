

## Fix Duplicate Module Config

In `src/pages/BusinessDashboard.tsx`, remove the `store` entry from `moduleConfig` (line ~20), keeping only the `ship_store` entry.

### Change
Delete this line block:
```typescript
store: { label: "Ship Store", icon: Store, href: "/business/store", color: "text-purple-500" },
```

No other files or logic affected.

