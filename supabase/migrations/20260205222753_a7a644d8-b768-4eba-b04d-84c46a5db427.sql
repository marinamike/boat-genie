-- ============================================
-- SERVICE & REFIT MANAGEMENT MODULE
-- ============================================

-- Service Staff Skills/Specialties
CREATE TYPE service_specialty AS ENUM (
  'diesel_mechanic',
  'outboard_mechanic',
  'electrician',
  'electronics',
  'fiberglass',
  'gelcoat',
  'painter',
  'canvas',
  'detailer',
  'rigger',
  'welder',
  'carpenter',
  'general'
);

-- Service Staff table (extends business_staff with service-specific data)
CREATE TABLE public.service_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  specialties service_specialty[] NOT NULL DEFAULT '{}',
  internal_hourly_rate NUMERIC NOT NULL DEFAULT 0,
  billable_hourly_rate NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Work Order Phase Status
CREATE TYPE work_order_phase_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'blocked'
);

-- Work Order Phases (multi-phase jobs)
CREATE TABLE public.work_order_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL DEFAULT 1,
  phase_name TEXT NOT NULL,
  description TEXT,
  estimated_hours NUMERIC,
  actual_hours NUMERIC DEFAULT 0,
  status work_order_phase_status NOT NULL DEFAULT 'pending',
  assigned_staff_id UUID REFERENCES public.service_staff(id),
  requires_haul_out BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Time Entries (punch in/out) - calculated in app layer
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_staff_id UUID NOT NULL REFERENCES public.service_staff(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.work_order_phases(id),
  punch_in TIMESTAMP WITH TIME ZONE NOT NULL,
  punch_out TIMESTAMP WITH TIME ZONE,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  is_billable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Yard Equipment (travel-lifts, forklifts, etc.)
CREATE TABLE public.yard_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  max_capacity_lbs INTEGER,
  max_beam_ft NUMERIC,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Haul Out Bays
CREATE TABLE public.haul_out_bays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  bay_name TEXT NOT NULL,
  max_length_ft NUMERIC,
  max_beam_ft NUMERIC,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Yard Calendar (equipment/bay scheduling)
CREATE TABLE public.yard_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  boat_id UUID NOT NULL REFERENCES public.boats(id),
  event_type TEXT NOT NULL,
  equipment_id UUID REFERENCES public.yard_equipment(id),
  bay_id UUID REFERENCES public.haul_out_bays(id),
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  assigned_operator_id UUID REFERENCES public.service_staff(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Boats on Blocks (yard status) - days calculated in app
CREATE TABLE public.boats_on_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  boat_id UUID NOT NULL REFERENCES public.boats(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  bay_id UUID REFERENCES public.haul_out_bays(id),
  yard_location TEXT,
  hauled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_launch TIMESTAMP WITH TIME ZONE,
  launched_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QC Checklist Templates
CREATE TABLE public.qc_checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  checklist_items JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QC Inspections (completed checklists)
CREATE TABLE public.qc_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.work_order_phases(id),
  template_id UUID REFERENCES public.qc_checklist_templates(id),
  submitted_by UUID NOT NULL REFERENCES public.service_staff(id),
  completed_items JSONB NOT NULL DEFAULT '[]',
  all_items_passed BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Parts Pulls (from POS for work orders)
CREATE TABLE public.parts_pulls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.work_order_phases(id),
  inventory_item_id UUID REFERENCES public.store_inventory(id),
  pulled_by UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  pulled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Service Invoices
CREATE TABLE public.service_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  owner_id UUID NOT NULL,
  boat_id UUID NOT NULL REFERENCES public.boats(id),
  labor_hours NUMERIC NOT NULL DEFAULT 0,
  labor_rate NUMERIC NOT NULL DEFAULT 0,
  labor_total NUMERIC NOT NULL DEFAULT 0,
  parts_total NUMERIC NOT NULL DEFAULT 0,
  haul_fee NUMERIC NOT NULL DEFAULT 0,
  launch_fee NUMERIC NOT NULL DEFAULT 0,
  storage_days INTEGER NOT NULL DEFAULT 0,
  storage_daily_rate NUMERIC NOT NULL DEFAULT 0,
  storage_total NUMERIC NOT NULL DEFAULT 0,
  other_fees NUMERIC NOT NULL DEFAULT 0,
  other_fees_description TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yard_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haul_out_bays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yard_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boats_on_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_pulls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can manage service staff"
  ON public.service_staff FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business can manage work order phases"
  ON public.work_order_phases FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business can manage time entries"
  ON public.time_entries FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business can manage yard equipment"
  ON public.yard_equipment FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business can manage haul out bays"
  ON public.haul_out_bays FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business can manage yard calendar"
  ON public.yard_calendar FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business can manage boats on blocks"
  ON public.boats_on_blocks FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Boat owners can view their boat status"
  ON public.boats_on_blocks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM boats WHERE boats.id = boat_id AND boats.owner_id = auth.uid()
  ));

CREATE POLICY "Business can manage QC templates"
  ON public.qc_checklist_templates FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business can manage QC inspections"
  ON public.qc_inspections FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business can manage parts pulls"
  ON public.parts_pulls FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Business can manage invoices"
  ON public.service_invoices FOR ALL
  USING (is_business_owner(business_id) OR is_business_staff(business_id));

CREATE POLICY "Owners can view their invoices"
  ON public.service_invoices FOR SELECT
  USING (owner_id = auth.uid());

-- Indexes
CREATE INDEX idx_service_staff_business ON public.service_staff(business_id);
CREATE INDEX idx_work_order_phases_work_order ON public.work_order_phases(work_order_id);
CREATE INDEX idx_time_entries_work_order ON public.time_entries(work_order_id);
CREATE INDEX idx_time_entries_staff ON public.time_entries(service_staff_id);
CREATE INDEX idx_yard_calendar_business ON public.yard_calendar(business_id);
CREATE INDEX idx_yard_calendar_scheduled ON public.yard_calendar(scheduled_start, scheduled_end);
CREATE INDEX idx_boats_on_blocks_business ON public.boats_on_blocks(business_id);
CREATE INDEX idx_boats_on_blocks_active ON public.boats_on_blocks(business_id) WHERE launched_at IS NULL;
CREATE INDEX idx_qc_inspections_work_order ON public.qc_inspections(work_order_id);
CREATE INDEX idx_parts_pulls_work_order ON public.parts_pulls(work_order_id);
CREATE INDEX idx_service_invoices_work_order ON public.service_invoices(work_order_id);

-- Triggers for updated_at
CREATE TRIGGER update_service_staff_updated_at
  BEFORE UPDATE ON public.service_staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_order_phases_updated_at
  BEFORE UPDATE ON public.work_order_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yard_equipment_updated_at
  BEFORE UPDATE ON public.yard_equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_haul_out_bays_updated_at
  BEFORE UPDATE ON public.haul_out_bays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_yard_calendar_updated_at
  BEFORE UPDATE ON public.yard_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_boats_on_blocks_updated_at
  BEFORE UPDATE ON public.boats_on_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qc_checklist_templates_updated_at
  BEFORE UPDATE ON public.qc_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_invoices_updated_at
  BEFORE UPDATE ON public.service_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();