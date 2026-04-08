

## Plan: Service Catalog Table + Catalog-Driven Service Menu

### 1. Database Migration — Create `service_catalog` table and seed data

Create table `service_catalog` with columns `id` (uuid, PK), `category` (text, not null), `name` (text, not null), unique constraint on (category, name). RLS disabled (public reference data). Seed with exact service names:

- **Detailing & Cleaning** (7): Basic Wash, Full Detail, Wax & Polish, Interior Detail, Engine Room Cleaning, Canvas & Covers Cleaning, Teak Cleaning & Treatment
- **Engines & Propulsion** (6): Engine Diagnostic, Engine Service, Generator Service, Propeller Service, Transmission Service, Winterization / Dewinterization
- **Electrical & Electronics** (7): Electrical Diagnostic, Battery Service, Shore Power & Inverter, Navigation Electronics, Lighting, VHF & Communication, Marine Audio
- **Hull, Bottom & Deck** (11): Bottom Paint, Fiberglass & Gelcoat Repair, Waterline Stripe, Zinc Replacement, Teak Deck Service, Deck Hardware Service, Nonskid Service, Caulking & Sealing, Hatch & Port Service, Railing & Stanchion Service, Windshield Service
- **Plumbing & Water Systems** (7): Fresh Water System, Sanitation & Waste System, Bilge System, Pump Service, Watermaker Service, Cooling System, Raw Water System
- **Canvas, Upholstery & Interior** (5): Bimini Service, Enclosure Service, T-Top Repair, Upholstery Service, Custom Canvas Work
- **Rigging & Sails** (6): Rigging Inspection, Standing Rigging, Running Rigging, Furling System, Windlass Service, Block & Tackle
- **Stabilizers & Steering** (3): Gyro Stabilizer Service, Fin Stabilizer Service, Steering System Service
- **Custom Request** (1): Custom Request

### 2. `src/hooks/useServiceMenu.ts`

- Remove `import { SERVICE_CATEGORIES } from "@/hooks/useWishForm"`
- Replace `SERVICE_MENU_CATEGORIES` with hardcoded 9-category array
- Add `{ value: "diagnostic_fee", label: "Diagnostic Fee" }` to `PRICING_MODELS`
- Add `fetchCatalogServices(category: string)` — queries `service_catalog` filtered by category, returns array of name strings
- Export from hook return

### 3. `src/components/business/ServiceMenuManager.tsx`

- Add state: `catalogServices: string[]` (names for selected category), `loadingCatalog: boolean`
- On category change (create mode): fetch catalog services for that category, reset name selection
- **Create mode**: Name field becomes a `<Select>` dropdown populated from `catalogServices`
- **Edit mode**: Name displays as read-only text (not editable); category selector also disabled. Only pricing model, price, and description are editable
- Default category changed from `"General"` to `"Detailing & Cleaning"`
- Add `diagnostic_fee` display suffix (none — flat amount like fixed)

