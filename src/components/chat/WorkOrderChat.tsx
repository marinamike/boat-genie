import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Loader2,
  X,
} from "lucide-react";
import { useWorkOrderChat, ChatMessage } from "@/hooks/useWorkOrderChat";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface WorkOrderChatProps {
  workOrderId: string;
  otherPartyName?: string;
  isProvider?: boolean;
}

export function WorkOrderChat({ workOrderId, otherPartyName, isProvider }: WorkOrderChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading,
    sending,
    participant,
    unreadCount,
    sendMessage,
    sendImage,
  } = useWorkOrderChat({ workOrderId, isOpen });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() && !previewImage) return;
    
    const success = await sendMessage(inputValue);
    if (success) {
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    await sendImage(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayTitle = isProvider 
    ? otherPartyName || "Boat Owner" 
    : otherPartyName || "Service Provider";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <MessageCircle className="w-4 h-4 mr-1" />
          Chat
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            {displayTitle}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Messages are private between you and the {isProvider ? "boat owner" : "service provider"}
          </p>
        </SheetHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Send a message to start the conversation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sending || (!inputValue.trim() && !previewImage)}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Load signed URL for images
  useEffect(() => {
    if (message.message_type === "image" && message.image_url) {
      setImageLoading(true);
      supabase.storage
        .from("chat-images")
        .createSignedUrl(message.image_url, 3600)
        .then(({ data }) => {
          if (data?.signedUrl) {
            setImageUrl(data.signedUrl);
          }
        })
        .finally(() => setImageLoading(false));
    }
  }, [message.image_url, message.message_type]);

  // System messages
  if (message.message_type === "system") {
    return (
      <div className="flex justify-center">
        <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1.5 rounded-full max-w-[80%] text-center">
          {message.content}
        </div>
      </div>
    );
  }

  const isOwn = message.is_own_message;
  const time = format(new Date(message.created_at), "h:mm a");

  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      {!isOwn && (
        <span className="text-xs text-muted-foreground mb-1 ml-1">
          {message.sender_display_name}
        </span>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        {/* Image message */}
        {message.message_type === "image" && (
          <div className="mb-2">
            {imageLoading ? (
              <div className="w-48 h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Shared image"
                className="max-w-full rounded-lg cursor-pointer"
                onClick={() => window.open(imageUrl, "_blank", "noopener,noreferrer")}
              />
            ) : (
              <div className="w-48 h-32 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
                Image unavailable
              </div>
            )}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
      
      {/* Time and read receipt */}
      <div className={cn("flex items-center gap-1 mt-0.5", isOwn ? "mr-1" : "ml-1")}>
        <span className="text-[10px] text-muted-foreground">{time}</span>
        {isOwn && (
          message.is_read ? (
            <CheckCheck className="w-3 h-3 text-primary" />
          ) : (
            <Check className="w-3 h-3 text-muted-foreground" />
          )
        )}
      </div>
    </div>
  );
}

export default WorkOrderChat;
