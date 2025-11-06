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

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users.find(u => u.email === client_email);

    let userId: string;

    if (userExists) {
      console.log("User already exists:", userExists.id);
      userId = userExists.id;
    } else {
      // Create user in Supabase Auth
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: client_email,
        email_confirm: true,
        user_metadata: {
          full_name: client_name,
        },
      });

      if (createUserError) {
        console.error("Error creating user:", createUserError);
        throw createUserError;
      }

      userId = newUser.user.id;
      console.log("Created new user:", userId);

      // Update profile with client_id
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ client_id })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }

      // Assign 'Cliente' role
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
          console.error("Error assigning role:", roleError);
        }
      }
    }

    // Generate magic link for password setup
    const { data: magicLinkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: client_email,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/client-portal/tasks`,
      },
    });

    if (linkError) {
      console.error("Error generating magic link:", linkError);
      throw linkError;
    }

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "Digital Hera <noreply@digitalhera.com.br>",
      to: [client_email],
      subject: "Bem-vindo(a)! Acesse seu Portal de Projetos",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo(a)!</h1>
            </div>
            
            <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>${client_name}</strong>,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                É um prazer tê-lo(a) conosco! Sua conta foi criada e você já pode acompanhar todos os projetos e entregas através do nosso portal.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 30px;">
                Para acessar pela primeira vez e criar sua senha, clique no botão abaixo:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${magicLinkData.properties.action_link}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Criar Minha Senha
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                <strong>Importante:</strong> Este link é válido por 24 horas.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666;">
                Qualquer dúvida, estamos à disposição!
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>Este é um email automático, por favor não responda.</p>
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
