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
const welcomeCollaboratorSchema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  role_ids: z.array(z.number()).min(1),
  client_id: z.string().uuid().optional(),
});

interface WelcomeCollaboratorRequest {
  full_name: string;
  email: string;
  role_ids: number[];
  client_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

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

    // Extract and verify JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("Unauthorized");
    }

    console.log("Authenticated user:", user.id, user.email);

    // Check if user is admin/owner
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user.id);

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      throw new Error("Error verifying permissions");
    }

    const isAdmin = userRoles?.some((ur: any) => 
      ur.roles?.name === "Admin" || ur.roles?.name === "Owner"
    );

    if (!isAdmin) {
      console.error("User is not admin:", user.email);
      throw new Error("Only admins can create collaborators");
    }

    // Parse and validate request
    const body: WelcomeCollaboratorRequest = await req.json();
    const validation = welcomeCollaboratorSchema.safeParse(body);

    if (!validation.success) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: "Invalid request data", details: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { full_name, email, role_ids, client_id } = validation.data;

    console.log("Creating collaborator:", { full_name, email, role_ids, client_id });

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log("User already exists:", existingUser.id);
      userId = existingUser.id;

      // Update profile with client_id if provided
      if (client_id) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ client_id })
          .eq("id", userId);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name,
        },
      });

      if (createError || !newUser?.user) {
        console.error("Error creating user:", createError);
        throw new Error("Failed to create user");
      }

      console.log("User created:", newUser.user.id);
      userId = newUser.user.id;

      // Update profile with client_id if provided
      if (client_id) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .update({ client_id })
          .eq("id", userId);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }
    }

    // Assign roles to user
    for (const roleId of role_ids) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role_id: roleId,
          },
          {
            onConflict: 'user_id,role_id',
            ignoreDuplicates: false
          }
        );

      if (roleError) {
        console.error("Error assigning role:", roleError);
        throw new Error(`Failed to assign role ${roleId}`);
      }
    }

    // Get role names for email
    const { data: roles } = await supabaseAdmin
      .from("roles")
      .select("name")
      .in("id", role_ids);

    const roleNames = roles?.map(r => r.name).join(", ") || "Colaborador";

    // Invalidate old unused activation tokens for this user
    console.log("Invalidating old activation tokens for user:", userId);
    const { error: invalidateError } = await supabaseAdmin
      .from("activation_tokens")
      .update({ 
        used_at: new Date().toISOString() // Mark as used to invalidate
      })
      .eq("user_id", userId)
      .eq("user_type", "collaborator")
      .is("used_at", null);

    if (invalidateError) {
      console.error("Error invalidating old tokens:", invalidateError);
      // Don't throw - continue with new token generation
    } else {
      console.log("Old tokens invalidated successfully");
    }

    // Generate new activation token
    const activationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    console.log("Generating new activation token for user:", userId);

    // Insert activation token
    const { error: tokenError } = await supabaseAdmin
      .from("activation_tokens")
      .insert({
        user_id: userId,
        client_id: client_id || null,
        token: activationToken,
        expires_at: expiresAt.toISOString(),
        user_type: 'collaborator',
      });

    if (tokenError) {
      console.error("Error creating activation token:", tokenError);
      throw new Error("Failed to create activation token");
    }

    console.log("New activation token created successfully");

    // Generate activation link
    const appUrl = Deno.env.get("APP_URL") || "https://citizen-loom-db-80163.lovable.app";
    const activationLink = `${appUrl}/ativar-colaborador?token=${activationToken}`;

    console.log("Activation link generated:", activationLink);

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "Digital Hera <noreply@digitalhera.com.br>",
      to: [email],
      subject: "Bem-vindo à Equipe Digital Hera! 🎉",
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
                          Olá, <strong style="color: #667eea;">${full_name}</strong>!
                        </p>
                        
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Você foi convidado(a) para fazer parte da equipe Digital Hera como <strong>${roleNames}</strong>! 🎉
                        </p>
                        
                        <p style="margin: 0 0 30px; color: #666666; font-size: 16px; line-height: 1.6;">
                          Para começar, você precisa ativar sua conta e criar uma senha de acesso:
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse;" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 0 0 30px;">
                              <a href="${activationLink}" 
                                 style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                                Ativar Minha Conta
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 16px; border-radius: 4px; margin-bottom: 30px;">
                          <p style="margin: 0 0 10px; color: #333333; font-size: 14px; font-weight: 600;">
                            ⚠️ Importante:
                          </p>
                          <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.5;">
                            Este link é válido por <strong>7 dias</strong>. Após esse período, será necessário solicitar um novo convite.
                          </p>
                        </div>
                        
                        <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.6;">
                          Se o botão não funcionar, copie e cole este link no seu navegador:
                        </p>
                        
                        <p style="margin: 0 0 30px; padding: 12px; background-color: #f8f9fa; border-radius: 4px; word-break: break-all; font-size: 12px; color: #667eea;">
                          ${activationLink}
                        </p>
                        
                        <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Se você não solicitou este convite ou acredita que recebeu este email por engano, por favor ignore esta mensagem.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px; border-top: 1px solid #e9ecef;">
                        <p style="margin: 0 0 10px; color: #999999; font-size: 14px;">
                          Atenciosamente,<br>
                          <strong style="color: #667eea;">Equipe Digital Hera</strong>
                        </p>
                        <p style="margin: 0; color: #999999; font-size: 12px;">
                          © ${new Date().getFullYear()} Digital Hera. Todos os direitos reservados.
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

    console.log("Email sent:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        message: "Collaborator created and welcome email sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in send-welcome-collaborator:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
