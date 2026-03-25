import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing approval token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the work order by approval_token
    const { data: workOrder, error: findError } = await supabase
      .from("work_orders")
      .select("id, status, approved_at, title")
      .eq("approval_token", token)
      .single();

    if (findError || !workOrder) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired approval link." }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Already approved
    if (workOrder.approved_at) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          already_approved: true,
          message: "This work order has already been approved." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Must be in pending_approval status
    if (workOrder.status !== "pending_approval") {
      return new Response(
        JSON.stringify({ error: `Work order is in "${workOrder.status}" status and cannot be approved.` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Approve: update status and timestamp
    const { error: updateError } = await supabase
      .from("work_orders")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", workOrder.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: "Work order approved successfully." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error approving work order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
