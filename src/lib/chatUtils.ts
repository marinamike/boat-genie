import { supabase } from "@/integrations/supabase/client";

// Status update messages for the chat timeline
const STATUS_MESSAGES: Record<string, string> = {
  "approved": "✨ Quote accepted — Job is confirmed",
  "work_started": "🔧 Provider is on-site and has started work",
  "pending_photos": "📸 Work completed — Photos have been uploaded",
  "pending_release": "📋 QC Review requested — Awaiting verification",
  "released": "💰 Payment released — Job complete!",
  "disputed": "⚠️ Issue reported — Escrow frozen for review",
  "deposit_released": "💵 Materials deposit released to provider",
};

/**
 * Creates a system message in the chat when work order status changes
 * This keeps the chat timeline in sync with job progress
 */
export async function syncStatusToChat(
  workOrderId: string,
  newStatus: string,
  senderId: string
): Promise<boolean> {
  const statusMessage = STATUS_MESSAGES[newStatus];
  if (!statusMessage) return false;

  try {
    // Get work order to find both participants
    const { data: workOrder } = await supabase
      .from("work_orders")
      .select(`
        provider_id,
        boats!inner (owner_id)
      `)
      .eq("id", workOrderId)
      .single();

    if (!workOrder) return false;

    const boat = workOrder.boats as { owner_id: string };
    
    // Determine recipient (the other party)
    const recipientId = senderId === workOrder.provider_id 
      ? boat.owner_id 
      : workOrder.provider_id;

    if (!recipientId) return false;

    const { error } = await supabase
      .from("messages")
      .insert({
        work_order_id: workOrderId,
        sender_id: senderId,
        recipient_id: recipientId,
        content: statusMessage,
        message_type: "system",
      });

    if (error) {
      console.error("Error syncing status to chat:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error syncing status to chat:", error);
    return false;
  }
}

/**
 * Request browser notification permissions
 * Should be called on user interaction (e.g., when opening chat)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Show a browser notification for a new message
 * IMPORTANT: Never reveals personal contact info in notifications
 */
export function showMessageNotification(senderType: "owner" | "provider"): void {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  // Anonymized notification - never reveals personal info
  const title = "New message from Boat Genie";
  const options: NotificationOptions = {
    body: senderType === "provider" 
      ? "Your service provider sent a message" 
      : "The boat owner sent a message",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: "boat-genie-message", // Prevents duplicate notifications
  };

  try {
    new Notification(title, options);
  } catch (error) {
    console.error("Error showing notification:", error);
  }
}

/**
 * Subscribe to real-time message notifications for a user
 * Returns cleanup function
 */
export function subscribeToMessageNotifications(
  userId: string,
  onNewMessage?: (message: any) => void
): () => void {
  const channel = supabase
    .channel(`user-messages:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        // Only notify for user messages, not system messages
        if (payload.new.message_type !== "system") {
          // Determine sender type based on context
          // This would need work order context to be accurate
          showMessageNotification("provider");
        }
        onNewMessage?.(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
