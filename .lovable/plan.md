## Plan: Wire WorkOrderChat to business_id + add Chat buttons

### 1. `src/hooks/useWorkOrderChat.ts` — replace provider_id with business_id

**`fetchParticipants`** — change select to `id, business_id, boat_id, boats!inner(id, name, owner_id)`.

- `isOwner = boat.owner_id === session.user.id` (unchanged).
- `isProvider`: lookup `businesses` row where `owner_id = session.user.id`, then `isProvider = userBiz?.id === workOrder.business_id`.
- Admin branch: `setRecipientId` to the business owner's user id (lookup `businesses.owner_id where id = workOrder.business_id`) or `boat.owner_id` fallback.
- Owner branch: `setRecipientId` to `businesses.owner_id where id = workOrder.business_id`.
- Provider branch: `setRecipientId(boat.owner_id)`. Display name uses already-fetched business row.

**`fetchMessages`** — change select to `business_id, boats!inner(name, owner_id)`. Lookup business owner's user id once: `businesses.select("owner_id, business_name").eq("id", workOrder.business_id).maybeSingle()`. In the map:
- Replace `msg.sender_id === workOrder?.provider_id` with `msg.sender_id === businessOwnerUserId`.
- Replace `businessProfiles.find(p => p.owner_id === ...)` lookup accordingly (single business row, so just check ID match and use its `business_name`).

**`createSystemMessage`** — change select to `business_id, boats!inner(owner_id)`. Lookup `businesses.owner_id where id = workOrder.business_id` → `businessOwnerUserId`. Compute `targetRecipient = recipientIdOverride || (currentUserId === businessOwnerUserId ? boat?.owner_id : businessOwnerUserId)`.

No interface changes; no realtime change.

### 2. `src/components/service/ServiceWorkOrders.tsx` — add Chat button

- Import `WorkOrderChat` from `@/components/chat/WorkOrderChat`.
- In the selected work order header (around line 779-784, next to Edit button), render `<WorkOrderChat workOrderId={selectedWorkOrder.id} isProvider={true} otherPartyName={selectedWorkOrder.guest_customer_id ? selectedWorkOrder.guest_customers?.owner_name : selectedWorkOrder.owner_profile?.full_name || "Boat Owner"} />` alongside Edit. Keep both visible whenever status !== "paid"; show Chat even when paid (so owner/provider can still message).

### 3. `src/pages/Dashboard.tsx` — add Chat button to job detail sheet

- Import `WorkOrderChat`.
- In the job detail sheet (around line 622-787), in the header row alongside the title/badge (or under the Notes block, before the pending_approval / Review Invoice blocks), render `<WorkOrderChat workOrderId={selectedJobDetail.id} isProvider={false} otherPartyName={selectedJobDetail.business?.business_name || "Service Provider"} />`.

### Out of scope

- No DB/RLS changes (the `messages` RLS already permits both sides via work_order participation — assumed unchanged).
- No edits to `WorkOrderChat.tsx` itself or `chatUtils.ts` (utility still references provider_id but isn't imported by these flows; leave for a separate pass).
