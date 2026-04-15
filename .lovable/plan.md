

## Plan: Add Notification Inserts + Realtime Leads Refresh

### 1. `src/hooks/useJobBoard.ts` — Quote submitted notification

After `submitQuote` succeeds (line ~353, after quote insert), fetch the business name and insert a notification:

```typescript
// Fetch business name for the notification
const { data: bizData } = await supabase
  .from("businesses")
  .select("business_name")
  .eq("id", bizId)
  .single();

await supabase.from("notifications").insert({
  user_id: wish.requester_id,
  title: "New Quote Received",
  message: `${bizData?.business_name || "A business"} submitted a quote for ${wishTitle}`,
  type: "quote",
  related_id: wishId,
});
```

### 2. `src/hooks/useJobBoard.ts` — Realtime subscription for new wishes

Add a realtime subscription in the `useEffect` block (after `fetchJobs()` call, line ~254) to listen for `INSERT` events on `wish_forms` and auto-refresh leads:

```typescript
const channel = supabase
  .channel("job-board-wishes")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "wish_forms" }, () => {
    fetchJobs();
  })
  .subscribe();
return () => { supabase.removeChannel(channel); };
```

### 3. `src/components/owner/PendingQuotesSection.tsx` — Quote accepted notification

After `handleAcceptQuote` succeeds (line ~203, after wish/sibling updates), fetch the business owner_id and insert:

```typescript
if (quote.business_id) {
  const { data: biz } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", quote.business_id)
    .single();
  if (biz?.owner_id) {
    await supabase.from("notifications").insert({
      user_id: biz.owner_id,
      title: "Quote Accepted",
      message: `Your quote for ${quote.work_order?.title} has been accepted. Work is now assigned.`,
      type: "job",
      related_id: quote.work_order_id,
    });
  }
}
```

### 4. `src/components/service/ServiceWorkOrders.tsx` — Status progression notifications

After `handleStatusProgression` succeeds (line ~164, after `toast.success`), for statuses `in_progress`, `qc_review`, and `completed`, notify the boat owner:

```typescript
const notifyStatuses: Record<string, string> = {
  in_progress: "Work Has Started",
  qc_review: "QC Review",
  completed: "Work Completed",
};
if (notifyStatuses[newStatus]) {
  const ownerId = (selectedWorkOrder as any).boats?.owner_id;
  if (ownerId) {
    await supabase.from("notifications").insert({
      user_id: ownerId,
      title: notifyStatuses[newStatus],
      message: `${business.business_name} updated the status of ${selectedWorkOrder.title}`,
      type: "status",
      related_id: selectedWorkOrder.id,
    });
  }
}
```

### 5. `src/components/owner/InvoiceReview.tsx` — Dispute notification

After `handleDispute` succeeds (line ~122, after toast), notify the business owner:

```typescript
if (recipientId) {
  await supabase.from("notifications").insert({
    user_id: recipientId,
    title: "Invoice Disputed",
    message: `A line item has been disputed: ${item.service_name} — ${disputeNote.trim()}`,
    type: "alert",
    related_id: invoice.work_order_id,
  });
}
```

This reuses the already-available `recipientId` (`invoice.businesses.owner_id`) from the existing dispute logic.

### Files changed
- `src/hooks/useJobBoard.ts` — notification insert after quote + realtime subscription
- `src/components/owner/PendingQuotesSection.tsx` — notification on quote acceptance
- `src/components/service/ServiceWorkOrders.tsx` — notification on status changes
- `src/components/owner/InvoiceReview.tsx` — notification on dispute

