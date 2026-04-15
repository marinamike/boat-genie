

## Plan: Add "pending_approval" Status to Active Jobs Dashboard

### Changes to `src/pages/Dashboard.tsx`

**1. fetchActiveJobs status filter (line 157)**
Add "pending_approval" to the status array so jobs awaiting price change re-approval remain visible to owners:
```typescript
.in("status", ["assigned", "in_progress", "qc_review", "completed", "disputed", "pending_approval"])
```

**2. First statusMap in Active Jobs list (lines 456-462)**
Add entry with amber/yellow styling:
```typescript
pending_approval: { label: "Re-approval Needed", className: "bg-amber-100 text-amber-700 border-amber-200" }
```

**3. Second statusMap in job detail sheet (lines 591-597)**
Add the same entry:
```typescript
pending_approval: { label: "Re-approval Needed", className: "bg-amber-100 text-amber-700 border-amber-200" }
```

This allows owners to:
- See jobs that need price change re-approval in their Active Jobs list
- Identify them with the amber "Re-approval Needed" badge
- Click the card to open the detail sheet and review the pending changes

