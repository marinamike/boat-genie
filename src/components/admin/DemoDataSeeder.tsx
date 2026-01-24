import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Anchor, 
  Ship, 
  Calendar, 
  Wrench, 
  CheckCircle2, 
  Loader2,
  Database,
  MapPin,
  FileText
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SeedStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "running" | "done" | "error";
}

const MARINAS_DATA = [
  {
    marina_name: "Bahia Mar Yachting Center",
    address: "801 Seabreeze Blvd, Fort Lauderdale, FL 33316",
    latitude: 26.1067,
    longitude: -80.1089,
    max_length_ft: 300,
    max_beam_ft: 50,
    max_draft_ft: 12,
    min_depth_ft: 10,
    power_options: ["50 amp", "100 amp", "100 amp/3-Phase"],
    transient_rate_per_ft: 5.50,
    monthly_base_rate: 45,
    fuel_gas: true,
    fuel_diesel: true,
    has_pool: true,
    has_pumpout: true,
    has_laundry: true,
    has_restaurant: false,
    has_security: true,
    has_wifi: true,
    contact_email: "dockmaster@bahiamar.com",
    contact_phone: "(954) 764-2233",
    website_url: "https://bahiamaryachtingcenter.com",
    description: "Premier yachting destination in Fort Lauderdale with world-class amenities and deep-water access for megayachts up to 300 feet.",
    total_slips: 250,
    staging_dock_linear_footage: 800,
    amenities: ["Pool", "Fuel Dock", "24/7 Security", "Ship Store", "Concierge"],
    is_claimed: true,
    accepts_transient: true,
    accepts_longterm: true,
  },
  {
    marina_name: "Miami Beach Marina",
    address: "300 Alton Rd, Miami Beach, FL 33139",
    latitude: 25.7741,
    longitude: -80.1445,
    max_length_ft: 250,
    max_beam_ft: 45,
    max_draft_ft: 10,
    min_depth_ft: 8,
    power_options: ["30 amp", "50 amp", "100 amp"],
    transient_rate_per_ft: 6.00,
    monthly_base_rate: 50,
    fuel_gas: true,
    fuel_diesel: true,
    has_pool: false,
    has_pumpout: true,
    has_laundry: true,
    has_restaurant: true,
    has_security: true,
    has_wifi: true,
    contact_email: "info@miamibeachmarina.com",
    contact_phone: "(305) 673-6000",
    website_url: "https://miamibeachmarina.com",
    description: "South Beach's premier marina featuring waterfront dining, full-service facilities, and easy access to Miami's vibrant nightlife.",
    total_slips: 400,
    staging_dock_linear_footage: 600,
    amenities: ["Restaurant", "Laundry", "Dive Shop", "Yacht Club", "Valet"],
    is_claimed: true,
    accepts_transient: true,
    accepts_longterm: true,
  },
  {
    marina_name: "Las Olas Marina",
    address: "240 E Las Olas Blvd, Fort Lauderdale, FL 33301",
    latitude: 26.1186,
    longitude: -80.1367,
    max_length_ft: 150,
    max_beam_ft: 35,
    max_draft_ft: 8,
    min_depth_ft: 7,
    power_options: ["30 amp", "50 amp", "100 amp"],
    transient_rate_per_ft: 4.50,
    monthly_base_rate: 40,
    fuel_gas: true,
    fuel_diesel: false,
    has_pool: false,
    has_pumpout: true,
    has_laundry: false,
    has_restaurant: true,
    has_security: true,
    has_wifi: true,
    contact_email: "marina@lasolasmarina.com",
    contact_phone: "(954) 463-2610",
    website_url: "https://lasolasmarina.com",
    description: "Downtown Fort Lauderdale's boutique marina with walkable access to Las Olas Boulevard shops and restaurants.",
    total_slips: 80,
    staging_dock_linear_footage: 300,
    amenities: ["Walking Distance to Downtown", "Security", "WiFi"],
    is_claimed: true,
    accepts_transient: true,
    accepts_longterm: true,
  },
];

const VESSELS_DATA = [
  {
    name: "Midnight Sun",
    make: "Azimut",
    model: "Grande 80",
    year: 2022,
    length_ft: 80,
    image_url: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800",
    engine_brand: "MAN",
    engine_model: "V12-1900",
    engine_hours: 450,
    specs: {
      loa_ft: 80,
      beam_ft: 20,
      draft_engines_down_ft: 6,
      draft_engines_up_ft: 5,
      fuel_capacity_gal: 1200,
      water_capacity_gal: 300,
      shore_power: "100 amp/3-Phase",
      max_speed_knots: 28,
      cruise_speed_knots: 22,
    },
    hasInsurance: true,
    hasRegistration: true,
  },
  {
    name: "Liquid Asset",
    make: "Boston Whaler",
    model: "420 Outrage",
    year: 2023,
    length_ft: 42,
    image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    engine_brand: "Mercury",
    engine_model: "Verado 600",
    engine_hours: 120,
    specs: {
      loa_ft: 42,
      beam_ft: 13,
      draft_engines_down_ft: 3,
      draft_engines_up_ft: 2,
      fuel_capacity_gal: 550,
      water_capacity_gal: 50,
      shore_power: "50 amp",
      max_speed_knots: 55,
      cruise_speed_knots: 35,
    },
    hasInsurance: false,
    hasRegistration: true,
  },
  {
    name: "Slow Burn",
    make: "Viking",
    model: "55 Convertible",
    year: 2021,
    length_ft: 55,
    image_url: "https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=800",
    engine_brand: "MAN",
    engine_model: "V8-1200",
    engine_hours: 680,
    specs: {
      loa_ft: 55,
      beam_ft: 17,
      draft_engines_down_ft: 5,
      draft_engines_up_ft: 4.5,
      fuel_capacity_gal: 800,
      water_capacity_gal: 150,
      shore_power: "50 amp",
      max_speed_knots: 38,
      cruise_speed_knots: 30,
    },
    hasInsurance: true,
    hasRegistration: true,
  },
];

export function DemoDataSeeder() {
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<SeedStep[]>([
    { id: "marinas", label: "Seed Marinas (3)", icon: <Anchor className="h-4 w-4" />, status: "pending" },
    { id: "provider", label: "Create Demo Provider", icon: <Wrench className="h-4 w-4" />, status: "pending" },
    { id: "vessels", label: "Seed Vessels (3)", icon: <Ship className="h-4 w-4" />, status: "pending" },
    { id: "documents", label: "Add Vessel Documents", icon: <FileText className="h-4 w-4" />, status: "pending" },
    { id: "reservations", label: "Create Reservations", icon: <Calendar className="h-4 w-4" />, status: "pending" },
    { id: "workorders", label: "Seed Work Orders", icon: <Wrench className="h-4 w-4" />, status: "pending" },
    { id: "boatlogs", label: "Add Historical Logs", icon: <Database className="h-4 w-4" />, status: "pending" },
  ]);

  const updateStep = (id: string, status: SeedStep["status"]) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const seedDemoData = async () => {
    setSeeding(true);
    setProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "You must be logged in to seed data", variant: "destructive" });
        return;
      }

      // Step 1: Seed Marinas
      updateStep("marinas", "running");
      const marinaIds: Record<string, string> = {};
      
      for (const marina of MARINAS_DATA) {
        const { data: existing } = await supabase
          .from("marinas")
          .select("id")
          .eq("marina_name", marina.marina_name)
          .maybeSingle();

        if (existing) {
          marinaIds[marina.marina_name] = existing.id;
        } else {
          const { data: newMarina, error } = await supabase
            .from("marinas")
            .insert({ ...marina, manager_id: user.id })
            .select("id")
            .single();

          if (error) throw error;
          marinaIds[marina.marina_name] = newMarina.id;
        }
      }
      updateStep("marinas", "done");
      setProgress(15);

      // Step 2: Create Demo Provider
      updateStep("provider", "running");
      let providerId: string | null = null;
      
      const { data: existingProvider } = await supabase
        .from("provider_profiles")
        .select("id")
        .eq("business_name", "Top Tier Marine Services")
        .maybeSingle();

      if (existingProvider) {
        providerId = existingProvider.id;
      } else {
        const { data: providerProfile, error: providerError } = await supabase
          .from("provider_profiles")
          .insert({
            user_id: user.id,
            business_name: "Top Tier Marine Services",
            bio: "Premier yacht detailing and maintenance services in South Florida. Certified technicians with 15+ years of experience.",
            service_categories: ["Detail/Wash", "Engine Service", "Bottom Paint", "Electronics"],
            hourly_rate: 85,
            diagnostic_fee: 150,
            insurance_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            onboarding_status: "approved",
            terms_accepted: true,
            is_available: true,
          })
          .select("id")
          .single();

        if (providerError) throw providerError;
        providerId = providerProfile.id;
      }
      updateStep("provider", "done");
      setProgress(30);

      // Step 3: Seed Vessels
      updateStep("vessels", "running");
      const boatIds: Record<string, string> = {};

      for (const vessel of VESSELS_DATA) {
        const { data: existing } = await supabase
          .from("boats")
          .select("id")
          .eq("name", vessel.name)
          .eq("owner_id", user.id)
          .maybeSingle();

        if (existing) {
          boatIds[vessel.name] = existing.id;
        } else {
          const { data: newBoat, error } = await supabase
            .from("boats")
            .insert({
              owner_id: user.id,
              name: vessel.name,
              make: vessel.make,
              model: vessel.model,
              year: vessel.year,
              length_ft: vessel.length_ft,
              image_url: vessel.image_url,
              engine_brand: vessel.engine_brand,
              engine_model: vessel.engine_model,
              engine_hours: vessel.engine_hours,
            })
            .select("id")
            .single();

          if (error) throw error;
          boatIds[vessel.name] = newBoat.id;

          // Add boat specs
          await supabase.from("boat_specs").insert({
            boat_id: newBoat.id,
            ...vessel.specs,
          });
        }
      }
      updateStep("vessels", "done");
      setProgress(45);

      // Step 4: Add Vessel Documents
      updateStep("documents", "running");
      for (const vessel of VESSELS_DATA) {
        const boatId = boatIds[vessel.name];
        
        if (vessel.hasInsurance) {
          const { data: existingIns } = await supabase
            .from("vessel_documents")
            .select("id")
            .eq("boat_id", boatId)
            .eq("category", "insurance")
            .maybeSingle();

          if (!existingIns) {
            await supabase.from("vessel_documents").insert({
              boat_id: boatId,
              owner_id: user.id,
              category: "insurance",
              title: "Certificate of Insurance - 2024",
              file_url: "https://example.com/demo-insurance.pdf",
              file_type: "application/pdf",
              expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            });
          }
        }

        if (vessel.hasRegistration) {
          const { data: existingReg } = await supabase
            .from("vessel_documents")
            .select("id")
            .eq("boat_id", boatId)
            .eq("category", "registration")
            .maybeSingle();

          if (!existingReg) {
            await supabase.from("vessel_documents").insert({
              boat_id: boatId,
              owner_id: user.id,
              category: "registration",
              title: "USCG Documentation",
              file_url: "https://example.com/demo-registration.pdf",
              file_type: "application/pdf",
              expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            });
          }
        }
      }
      updateStep("documents", "done");
      setProgress(60);

      // Step 5: Create Reservations
      updateStep("reservations", "running");
      const bahiaMarId = marinaIds["Bahia Mar Yachting Center"];
      const lasOlasId = marinaIds["Las Olas Marina"];
      const midnightSunId = boatIds["Midnight Sun"];
      const liquidAssetId = boatIds["Liquid Asset"];
      const slowBurnId = boatIds["Slow Burn"];

      // Pending transient for Midnight Sun at Bahia Mar
      const { data: existingRes1 } = await supabase
        .from("marina_reservations")
        .select("id")
        .eq("boat_id", midnightSunId)
        .eq("marina_id", bahiaMarId)
        .eq("status", "pending")
        .maybeSingle();

      if (!existingRes1) {
        await supabase.from("marina_reservations").insert({
          boat_id: midnightSunId,
          owner_id: user.id,
          marina_id: bahiaMarId,
          stay_type: "transient",
          status: "pending",
          requested_arrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          requested_departure: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          power_requirements: "100 amp/3-Phase",
          special_requests: "Need fuel dock access on arrival. Prefer slip near pool.",
        });
      }

      // Pending transient for Liquid Asset at Bahia Mar
      const { data: existingRes2 } = await supabase
        .from("marina_reservations")
        .select("id")
        .eq("boat_id", liquidAssetId)
        .eq("marina_id", bahiaMarId)
        .eq("status", "pending")
        .maybeSingle();

      if (!existingRes2) {
        await supabase.from("marina_reservations").insert({
          boat_id: liquidAssetId,
          owner_id: user.id,
          marina_id: bahiaMarId,
          stay_type: "transient",
          status: "pending",
          requested_arrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          requested_departure: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          power_requirements: "50 amp",
        });
      }

      // Confirmed long-term for Slow Burn at Las Olas
      const { data: existingRes3 } = await supabase
        .from("marina_reservations")
        .select("id")
        .eq("boat_id", slowBurnId)
        .eq("marina_id", lasOlasId)
        .eq("stay_type", "monthly")
        .maybeSingle();

      if (!existingRes3) {
        await supabase.from("marina_reservations").insert({
          boat_id: slowBurnId,
          owner_id: user.id,
          marina_id: lasOlasId,
          stay_type: "monthly",
          status: "approved",
          requested_arrival: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          assigned_slip: "A-12",
          assigned_dock_location: "A Dock",
          power_requirements: "50 amp",
          insurance_verified: true,
          registration_verified: true,
        });
      }
      updateStep("reservations", "done");
      setProgress(75);

      // Step 6: Seed Work Orders
      updateStep("workorders", "running");
      
      // Active Detail/Wash for Midnight Sun
      const { data: existingWO1 } = await supabase
        .from("work_orders")
        .select("id")
        .eq("boat_id", midnightSunId)
        .eq("status", "in_progress")
        .maybeSingle();

      if (!existingWO1) {
        await supabase.from("work_orders").insert({
          boat_id: midnightSunId,
          provider_id: user.id,
          service_type: "pro_service",
          title: "Detail & Wash - Midnight Sun",
          description: "Full exterior wash and wax, interior detail, teak cleaning",
          status: "in_progress",
          retail_price: 1200,
        });
      }

      // Completed Engine Service for Slow Burn
      const { data: existingWO2 } = await supabase
        .from("work_orders")
        .select("id")
        .eq("boat_id", slowBurnId)
        .eq("status", "completed")
        .maybeSingle();

      let completedWOId: string | null = null;
      if (!existingWO2) {
        const { data: newWO } = await supabase
          .from("work_orders")
          .insert({
            boat_id: slowBurnId,
            provider_id: user.id,
            service_type: "pro_service",
            title: "500-Hour Engine Service",
            description: "500-hour service on twin MAN V8-1200 engines. Oil change, filters, impellers, and zincs.",
            status: "completed",
            retail_price: 3650,
            wholesale_price: 3500,
            completed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select("id")
          .single();
        
        if (newWO) completedWOId = newWO.id;
      } else {
        completedWOId = existingWO2.id;
      }
      updateStep("workorders", "done");
      setProgress(90);

      // Step 7: Add Historical Boat Logs
      updateStep("boatlogs", "running");
      if (completedWOId) {
        const { data: existingLog } = await supabase
          .from("boat_logs")
          .select("id")
          .eq("work_order_id", completedWOId)
          .maybeSingle();

        if (!existingLog) {
          await supabase.from("boat_logs").insert({
            boat_id: slowBurnId,
            work_order_id: completedWOId,
            title: "500-Hour Engine Service Completed",
            description: "Full 500-hour service performed by Top Tier Marine. Both engines running smoothly. Next service due at 1000 hours.",
            log_type: "service",
            created_by: user.id,
          });
        }
      }

      // Add a manual maintenance log
      const { data: existingManualLog } = await supabase
        .from("boat_logs")
        .select("id")
        .eq("boat_id", slowBurnId)
        .eq("title", "Bottom Paint - Annual Haul Out")
        .maybeSingle();

      if (!existingManualLog) {
        await supabase.from("boat_logs").insert({
          boat_id: slowBurnId,
          title: "Bottom Paint - Annual Haul Out",
          description: "Applied Interlux Micron 66 bottom paint during annual haul. Inspected running gear, replaced cutlass bearings.",
          log_type: "maintenance",
          created_by: user.id,
        });
      }
      updateStep("boatlogs", "done");
      setProgress(100);

      toast({
        title: "Demo Data Seeded Successfully!",
        description: "3 marinas, 3 vessels, reservations, work orders, and logs have been created.",
      });

    } catch (error: any) {
      console.error("Seeding error:", error);
      toast({
        title: "Seeding Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Demo Data Seeder
        </CardTitle>
        <CardDescription>
          Populate the platform with realistic marina, vessel, and reservation data for demos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Marina Preview */}
        <div className="grid gap-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Marinas to Seed
          </h4>
          <div className="grid gap-1">
            {MARINAS_DATA.map((m) => (
              <div key={m.marina_name} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                <span>{m.marina_name}</span>
                <Badge variant="outline">{m.max_length_ft}' Max</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Vessels Preview */}
        <div className="grid gap-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Ship className="h-4 w-4" /> Vessels to Seed
          </h4>
          <div className="grid gap-1">
            {VESSELS_DATA.map((v) => (
              <div key={v.name} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                <span>"{v.name}" - {v.length_ft}' {v.make}</span>
                <div className="flex gap-1">
                  {v.hasInsurance && <Badge variant="secondary" className="text-xs">Insurance</Badge>}
                  {v.hasRegistration && <Badge variant="secondary" className="text-xs">Registration</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Steps */}
        {seeding && (
          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            <div className="grid gap-1">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2 text-sm">
                  {step.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  {step.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  {step.status === "pending" && <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />}
                  {step.status === "error" && <div className="h-4 w-4 rounded-full bg-destructive" />}
                  <span className={step.status === "done" ? "text-muted-foreground" : ""}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={seedDemoData} 
          disabled={seeding}
          className="w-full"
          size="lg"
        >
          {seeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Seeding Demo Data...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Seed All Demo Data
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
