import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeClientRequest {
  client_id: string;
  client_name: string;
  client_email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { client_id, client_name, client_email }: WelcomeClientRequest = await req.json();

    console.log("Creating welcome email for client:", { client_id, client_name, client_email });

    // Check if there's an existing unused token for this client
    const { data: existingToken } = await supabaseAdmin
      .from("activation_tokens")
      .select("id")
      .eq("client_id", client_id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    // If exists, invalidate it
    if (existingToken) {
      console.log("Invalidating existing token:", existingToken.id);
      await supabaseAdmin
        .from("activation_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", existingToken.id);
    }

    // Generate new activation token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    console.log("Creating new activation token with expiration:", expiresAt);

    // Save token to database
    const { error: tokenError } = await supabaseAdmin
      .from("activation_tokens")
      .insert({
        client_id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error creating activation token:", tokenError);
      throw tokenError;
    }

    // Create activation link
    const appUrl = Deno.env.get("VITE_SUPABASE_URL")?.replace('.supabase.co', '') || 'https://ygfanvazmxpdwvrcjtgu.lovable.app';
    const activationLink = `${appUrl}/ativar-conta?token=${token}`;

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "Digital Hera <noreply@digitalhera.com.br>",
      to: [client_email],
      subject: "Bem-vindo(a)! 🎉 Ative sua conta na Digital Hera",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background: linear-gradient(135deg, #7C3AED 0%, #F59E0B 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">🎉 Bem-vindo(a)!</h1>
              <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0 0; font-size: 18px;">Digital Hera</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; margin-bottom: 20px; color: #1f2937;">Olá <strong style="color: #7C3AED;">${client_name}</strong>,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px; color: #4b5563;">
                É um prazer enorme tê-lo(a) conosco! Sua conta foi criada com sucesso e você já pode acompanhar todos os seus projetos e entregas através do nosso portal exclusivo.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 30px; color: #4b5563;">
                Para começar, basta criar sua senha de acesso:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${activationLink}" 
                   style="background: linear-gradient(135deg, #7C3AED 0%, #F59E0B 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; display: inline-block; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4); transition: transform 0.2s;">
                  Ativar Minha Conta
                </a>
              </div>
              
              <div style="background-color: #f9fafb; border-left: 4px solid #7C3AED; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 16px; color: #374151;">
                  <strong style="color: #7C3AED;">✨ O que você terá acesso:</strong>
                </p>
                <ul style="margin: 12px 0 0 0; padding-left: 20px; color: #4b5563; font-size: 15px; line-height: 1.8;">
                  <li>Acompanhamento de todos os seus projetos em tempo real</li>
                  <li>Cronograma detalhado com prazos e entregas</li>
                  <li>Comunicação direta com nossa equipe</li>
                  <li>Histórico completo de todos os trabalhos realizados</li>
                </ul>
              </div>
              
              <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #92400e; text-align: center;">
                  <strong>⚠️ Importante:</strong> Este link é válido por <strong>7 dias</strong>. Após esse período, será necessário solicitar um novo link de ativação.
                </p>
              </div>
              
              <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 15px; color: #6b7280; text-align: center; margin: 0;">
                Qualquer dúvida, estamos à disposição!<br>
                <strong style="color: #7C3AED;">Equipe Digital Hera</strong>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding: 20px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este é um email automático, por favor não responda.
              </p>
              <p style="color: #d1d5db; font-size: 11px; margin: 10px 0 0 0;">
                Digital Hera © 2025 - Todos os direitos reservados
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-client function:", error);
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
