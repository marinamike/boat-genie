import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  providerName: string;
  ownerName: string;
  ownerEmail: string;
  boatName: string;
  serviceName: string;
  basePrice: number;
  materialsDeposit: number;
  totalPrice: number;
  scheduledDate?: string;
  notes?: string;
  approvalToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const {
      providerName,
      ownerName,
      ownerEmail,
      boatName,
      serviceName,
      basePrice,
      materialsDeposit,
      totalPrice,
      scheduledDate,
      notes,
      approvalToken,
    }: InviteRequest = await req.json();

    const approveUrl = `https://id-preview--4e7db0f9-eee4-4245-a395-10a1bc475f57.lovable.app/approve/${approvalToken}`;

    const fmt = (n: number) =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

    const scheduleLine = scheduledDate
      ? `<p style="margin: 5px 0;"><strong>Scheduled Date:</strong> ${new Date(scheduledDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>`
      : "";

    const notesLine = notes
      ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${notes}</p>`
      : "";

    const materialsLine = materialsDeposit > 0
      ? `<p style="margin: 5px 0;"><strong>Materials Deposit:</strong> ${fmt(materialsDeposit)}</p>`
      : "";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚓ Boat Genie</h1>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">Hi ${ownerName},</h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              <strong>${providerName}</strong> has created a work order for your boat <strong>${boatName}</strong>. Please review the details below and approve to get started.
            </p>
            
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0ea5e9; margin-top: 0; margin-bottom: 12px;">Quote Details</h3>
              <p style="margin: 5px 0;"><strong>Service:</strong> ${serviceName}</p>
              <p style="margin: 5px 0;"><strong>Base Price:</strong> ${fmt(basePrice)}</p>
              ${materialsLine}
              ${scheduleLine}
              ${notesLine}
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 12px 0;" />
              <p style="margin: 5px 0; font-size: 18px;"><strong>Total: ${fmt(totalPrice)}</strong></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${approveUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a, #15803d); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px;">
                Approve Work Order
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px;">
              If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Boat Genie. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured. Simulating email send...");
      console.log("Email would be sent to:", ownerEmail);
      console.log("Approve URL:", approveUrl);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email simulated (Resend not configured)",
          debug: { ownerEmail, approveUrl }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Boat Genie <onboarding@resend.dev>",
        to: [ownerEmail],
        subject: `${providerName} — Work Order for ${boatName}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error(`Resend API error: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
