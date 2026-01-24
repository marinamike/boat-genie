import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadEmailRequest {
  reservationId: string;
  marinaName: string;
  marinaEmail: string;
  vesselSpecs: {
    loa: number | null;
    beam: number | null;
    draft: number | null;
    power: string | null;
    vesselType: string;
    imageUrl: string | null;
  };
  dates: {
    arrival: string;
    departure: string | null;
  };
  stayType: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload: LeadEmailRequest = await req.json();

    const { 
      reservationId,
      marinaName, 
      marinaEmail, 
      vesselSpecs, 
      dates, 
      stayType 
    } = payload;

    // Format the arrival date
    const arrivalFormatted = new Date(dates.arrival).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dateRange = dates.departure 
      ? `${arrivalFormatted} to ${new Date(dates.departure).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
      : `Arriving ${arrivalFormatted}`;

    // Generate blurred boat image placeholder or use actual image with blur overlay
    const boatImageSection = vesselSpecs.imageUrl 
      ? `
        <div style="position: relative; margin: 20px 0; border-radius: 8px; overflow: hidden;">
          <img 
            src="${vesselSpecs.imageUrl}" 
            alt="Vessel" 
            style="width: 100%; max-width: 400px; height: 200px; object-fit: cover; filter: blur(8px);"
          />
          <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              🔒 Claim profile to view full details
            </span>
          </div>
        </div>
      `
      : "";

    // Create professional HTML email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Reservation Request</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ⚓ New Reservation Request
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                A boater is requesting a stay at ${marinaName}
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <!-- Vessel Specs Card -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 16px; font-weight: 600;">
                  📋 Vessel Specifications
                </h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px;">LOA:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">
                      ${vesselSpecs.loa ? `${vesselSpecs.loa}ft` : "Not specified"}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Beam:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e2e8f0;">
                      ${vesselSpecs.beam ? `${vesselSpecs.beam}ft` : "Not specified"}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Draft:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e2e8f0;">
                      ${vesselSpecs.draft ? `${vesselSpecs.draft}ft` : "Not specified"}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Power Needs:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e2e8f0;">
                      ${vesselSpecs.power || "Not specified"}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0;">Vessel Type:</td>
                    <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-top: 1px solid #e2e8f0;">
                      ${vesselSpecs.vesselType}
                    </td>
                  </tr>
                </table>
              </div>

              ${boatImageSection}

              <!-- Dates Card -->
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #fcd34d;">
                <h2 style="margin: 0 0 8px; color: #92400e; font-size: 16px; font-weight: 600;">
                  📅 Requested Dates
                </h2>
                <p style="margin: 0; color: #78350f; font-size: 14px;">
                  ${dateRange}
                </p>
                <p style="margin: 8px 0 0; color: #92400e; font-size: 13px;">
                  Stay Type: <strong>${stayType.charAt(0).toUpperCase() + stayType.slice(1)}</strong>
                </p>
              </div>

              <!-- Privacy Notice -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                  🔒 <strong>Privacy Protected:</strong> Boater identity is hidden for privacy. 
                  Claim your marina profile to view full details, message the owner, and manage reservations.
                </p>
              </div>

              <!-- CTA Button -->
              <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/register-marina" 
                 style="display: block; width: 100%; padding: 16px 24px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; text-align: center; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.3);">
                Claim Your Marina Profile →
              </a>
              
              <p style="margin: 16px 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
                Already have an account? <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/login" style="color: #0ea5e9;">Log in here</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                Powered by Boat Genie • Connecting Boaters with Marinas
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Subject line with vessel specs
    const subject = `New Reservation Request: ${vesselSpecs.loa || "?"}' ${vesselSpecs.vesselType} - ${arrivalFormatted}`;

    // Log the lead in marina_leads table
    const { error: leadError } = await supabase.from("marina_leads").insert({
      marina_name: marinaName,
      marina_email: marinaEmail,
      vessel_type: vesselSpecs.vesselType,
      vessel_length_ft: vesselSpecs.loa,
      vessel_beam_ft: vesselSpecs.beam,
      vessel_draft_ft: vesselSpecs.draft,
      power_requirements: vesselSpecs.power,
      stay_type: stayType,
      requested_dates: dateRange,
      lead_status: "pending",
    });

    if (leadError) {
      console.error("Error logging lead:", leadError);
    }

    // For now, log the email content (actual sending would use Resend or similar)
    console.log("Lead email would be sent to:", marinaEmail);
    console.log("Subject:", subject);
    console.log("Lead logged successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lead email prepared and logged",
        leadLogged: !leadError,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-marina-lead function:", error);
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
