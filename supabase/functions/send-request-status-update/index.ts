import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdatePayload {
  request_id: string;
  status: string;
  review_notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request_id, status, review_notes }: StatusUpdatePayload = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch request and client details
    const { data: request, error: requestError } = await supabase
      .from("client_requests")
      .select(`
        *,
        clients(name, email),
        products(name)
      `)
      .eq("id", request_id)
      .single();

    if (requestError) throw requestError;

    const statusMessage = status === "Aprovado" 
      ? "foi aprovada e em breve será iniciada"
      : "foi recusada";

    // Send email to client
    const emailResponse = await resend.emails.send({
      from: "Digital Hera <onboarding@resend.dev>",
      to: [request.clients.email],
      subject: `Atualização da sua solicitação - ${request.title}`,
      html: `
        <h1>Atualização da Solicitação</h1>
        <p>Olá ${request.clients.name},</p>
        <p>Sua solicitação "${request.title}" ${statusMessage}.</p>
        ${review_notes ? `<p><strong>Observações:</strong> ${review_notes}</p>` : ""}
        <p><a href="${Deno.env.get("APP_URL")}/client-portal/requests/${request_id}">Ver Detalhes</a></p>
        <p>Atenciosamente,<br>Equipe Digital Hera</p>
      `,
    });

    console.log("Status update email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-request-status-update:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
