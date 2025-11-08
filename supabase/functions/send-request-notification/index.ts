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

interface RequestNotificationPayload {
  request_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request_id }: RequestNotificationPayload = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch request details
    const { data: request, error: requestError } = await supabase
      .from("client_requests")
      .select(`
        *,
        clients(name, email),
        products(name),
        profiles!client_requests_requested_by_fkey(full_name, email)
      `)
      .eq("id", request_id)
      .single();

    if (requestError) throw requestError;

    // Send email to admin
    const adminEmail = "leduardoreis@gmail.com"; // You can make this dynamic

    const emailResponse = await resend.emails.send({
      from: "Digital Hera <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `Nova Solicitação de ${request.clients.name}`,
      html: `
        <h1>Nova Solicitação Recebida</h1>
        <p><strong>Cliente:</strong> ${request.clients.name}</p>
        <p><strong>Serviço:</strong> ${request.products.name}</p>
        <p><strong>Título:</strong> ${request.title}</p>
        <p><strong>Prioridade:</strong> ${request.priority}</p>
        <p><strong>Descrição:</strong></p>
        <p>${request.description}</p>
        <p><a href="${Deno.env.get("APP_URL")}/admin/requests">Visualizar Solicitação</a></p>
      `,
    });

    console.log("Notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-request-notification:", error);
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
