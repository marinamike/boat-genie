import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChatMessage {
  id: string;
  work_order_id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  image_url: string | null;
  message_type: "user" | "system" | "image";
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender_display_name: string;
  is_own_message: boolean;
}

export interface ChatParticipant {
  id: string;
  display_name: string;
  role: "owner" | "provider" | "admin";
}

interface UseWorkOrderChatProps {
  workOrderId: string;
  isOpen: boolean;
}

export function useWorkOrderChat({ workOrderId, isOpen }: UseWorkOrderChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [participant, setParticipant] = useState<ChatParticipant | null>(null);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!workOrderId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setCurrentUserId(session.user.id);

      const { data: isAdmin } = await supabase.rpc("is_platform_admin");

      const { data: workOrder, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          provider_id,
          boat_id,
          boats!inner (
            id,
            name,
            owner_id
          )
        `)
        .eq("id", workOrderId)
        .single();

      if (error) throw error;

      const boat = workOrder.boats as { id: string; name: string; owner_id: string };
      const isOwner = boat.owner_id === session.user.id;
      const isProvider = workOrder.provider_id === session.user.id;

      if (isAdmin) {
        setParticipant({
          id: session.user.id,
          display_name: "Boat Genie Admin",
          role: "admin",
        });
        setRecipientId(workOrder.provider_id || boat.owner_id);
      } else if (isOwner) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();
        
        const firstName = profile?.full_name?.split(" ")[0] || "Boat Owner";
        setParticipant({
          id: session.user.id,
          display_name: firstName,
          role: "owner",
        });
        setRecipientId(workOrder.provider_id);
      } else if (isProvider) {
        // Get provider's business name from businesses table (unified schema)
        const { data: businessProfile } = await supabase
          .from("businesses")
          .select("business_name")
          .eq("owner_id", session.user.id)
          .single();
        
        setParticipant({
          id: session.user.id,
          display_name: businessProfile?.business_name || "Service Provider",
          role: "provider",
        });
        setRecipientId(boat.owner_id);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  }, [workOrderId]);

  const fetchMessages = useCallback(async () => {
    if (!workOrderId || !currentUserId) return;

    setLoading(true);
    try {
      const { data: isAdmin } = await supabase.rpc("is_platform_admin");

      const { data: workOrder } = await supabase
        .from("work_orders")
        .select(`
          provider_id,
          boats!inner (
            name,
            owner_id
          )
        `)
        .eq("id", workOrderId)
        .single();

      const boat = workOrder?.boats as { name: string; owner_id: string } | null;
      
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", senderIds);

      // Get business names from businesses table (unified schema)
      const { data: businessProfiles } = await supabase
        .from("businesses")
        .select("owner_id, business_name")
        .in("owner_id", senderIds);

      const mappedMessages: ChatMessage[] = (messagesData || []).map(msg => {
        let senderDisplayName = "Unknown";
        const isOwnMessage = msg.sender_id === currentUserId;
        
        if (msg.message_type === "system") {
          senderDisplayName = "Boat Genie";
        } else if (isAdmin) {
          const profile = profiles?.find(p => p.id === msg.sender_id);
          const businessProfile = businessProfiles?.find(p => p.owner_id === msg.sender_id);
          senderDisplayName = businessProfile?.business_name || profile?.full_name || "User";
        } else if (msg.sender_id === currentUserId) {
          senderDisplayName = "You";
        } else if (msg.sender_id === workOrder?.provider_id) {
          const businessProfile = businessProfiles?.find(p => p.owner_id === msg.sender_id);
          senderDisplayName = businessProfile?.business_name || "Service Provider";
        } else if (msg.sender_id === boat?.owner_id) {
          const profile = profiles?.find(p => p.id === msg.sender_id);
          const firstName = profile?.full_name?.split(" ")[0] || "Boat Owner";
          senderDisplayName = firstName;
        }

        return {
          ...msg,
          message_type: msg.message_type as "user" | "system" | "image",
          sender_display_name: senderDisplayName,
          is_own_message: isOwnMessage,
        };
      });

      setMessages(mappedMessages);

      const unread = mappedMessages.filter(
        m => !m.is_read && m.recipient_id === currentUserId
      ).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [workOrderId, currentUserId]);

  const markAsRead = useCallback(async () => {
    if (!workOrderId || !currentUserId) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("work_order_id", workOrderId)
        .eq("recipient_id", currentUserId)
        .eq("is_read", false);

      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [workOrderId, currentUserId]);

  const sendMessage = async (content: string, imageUrl?: string) => {
    if (!workOrderId || !currentUserId || !recipientId) return false;
    if (!content.trim() && !imageUrl) return false;

    setSending(true);
    try {
      const messageType = imageUrl ? "image" : "user";
      
      const { error } = await supabase
        .from("messages")
        .insert({
          work_order_id: workOrderId,
          sender_id: currentUserId,
          recipient_id: recipientId,
          content: content.trim() || null,
          image_url: imageUrl || null,
          message_type: messageType,
        });

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (file: File) => {
    if (!currentUserId) return false;

    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${currentUserId}/${workOrderId}_${Date.now()}.${fileExt}`;

      const contentTypeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      const contentType = contentTypeMap[fileExt || ""] || file.type;

      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(fileName, file, {
          contentType,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      return await sendMessage("", fileName);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Failed to upload image",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const createSystemMessage = async (content: string, recipientIdOverride?: string) => {
    if (!workOrderId || !currentUserId) return false;

    try {
      const { data: workOrder } = await supabase
        .from("work_orders")
        .select(`
          provider_id,
          boats!inner (owner_id)
        `)
        .eq("id", workOrderId)
        .single();

      const boat = workOrder?.boats as { owner_id: string } | null;
      const targetRecipient = recipientIdOverride || 
        (currentUserId === workOrder?.provider_id ? boat?.owner_id : workOrder?.provider_id);

      if (!targetRecipient) return false;

      const { error } = await supabase
        .from("messages")
        .insert({
          work_order_id: workOrderId,
          sender_id: currentUserId,
          recipient_id: targetRecipient,
          content,
          message_type: "system",
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error creating system message:", error);
      return false;
    }
  };

  useEffect(() => {
    if (!workOrderId || !isOpen) return;

    const channel = supabase
      .channel(`messages:${workOrderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `work_order_id=eq.${workOrderId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [workOrderId, isOpen, fetchMessages]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useEffect(() => {
    if (currentUserId) {
      fetchMessages();
    }
  }, [currentUserId, fetchMessages]);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAsRead();
    }
  }, [isOpen, unreadCount, markAsRead]);

  return {
    messages,
    loading,
    sending,
    participant,
    unreadCount,
    sendMessage,
    sendImage,
    createSystemMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}
