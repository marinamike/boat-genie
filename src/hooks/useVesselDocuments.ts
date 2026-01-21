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
  file_url: string; // This now stores the file path, not the signed URL
  file_type: string;
  file_size_bytes: number | null;
  expiry_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

const STORAGE_BUCKET = "vessel-vault";

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

  // Generate a fresh signed URL for viewing a document (60 seconds)
  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      return data?.signedUrl || null;
    } catch (error) {
      console.error("Error generating signed URL:", error);
      return null;
    }
  };

  const deleteDocument = async (docId: string, filePath: string) => {
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue with DB delete even if storage fails
      }

      // Delete from database
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
    getSignedUrl,
    refetch: fetchDocuments,
    storageBucket: STORAGE_BUCKET,
  };
}
