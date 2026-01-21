import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VesselDocument {
  id: string;
  boat_id: string;
  owner_id: string;
  category: "manuals" | "warranty" | "documentation";
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size_bytes: number | null;
  expiry_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useVesselDocuments(boatId: string | null) {
  const [documents, setDocuments] = useState<VesselDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    if (!boatId) {
      setDocuments([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vessel_documents")
        .select("*")
        .eq("boat_id", boatId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments((data as VesselDocument[]) || []);
    } catch (error) {
      console.error("Error fetching vessel documents:", error);
    } finally {
      setLoading(false);
    }
  }, [boatId]);

  const deleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("vessel_documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast({
        title: "Document deleted",
        description: "The document has been removed from your vault.",
      });
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    deleteDocument,
    refetch: fetchDocuments,
  };
}
