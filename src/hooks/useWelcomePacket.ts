import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WelcomePacketFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export function useWelcomePacket() {
  const [files, setFiles] = useState<WelcomePacketFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchFiles = useCallback(async () => {
    const { data, error } = await supabase
      .from("welcome_packet_files")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching welcome packet files:", error);
    } else {
      setFiles(data as WelcomePacketFile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File, description?: string) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `welcome-packets/${fileName}`;

      // Determine file type
      const fileType = fileExt === "pdf" ? "pdf" : "image";

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("welcome-packets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("welcome-packets")
        .getPublicUrl(fileName);

      // Create database record
      const { data, error: dbError } = await supabase
        .from("welcome_packet_files")
        .insert({
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: fileType,
          description: description || null,
          display_order: files.length,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setFiles([...files, data as WelcomePacketFile]);
      toast({
        title: "File uploaded",
        description: `${file.name} added to welcome packet`,
      });

      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Upload failed";
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    try {
      // Extract filename from URL
      const urlParts = file.file_url.split("/");
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      await supabase.storage.from("welcome-packets").remove([fileName]);

      // Delete from database
      const { error } = await supabase
        .from("welcome_packet_files")
        .delete()
        .eq("id", fileId);

      if (error) throw error;

      setFiles(files.filter((f) => f.id !== fileId));
      toast({
        title: "File deleted",
        description: `${file.file_name} removed from welcome packet`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Delete failed";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const toggleFileActive = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const { error } = await supabase
      .from("welcome_packet_files")
      .update({ is_active: !file.is_active })
      .eq("id", fileId);

    if (error) {
      toast({
        title: "Error",
        description: "Could not update file",
        variant: "destructive",
      });
    } else {
      setFiles(
        files.map((f) =>
          f.id === fileId ? { ...f, is_active: !f.is_active } : f
        )
      );
    }
  };

  const sendWelcomePacket = async (boatId: string, ownerId: string) => {
    // Mark checkin as welcome packet sent
    const { error } = await supabase
      .from("boat_checkins")
      .update({
        welcome_packet_sent: true,
        welcome_packet_sent_at: new Date().toISOString(),
      })
      .eq("boat_id", boatId)
      .eq("owner_id", ownerId)
      .is("checked_out_at", null);

    if (error) {
      toast({
        title: "Error",
        description: "Could not send welcome packet",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Welcome packet sent!",
      description: "Boater will receive access to marina information",
    });
    return true;
  };

  return {
    files,
    loading,
    uploading,
    uploadFile,
    deleteFile,
    toggleFileActive,
    sendWelcomePacket,
    refetch: fetchFiles,
    activeFiles: files.filter((f) => f.is_active),
  };
}

export type { WelcomePacketFile };
