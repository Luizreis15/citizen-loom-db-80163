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

const DEFAULT_PASSWORD = "Mudar@123";

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

      // Reset password to default
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
        .update({ 
          client_id: client_id || null,
          require_password_change: true,
          full_name
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }
    } else {
      // Create new user with default password
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true, // Auto-confirm email
      });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        throw new Error("Failed to create user");
      }

      userId = newUser.user.id;
      console.log("New user created:", userId);

      // Create profile with flag to require password change
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          full_name,
          email,
          client_id: client_id || null,
          require_password_change: true,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        throw new Error("Failed to create profile");
      }
    }

    // Assign roles
    console.log("Assigning roles:", role_ids);
    
    // First, remove any existing roles for this user
    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting existing roles:", deleteError);
    }

    // Then assign new roles
    const roleAssignments = role_ids.map(role_id => ({
      user_id: userId,
      role_id,
    }));

    const { error: rolesInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert(roleAssignments);

    if (rolesInsertError) {
      console.error("Error assigning roles:", rolesInsertError);
      throw new Error("Failed to assign roles");
    }

    console.log("Roles assigned successfully");

    // Send welcome email with credentials
    const appUrl = (Deno.env.get("APP_URL") || "https://digitalhera.com.br").replace(/\/$/, '');
    const loginUrl = `${appUrl}/login`;
    
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
                          É com grande alegria que damos as boas-vindas à equipe da Digital Hera! Estamos animados por ter você conosco.
                        </p>
                        <p style="margin: 0 0 10px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Sua conta já está ativa! Use as credenciais abaixo para fazer login:
                        </p>
                        
                        <!-- Credenciais -->
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;" cellpadding="20" cellspacing="0">
                          <tr>
                            <td>
                              <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                                <strong>Email:</strong>
                              </p>
                              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; font-family: monospace;">
                                ${email}
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
                        
                        <p style="margin: 30px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                          Se você tiver alguma dúvida ou precisar de ajuda, não hesite em entrar em contato conosco.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0 0 10px; color: #999999; font-size: 14px;">
                          Digital Hera - Marketing Digital
                        </p>
                        <p style="margin: 0; color: #cccccc; font-size: 12px;">
                          Este é um e-mail automático, por favor não responda.
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
        message: "Collaborator created and welcome email sent",
        userId 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-collaborator:", error);
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
