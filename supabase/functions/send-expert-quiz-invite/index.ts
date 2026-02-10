import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  expert_name: string;
  expert_email: string;
  quiz_link: string;
  project_name?: string;
  expires_in_days: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { expert_name, expert_email, quiz_link, project_name, expires_in_days }: InviteRequest = await req.json();

    if (!expert_name || !expert_email || !quiz_link) {
      throw new Error("Campos obrigatórios: expert_name, expert_email, quiz_link");
    }

    const projectLine = project_name
      ? `<p style="color: #a0a0a0; font-size: 14px; margin: 0 0 24px 0;">Projeto: <strong style="color: #c9a84c;">${project_name}</strong></p>`
      : "";

    const expiresText = expires_in_days
      ? `<p style="color: #888; font-size: 13px; margin: 24px 0 0 0;">⏳ Este link é válido por <strong>${expires_in_days} dias</strong>.</p>`
      : "";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0f0f1a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f1a; padding: 40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
        <!-- Header -->
        <tr><td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%); padding: 40px 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: #c9a84c; font-size: 28px; margin: 0 0 8px 0; font-weight: 700; letter-spacing: 1px;">Digital Hera</h1>
          <p style="color: #a0a0a0; font-size: 14px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">Diagnóstico Digital</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="background-color: #1a1a2e; padding: 40px;">
          <h2 style="color: #f5f0e8; font-size: 22px; margin: 0 0 20px 0;">Olá, ${expert_name}! 👋</h2>
          <p style="color: #c8c8d0; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Você foi convidado(a) a participar do nosso <strong style="color: #c9a84c;">Diagnóstico de Presença Digital</strong>.
          </p>
          <p style="color: #c8c8d0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Este questionário nos ajudará a entender melhor o cenário atual do seu negócio e traçar as melhores estratégias para fortalecer sua presença online.
          </p>
          ${projectLine}
          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding: 8px 0 8px 0;">
              <a href="${quiz_link}" style="display: inline-block; background: linear-gradient(135deg, #c9a84c 0%, #d4b863 50%, #c9a84c 100%); color: #1a1a2e; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                Iniciar Questionário
              </a>
            </td></tr>
          </table>
          ${expiresText}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background-color: #141425; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center; border-top: 1px solid #2a2a3e;">
          <p style="color: #666; font-size: 12px; margin: 0 0 8px 0;">Este email foi enviado pela Digital Hera.</p>
          <p style="color: #555; font-size: 11px; margin: 0;">Se você não esperava este email, por favor desconsidere.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from: "Digital Hera <noreply@digitalhera.com.br>",
      to: [expert_email],
      subject: project_name
        ? `${expert_name}, seu Diagnóstico Digital aguarda — ${project_name}`
        : `${expert_name}, seu Diagnóstico Digital aguarda`,
      html: emailHtml,
    });

    console.log("Expert quiz invite sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending expert quiz invite:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
