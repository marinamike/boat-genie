import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Vessel {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  length_ft: number | null;
  image_url: string | null;
}

interface VesselContextType {
  vessels: Vessel[];
  activeVessel: Vessel | null;
  activeVesselId: string | null;
  setActiveVesselId: (id: string | null) => void;
  selectVesselAndNavigate: (vesselId: string, path?: string) => void;
  loading: boolean;
  refetchVessels: () => Promise<void>;
}

const VesselContext = createContext<VesselContextType | undefined>(undefined);

export function VesselProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [activeVesselId, setActiveVesselIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch vessels for the current user
  const fetchVessels = useCallback(async () => {
    if (!user) {
      setVessels([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("boats")
        .select("id, name, make, model, year, length_ft, image_url")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setVessels(data || []);

      // Auto-select if only one vessel and none selected
      if (data && data.length === 1 && !activeVesselId) {
        setActiveVesselIdState(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching vessels:", error);
    } finally {
      setLoading(false);
    }
  }, [user, activeVesselId]);

  // Initial fetch
  useEffect(() => {
    fetchVessels();
  }, [fetchVessels]);

  // Sync with URL params on mount
  useEffect(() => {
    const boatParam = searchParams.get("boat");
    if (boatParam && vessels.some((v) => v.id === boatParam)) {
      setActiveVesselIdState(boatParam);
    }
  }, [searchParams, vessels]);

  // Set active vessel and optionally update URL
  const setActiveVesselId = useCallback(
    (id: string | null) => {
      setActiveVesselIdState(id);
      // Update URL if we're on a page that uses the boat param
      const currentPath = window.location.pathname;
      if (currentPath === "/boat-log") {
        if (id) {
          setSearchParams({ boat: id }, { replace: true });
        } else {
          setSearchParams({}, { replace: true });
        }
      }
    },
    [setSearchParams]
  );

  // Select vessel and navigate to a specific path
  const selectVesselAndNavigate = useCallback(
    (vesselId: string, path: string = "/boat-log") => {
      setActiveVesselIdState(vesselId);
      navigate(`${path}?boat=${vesselId}`);
    },
    [navigate]
  );

  // Get the active vessel object
  const activeVessel = vessels.find((v) => v.id === activeVesselId) || null;

  return (
    <VesselContext.Provider
      value={{
        vessels,
        activeVessel,
        activeVesselId,
        setActiveVesselId,
        selectVesselAndNavigate,
        loading,
        refetchVessels: fetchVessels,
      }}
    >
      {children}
    </VesselContext.Provider>
  );
}

export function useVessel() {
  const context = useContext(VesselContext);
  if (context === undefined) {
    throw new Error("useVessel must be used within a VesselProvider");
  }
  return context;
}
