
Problem diagnosis (what’s happening)
- The tank actually is being created in the backend, but the Fuel Dashboard doesn’t update afterward, so it looks like “it didn’t save”.
- Root cause: we are calling `useFuelManagement()` in multiple places:
  - `FuelDashboard` calls `useFuelManagement()` to fetch and render `tanks`.
  - `TankSetupForm` also calls `useFuelManagement()` and runs `createTank()`.
- Each call to `useFuelManagement()` creates a separate, independent state “instance”. So when the form inserts a tank, it refreshes only its own internal list, not the dashboard’s list.
- Evidence: I inserted a tank named “Main Diesel Tank” and confirmed it exists in the database, but this architecture can still leave the dashboard showing stale data until a full refresh.

Goal
- Make the “Add Tank” flow update the visible tank list immediately after saving (no page refresh required).

Plan (safe, minimal change approach)
1) Refactor the TankSetupForm to be “stateless with respect to data”
   - Remove the internal `useFuelManagement()` usage from `TankSetupForm`.
   - Instead, accept props from the parent:
     - `onCreateTank(tankData) => Promise<boolean>`
     - `onUpdateTank(id, tankData) => Promise<boolean>`
   - Keep the local form UI state (inputs) inside the form component as it is now.

2) Lift the actual “create/update + refresh” responsibility to FuelDashboard
   - In `FuelDashboard`, pull `createTank`, `updateTank`, and `refresh` from its single `useFuelManagement()` instance.
   - Implement wrapper handlers in `FuelDashboard`:
     - `handleCreateTank(tankData)` calls `createTank(tankData)` and then ensures `refresh()` runs (or relies on createTank doing fetch + returns truthy).
     - `handleUpdateTank(id, tankData)` calls `updateTank(id, tankData)` and then `refresh()`.
   - Pass these handlers into `TankSetupForm`.

3) Apply the same fix pattern to the other Fuel forms (to avoid similar “it saved but UI didn’t change” issues)
   - `PumpSetupForm` currently calls `useFuelManagement()` internally; refactor to accept `onCreatePump`.
   - `QuickSaleForm` refactor to accept `onRecordSale`.
   - `DeliveryLogForm` refactor to accept `onRecordDelivery`.
   - `ReconciliationForm` refactor to accept `onRecordReconciliation`.
   - FuelDashboard already has all the needed functions from the single hook instance; it can pass them down.
   - Result: one source of truth for fuel state on the page, and every operation updates the same state.

4) Add a small UX confirmation and “force refresh” safety net
   - After a successful create/update, close the sheet (already done) and show toast (already done in hook).
   - Additionally, call `refresh()` in the parent after closing the sheet to guarantee the list updates even if the hook’s internal fetch order changes later.

5) Verification steps (end-to-end)
   - Open `/business/fuel`
   - Click Add Tank → enter name and capacity → Save
   - Confirm:
     - A success toast appears
     - The sheet closes
     - The new tank appears immediately in the Tanks grid (no manual reload)
   - Repeat for Add Pump, Record Delivery, Record Sale, Reconciliation to ensure each action updates the visible stats and lists.

Technical notes (why this is the right fix)
- `useFuelManagement()` is not a React Context/store; it’s a stateful hook. Using it in multiple components creates multiple independent copies of state.
- Passing the mutation functions down (or using a Provider) ensures all UI reads/writes go through the same state instance.
- This also reduces backend calls and makes the UI feel consistent (stats/cards update immediately).

Alternative (bigger refactor, not necessary right now)
- Create a `FuelManagementProvider` (React context) and wrap the Fuel Dashboard so any nested component can access the same state with `useFuel()`.
- This is cleaner long-term, but the prop-based approach above is the smallest change to fix your “it doesn’t save” symptom quickly.
