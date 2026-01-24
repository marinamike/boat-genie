import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FORT_LAUDERDALE_MARINAS = [
  {
    marina_name: "Bahia Mar Yachting Center",
    address: "801 Seabreeze Blvd, Fort Lauderdale, FL 33316",
    latitude: 26.1011,
    longitude: -80.1044,
    max_length_ft: 300,
    max_beam_ft: 50,
    max_draft_ft: 12,
    min_depth_ft: 10,
    power_options: ["30A", "50A", "100A", "3-Phase"],
    transient_rate_per_ft: 4.50,
    monthly_base_rate: 2500,
    fuel_gas: true,
    fuel_diesel: true,
    has_pool: true,
    has_pumpout: true,
    has_laundry: true,
    has_restaurant: true,
    has_security: true,
    has_wifi: true,
    contact_email: "marina@bahiamar.com",
    contact_phone: "(954) 764-2233",
    website_url: "https://bahiamaryachtingcenter.com",
    description: "Premier yachting destination in the heart of Fort Lauderdale. Home to the Fort Lauderdale International Boat Show.",
  },
  {
    marina_name: "Pier Sixty-Six Marina",
    address: "2301 SE 17th St, Fort Lauderdale, FL 33316",
    latitude: 26.1008,
    longitude: -80.1164,
    max_length_ft: 250,
    max_beam_ft: 45,
    max_draft_ft: 10,
    min_depth_ft: 8,
    power_options: ["30A", "50A", "100A"],
    transient_rate_per_ft: 5.00,
    monthly_base_rate: 3000,
    fuel_gas: true,
    fuel_diesel: true,
    has_pool: true,
    has_pumpout: true,
    has_laundry: true,
    has_restaurant: true,
    has_security: true,
    has_wifi: true,
    contact_email: "marina@pier66.com",
    contact_phone: "(954) 525-6666",
    website_url: "https://pier66.com",
    description: "Iconic landmark marina with world-class amenities and a rotating rooftop lounge.",
  },
  {
    marina_name: "Lauderdale Marine Center",
    address: "2019 SW 20th St, Fort Lauderdale, FL 33315",
    latitude: 26.0917,
    longitude: -80.1456,
    max_length_ft: 200,
    max_beam_ft: 40,
    max_draft_ft: 12,
    min_depth_ft: 12,
    power_options: ["50A", "100A", "3-Phase"],
    transient_rate_per_ft: 3.75,
    monthly_base_rate: 2000,
    fuel_gas: false,
    fuel_diesel: true,
    has_pool: false,
    has_pumpout: true,
    has_laundry: true,
    has_restaurant: false,
    has_security: true,
    has_wifi: true,
    contact_email: "info@lauderdalemarinecenter.com",
    contact_phone: "(954) 713-0333",
    website_url: "https://lauderdalemarinecenter.com",
    description: "Full-service refit and repair yard with deep-water slips. Ideal for vessels requiring maintenance.",
  },
  {
    marina_name: "Las Olas Marina",
    address: "240 Las Olas Circle, Fort Lauderdale, FL 33316",
    latitude: 26.1175,
    longitude: -80.1278,
    max_length_ft: 150,
    max_beam_ft: 35,
    max_draft_ft: 8,
    min_depth_ft: 7,
    power_options: ["30A", "50A"],
    transient_rate_per_ft: 3.00,
    monthly_base_rate: 1800,
    fuel_gas: true,
    fuel_diesel: true,
    has_pool: false,
    has_pumpout: true,
    has_laundry: false,
    has_restaurant: true,
    has_security: true,
    has_wifi: true,
    contact_email: "marina@lasolasmarina.com",
    contact_phone: "(954) 463-1111",
    website_url: "https://lasolasmarina.com",
    description: "Walking distance to Las Olas Boulevard shops, restaurants, and nightlife.",
  },
  {
    marina_name: "Sunrise Harbor Marina",
    address: "1501 SE 17th St Causeway, Fort Lauderdale, FL 33316",
    latitude: 26.0989,
    longitude: -80.1089,
    max_length_ft: 120,
    max_beam_ft: 30,
    max_draft_ft: 7,
    min_depth_ft: 6,
    power_options: ["30A", "50A"],
    transient_rate_per_ft: 2.75,
    monthly_base_rate: 1500,
    fuel_gas: true,
    fuel_diesel: false,
    has_pool: true,
    has_pumpout: true,
    has_laundry: true,
    has_restaurant: false,
    has_security: true,
    has_wifi: true,
    contact_email: "info@sunriseharbor.com",
    contact_phone: "(954) 525-8678",
    website_url: "https://sunriseharbormarina.com",
    description: "Quiet, family-friendly marina with easy access to the Intracoastal Waterway.",
  },
];

export function MarinaSeedButton() {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSeed = async () => {
    setSeeding(true);
    const successfulSeeds: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const marina of FORT_LAUDERDALE_MARINAS) {
        // Check if marina already exists
        const { data: existing } = await supabase
          .from("marinas")
          .select("id")
          .eq("marina_name", marina.marina_name)
          .maybeSingle();

        if (existing) {
          successfulSeeds.push(marina.marina_name);
          continue;
        }

        const { error } = await supabase.from("marinas").insert({
          ...marina,
          manager_id: user.id,
          is_claimed: false,
          accepts_transient: true,
          accepts_longterm: true,
          require_insurance_long_term: true,
          require_registration: true,
          auto_approve_transient: false,
          photos: [],
        });

        if (error) {
          console.error(`Failed to seed ${marina.marina_name}:`, error);
        } else {
          successfulSeeds.push(marina.marina_name);
        }
      }

      setSeeded(successfulSeeds);
      toast({
        title: "Marinas Seeded",
        description: `Successfully added ${successfulSeeds.length} Fort Lauderdale marinas`,
      });
    } catch (error) {
      console.error("Seeding error:", error);
      toast({
        title: "Seeding Failed",
        description: "Could not seed marina data",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Seed Test Marinas
        </CardTitle>
        <CardDescription>
          Add real Fort Lauderdale marinas for testing the discovery system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {FORT_LAUDERDALE_MARINAS.map((marina) => (
            <div
              key={marina.marina_name}
              className="flex items-center gap-2 text-sm p-2 rounded border"
            >
              {seeded.includes(marina.marina_name) ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <MapPin className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="flex-1">{marina.marina_name}</span>
              <Badge variant="outline">{marina.max_length_ft}ft max</Badge>
            </div>
          ))}
        </div>

        <Button onClick={handleSeed} disabled={seeding} className="w-full">
          {seeding ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Seeding...
            </>
          ) : seeded.length > 0 ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {seeded.length} Marinas Seeded
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Seed Fort Lauderdale Marinas
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}