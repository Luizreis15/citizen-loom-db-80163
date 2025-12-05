import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation schema
const welcomeClientSchema = z.object({
  client_id: z.string().uuid(),
  client_name: z.string().min(1),
  client_email: z.string().email(),
});

interface WelcomeClientRequest {
  client_id: string;
  client_name: string;
  client_email: string;
}

const DEFAULT_PASSWORD = "Mudar@123";

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
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

    // Parse and validate request
    const body: WelcomeClientRequest = await req.json();
    const validation = welcomeClientSchema.safeParse(body);

    if (!validation.success) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { client_id, client_name, client_email } = validation.data;

    console.log("Creating welcome email for client:", { client_id, client_name, client_email });

    // Check if client exists and get user_id
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("user_id")
      .eq("id", client_id)
      .single();

    if (clientError || !client) {
      console.error("Client not found:", clientError);
      throw new Error("Client not found");
    }

    let userId: string;

    if (client.user_id) {
      // User already exists, reset password
      console.log("User already exists:", client.user_id);
      userId = client.user_id;

      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: DEFAULT_PASSWORD }
      );

      if (resetError) {
        console.error("Error resetting password:", resetError);
      }

      // Update profile with flag to require password change
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ require_password_change: true })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }
    } else {
      // Create new user
      console.log("Creating new user for client");
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: client_email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: client_name,
        },
      });

      if (createError) {
        console.error("Error creating user:", createError);
        throw createError;
      }

      if (!newUser.user) {
        throw new Error("Failed to create user");
      }

      userId = newUser.user.id;
      console.log("New user created:", userId);

      // Update client with user_id
      const { error: updateClientError } = await supabaseAdmin
        .from("clients")
        .update({ user_id: userId })
        .eq("id", client_id);

      if (updateClientError) {
        console.error("Error updating client with user_id:", updateClientError);
      }

      // Create profile with require_password_change flag
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          full_name: client_name,
          email: client_email,
          client_id: client_id,
          require_password_change: true,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }

      // Assign Cliente role
      const { data: clientRole } = await supabaseAdmin
        .from("roles")
        .select("id")
        .eq("name", "Cliente")
        .single();

      if (clientRole) {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role_id: clientRole.id });

        if (roleError) {
          console.error("Error assigning Cliente role:", roleError);
        }
      }
    }

    // Create login URL (remove trailing slash to prevent double slashes)
    const appUrl = (Deno.env.get("APP_URL") || "https://digitalhera.com.br").replace(/\/$/, "");
    const loginUrl = `${appUrl}/login`;

    console.log("Sending welcome email to:", client_email);

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "Digital Hera <noreply@digitalhera.com.br>",
      to: [client_email],
      subject: "Bem-vindo à Digital Hera! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo à Digital Hera</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" cellpadding="0" cellspacing="0">
                    
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                          Bem-vindo à Digital Hera
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Olá, <strong style="color: #667eea;">${client_name}</strong>!
                        </p>
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          É com grande alegria que damos as boas-vindas! Sua conta já está ativa e pronta para uso.
                        </p>
                        <p style="margin: 0 0 10px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Use as credenciais abaixo para fazer login:
                        </p>
                        
                        <!-- Credenciais -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;" cellpadding="20" cellspacing="0">
                          <tr>
                            <td>
                              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                                <strong>Email:</strong>
                              </p>
                              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; font-family: monospace;">
                                ${client_email}
                              </p>
                              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                                <strong>Senha Temporária:</strong>
                              </p>
                              <p style="margin: 0; color: #667eea; font-size: 18px; font-weight: 600; font-family: monospace;">
                                ${DEFAULT_PASSWORD}
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 30px; color: #e74c3c; font-size: 16px; font-weight: 600; line-height: 1.6; background-color: #fee; padding: 15px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                          ⚠️ <strong>IMPORTANTE:</strong> No primeiro login, você será OBRIGADO a criar uma nova senha pessoal por motivos de segurança.
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="margin: 0 auto;" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                              <a href="${loginUrl}" 
                                 style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">
                                Fazer Login Agora
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px; color: #6c757d; font-size: 14px; line-height: 1.6;">
                          Se você tiver alguma dúvida ou precisar de ajuda, nossa equipe está sempre disponível para te auxiliar.
                        </p>
                        <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                          Atenciosamente,<br>
                          <strong style="color: #667eea;">Equipe Digital Hera</strong>
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

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Welcome email sent successfully:", emailResponse.data?.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Welcome email sent successfully",
        email_id: emailResponse.data?.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-client function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
