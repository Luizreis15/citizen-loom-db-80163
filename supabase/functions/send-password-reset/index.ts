import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();
    console.log("Password reset requested for:", email);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Generate password reset link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get("APP_URL")}/reset-password`,
      }
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      throw linkError;
    }

    console.log("Reset link generated successfully");

    // Extract token from the generated link
    const resetUrl = new URL(linkData.properties.action_link);
    const token = resetUrl.searchParams.get('token');
    const resetLink = `${Deno.env.get("APP_URL")}/reset-password?token=${token}`;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Digital Hera <noreply@digitalhera.com.br>",
      to: [email],
      subject: "Recuperação de Senha - Digital Hera",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperação de Senha</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Recuperação de Senha</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                          Olá,
                        </p>
                        <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                          Recebemos uma solicitação para redefinir a senha da sua conta na <strong>Digital Hera</strong>.
                        </p>
                        <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                          Clique no botão abaixo para criar uma nova senha:
                        </p>
                        
                        <!-- Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td align="center" style="padding: 0 0 30px 0;">
                              <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                Redefinir Senha
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Alternative Link -->
                        <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Se o botão não funcionar, copie e cole este link no seu navegador:
                        </p>
                        <p style="margin: 0 0 30px 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px; color: #667eea; font-size: 13px; word-break: break-all;">
                          ${resetLink}
                        </p>
                        
                        <!-- Security Notice -->
                        <div style="padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-bottom: 30px;">
                          <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                            <strong>⚠️ Importante:</strong> Este link expira em <strong>1 hora</strong> por motivos de segurança.
                          </p>
                        </div>
                        
                        <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Se você não solicitou esta redefinição de senha, ignore este email. Sua senha permanecerá inalterada.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                        <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px;">
                          © ${new Date().getFullYear()} Digital Hera - Todos os direitos reservados
                        </p>
                        <p style="margin: 0; color: #999999; font-size: 13px;">
                          Este é um email automático, por favor não responda.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, message: "Email de recuperação enviado com sucesso" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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
