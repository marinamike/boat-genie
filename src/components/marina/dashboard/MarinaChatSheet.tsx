import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ship, Wrench, MessageSquare, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkOrderChat } from "@/hooks/useWorkOrderChat";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  work_order_id: string;
  type: "owner" | "provider";
  name: string;
  boat_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

interface MarinaChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWorkOrderId?: string;
}

export function MarinaChatSheet({ open, onOpenChange, initialWorkOrderId }: MarinaChatSheetProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");

  const { messages, sending, sendMessage, loading: chatLoading } = useWorkOrderChat({
    workOrderId: selectedConversation?.work_order_id || "",
    isOpen: !!selectedConversation,
  });

  useEffect(() => {
    if (!open) return;

    const fetchConversations = async () => {
      // Fetch work orders that have messages involving this marina
      const { data: workOrders } = await supabase
        .from("work_orders")
        .select(`
          id,
          status,
          service_type,
          provider_id,
          boats:boat_id (name, owner_id)
        `)
        .in("status", ["assigned", "in_progress", "pending"]);

      if (!workOrders || workOrders.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get provider business names
      const providerIds = [...new Set(workOrders.map((wo: any) => wo.provider_id).filter(Boolean))];
      let providerMap = new Map<string, string>();
      if (providerIds.length > 0) {
        const { data: businesses } = await supabase
          .from("businesses")
          .select("owner_id, business_name")
          .in("owner_id", providerIds);
        providerMap = new Map((businesses || []).map(b => [b.owner_id, b.business_name || "Provider"]));
      }

      // Get message counts for each work order
      const workOrderIds = workOrders.map(wo => wo.id);
      const { data: messageCounts } = await supabase
        .from("messages")
        .select("work_order_id, content, created_at, is_read")
        .in("work_order_id", workOrderIds)
        .order("created_at", { ascending: false });

      const conversationMap = new Map<string, Conversation>();

      workOrders.forEach((wo: any) => {
        const woMessages = messageCounts?.filter(m => m.work_order_id === wo.id) || [];
        const latestMessage = woMessages[0];
        const unreadCount = woMessages.filter(m => !m.is_read).length;

        // Create owner conversation
        if (wo.boats?.owner_id) {
          conversationMap.set(`owner-${wo.id}`, {
            id: `owner-${wo.id}`,
            work_order_id: wo.id,
            type: "owner",
            name: wo.boats.name || "Boat Owner",
            boat_name: wo.boats.name,
            last_message: latestMessage?.content?.substring(0, 50),
            last_message_at: latestMessage?.created_at,
            unread_count: unreadCount,
          });
        }

        // Create provider conversation
        if (wo.provider_id) {
          conversationMap.set(`provider-${wo.id}`, {
            id: `provider-${wo.id}`,
            work_order_id: wo.id,
            type: "provider",
            name: providerMap.get(wo.provider_id) || "Provider",
            boat_name: wo.boats?.name,
            last_message: latestMessage?.content?.substring(0, 50),
            last_message_at: latestMessage?.created_at,
            unread_count: unreadCount,
          });
        }
      });

      const sorted = Array.from(conversationMap.values()).sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      setConversations(sorted);
      setLoading(false);

      // Auto-select if initialWorkOrderId provided
      if (initialWorkOrderId) {
        const found = sorted.find(c => c.work_order_id === initialWorkOrderId);
        if (found) setSelectedConversation(found);
      }
    };

    fetchConversations();
  }, [open, initialWorkOrderId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    await sendMessage(messageInput);
    setMessageInput("");
  };

  const renderConversationList = (type: "owner" | "provider") => {
    const filtered = conversations.filter(c => c.type === type);

    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No {type === "owner" ? "owner" : "provider"} conversations
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filtered.map((conv) => (
          <div
            key={conv.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedConversation?.id === conv.id
                ? "bg-primary/10 border-primary"
                : "hover:bg-accent/50"
            }`}
            onClick={() => setSelectedConversation(conv)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {type === "owner" ? (
                    <Ship className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm truncate">{conv.name}</span>
                  {conv.unread_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {conv.unread_count}
                    </Badge>
                  )}
                </div>
                {conv.last_message && (
                  <p className="text-xs text-muted-foreground truncate mt-1 ml-6">
                    {conv.last_message}
                  </p>
                )}
              </div>
              {conv.last_message_at && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Messages
          </SheetTitle>
        </SheetHeader>

        {selectedConversation ? (
          <div className="flex flex-col h-[calc(100vh-80px)]">
            {/* Chat Header */}
            <div className="p-3 border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
                    ← Back
                  </Button>
                  <div>
                    <p className="font-medium text-sm">{selectedConversation.name}</p>
                    {selectedConversation.boat_name && (
                      <p className="text-xs text-muted-foreground">{selectedConversation.boat_name}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {selectedConversation.type}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {chatLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_own_message ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          msg.is_own_message
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {!msg.is_own_message && (
                          <p className="text-xs font-medium mb-1">{msg.sender_display_name}</p>
                        )}
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt="Attachment"
                            className="rounded-md mb-2 max-w-full"
                          />
                        )}
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                        <p className="text-xs opacity-70 mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} disabled={sending || !messageInput.trim()}>
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Tabs defaultValue="owners">
                <TabsList className="w-full">
                  <TabsTrigger value="owners" className="flex-1">
                    <Ship className="w-4 h-4 mr-1" />
                    Owners
                  </TabsTrigger>
                  <TabsTrigger value="providers" className="flex-1">
                    <Wrench className="w-4 h-4 mr-1" />
                    Providers
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="owners" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    {renderConversationList("owner")}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="providers" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    {renderConversationList("provider")}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
