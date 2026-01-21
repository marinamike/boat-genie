-- Create messages table for in-app anonymized messaging
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    content TEXT,
    image_url TEXT,
    message_type TEXT NOT NULL DEFAULT 'user' CHECK (message_type IN ('user', 'system', 'image')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_messages_work_order ON public.messages(work_order_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- RLS Policies

-- Participants can view messages for their work orders
CREATE POLICY "Participants can view their messages"
ON public.messages
FOR SELECT
USING (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid()
    OR is_admin()
);

-- Participants can send messages
CREATE POLICY "Participants can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
    sender_id = auth.uid()
    AND (
        -- Verify sender is either the boat owner or assigned provider
        EXISTS (
            SELECT 1 FROM work_orders wo
            JOIN boats b ON b.id = wo.boat_id
            WHERE wo.id = work_order_id
            AND (b.owner_id = auth.uid() OR wo.provider_id = auth.uid())
        )
        OR is_admin()
    )
);

-- Recipients can mark messages as read
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (recipient_id = auth.uid() OR is_admin())
WITH CHECK (recipient_id = auth.uid() OR is_admin());

-- Only admins can delete messages
CREATE POLICY "Only admins can delete messages"
ON public.messages
FOR DELETE
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat images
CREATE POLICY "Users can upload chat images"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'chat-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view chat images they have access to"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'chat-images'
    AND (
        auth.uid()::text = (storage.foldername(name))[1]
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM messages m
            WHERE m.image_url LIKE '%' || name
            AND (m.sender_id = auth.uid() OR m.recipient_id = auth.uid())
        )
    )
);