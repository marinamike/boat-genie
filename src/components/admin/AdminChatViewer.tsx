import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Search,
  Check,
  CheckCheck,
  Loader2,
  User,
  Briefcase,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AdminChatViewerProps {
  workOrderId: string;
  workOrderTitle?: string;
}

interface FullMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  image_url: string | null;
  message_type: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_role: "owner" | "provider";
  recipient_name: string;
}

export function AdminChatViewer({ workOrderId, workOrderTitle }: AdminChatViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<FullMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMessages = useCallback(async () => {
    if (!workOrderId) return;

    setLoading(true);
    try {
      // Get work order details
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

      // Fetch all messages
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("work_order_id", workOrderId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get all participant IDs
      const participantIds = [
        ...new Set([
          ...(messagesData?.map(m => m.sender_id) || []),
          ...(messagesData?.map(m => m.recipient_id) || []),
        ]),
      ];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", participantIds);

      // Fetch business profiles for providers
      const { data: providerProfiles } = await supabase
        .from("businesses")
        .select("owner_id, business_name, contact_email")
        .in("owner_id", participantIds);

      // Map messages with full info for admin
      const mappedMessages: FullMessage[] = (messagesData || []).map(msg => {
        const senderProfile = profiles?.find(p => p.id === msg.sender_id);
        const senderProviderProfile = providerProfiles?.find(p => p.owner_id === msg.sender_id);
        const recipientProfile = profiles?.find(p => p.id === msg.recipient_id);
        const recipientProviderProfile = providerProfiles?.find(p => p.owner_id === msg.recipient_id);

        const isProviderSender = msg.sender_id === workOrder?.provider_id;
        const isProviderRecipient = msg.recipient_id === workOrder?.provider_id;

        return {
          id: msg.id,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          content: msg.content,
          image_url: msg.image_url,
          message_type: msg.message_type,
          is_read: msg.is_read,
          created_at: msg.created_at,
          sender_name: isProviderSender
            ? senderProviderProfile?.business_name || senderProfile?.full_name || "Provider"
            : senderProfile?.full_name || "Owner",
          sender_role: isProviderSender ? "provider" : "owner",
          recipient_name: isProviderRecipient
            ? recipientProviderProfile?.business_name || recipientProfile?.full_name || "Provider"
            : recipientProfile?.full_name || "Owner",
        };
      });

      setMessages(mappedMessages);
    } catch (error) {
      console.error("Error fetching admin messages:", error);
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, fetchMessages]);

  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      msg.content?.toLowerCase().includes(query) ||
      msg.sender_name.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle className="w-4 h-4 mr-1" />
          View Chat
          {messages.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {messages.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat Transcript
            {workOrderTitle && (
              <span className="text-muted-foreground font-normal text-sm">
                — {workOrderTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-[300px] max-h-[50vh] border rounded-lg p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? "No messages match your search" : "No messages in this conversation"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <AdminMessageRow key={message.id} message={message} />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center">
          Admin view — Full transcript for dispute resolution
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AdminMessageRowProps {
  message: FullMessage;
}

function AdminMessageRow({ message }: AdminMessageRowProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (message.message_type === "image" && message.image_url) {
      supabase.storage
        .from("chat-images")
        .createSignedUrl(message.image_url, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) {
            setImageUrl(data.signedUrl);
          }
        });
    }
  }, [message.image_url, message.message_type]);

  const isSystem = message.message_type === "system";
  const time = format(new Date(message.created_at), "MMM d, h:mm a");

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1.5 rounded-full max-w-[80%] text-center">
          <span className="font-medium">System:</span> {message.content}
        </div>
      </div>
    );
  }

  const isProvider = message.sender_role === "provider";

  return (
    <div className={cn("flex gap-3", isProvider ? "flex-row-reverse" : "")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isProvider ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
        )}
      >
        {isProvider ? <Briefcase className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Message content */}
      <div className={cn("flex-1", isProvider ? "text-right" : "")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{message.sender_name}</span>
          <Badge variant="outline" className="text-[10px] py-0">
            {isProvider ? "Provider" : "Owner"}
          </Badge>
          <span className="text-xs text-muted-foreground">{time}</span>
          {message.is_read ? (
            <CheckCheck className="w-3 h-3 text-primary" />
          ) : (
            <Check className="w-3 h-3 text-muted-foreground" />
          )}
        </div>

        {message.message_type === "image" && (
          <div className="mb-2">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Shared"
                className="max-w-[200px] rounded-lg cursor-pointer"
                onClick={() => window.open(imageUrl, "_blank", "noopener,noreferrer")}
              />
            ) : (
              <div className="inline-flex items-center gap-1 text-muted-foreground text-sm">
                <ImageIcon className="w-4 h-4" /> Image
              </div>
            )}
          </div>
        )}

        {message.content && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {message.content}
          </p>
        )}

        <div className="text-xs text-muted-foreground mt-1">
          → To: {message.recipient_name}
        </div>
      </div>
    </div>
  );
}

export default AdminChatViewer;
