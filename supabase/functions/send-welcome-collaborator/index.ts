import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeCollaboratorRequest {
  full_name: string;
  email: string;
  role_ids: number[];
  client_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

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

    // Verify user is admin/owner
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: userRoles } = await supabaseClient
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user.id);

    const isAdmin = userRoles?.some((ur: any) => 
      ur.roles?.name === "Admin" || ur.roles?.name === "Owner"
    );

    if (!isAdmin) {
      throw new Error("Only admins can create collaborators");
    }

    const { full_name, email, role_ids, client_id }: WelcomeCollaboratorRequest = await req.json();

    console.log("Creating collaborator:", { full_name, email, role_ids, client_id });

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users.find(u => u.email === email);

    let userId: string;

    if (userExists) {
      console.log("User already exists:", userExists.id);
      userId = userExists.id;
    } else {
      // Create user in Supabase Auth
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name,
        },
      });

      if (createUserError) {
        console.error("Error creating user:", createUserError);
        throw createUserError;
      }

      userId = newUser.user.id;
      console.log("Created new user:", userId);

      // Update profile
      const profileUpdate: any = {};
      if (client_id) {
        profileUpdate.client_id = client_id;
      }

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", userId);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }

      // Assign roles
      for (const role_id of role_ids) {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role_id });

        if (roleError) {
          console.error("Error assigning role:", roleError);
        }
      }
    }

    // Get role names for email
    const { data: roles } = await supabaseAdmin
      .from("roles")
      .select("name")
      .in("id", role_ids);

    const roleNames = roles?.map(r => r.name).join(", ") || "Colaborador";

    // Generate magic link
    const { data: magicLinkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/dashboard`,
      },
    });

    if (linkError) {
      console.error("Error generating magic link:", linkError);
      throw linkError;
    }

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "Gestão de Projetos <onboarding@resend.dev>",
      to: [email],
      subject: "Bem-vindo(a) à Equipe!",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Bem-vindo(a) à Equipe!</h1>
            </div>
            
            <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Olá <strong>${full_name}</strong>,</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Você foi adicionado(a) à nossa equipe com as seguintes permissões:
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #667eea;">
                  ${roleNames}
                </p>
              </div>
              
              <p style="font-size: 16px; margin-bottom: 30px;">
                Para acessar o sistema pela primeira vez e criar sua senha, clique no botão abaixo:
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
                Bem-vindo(a) ao time! 🎉
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
      JSON.stringify({ success: true, user_id: userId }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-collaborator function:", error);
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
