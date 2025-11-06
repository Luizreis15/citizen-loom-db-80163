import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommentNotificationRequest {
  comment_id: number;
  task_id: string;
  user_id: string;
  comment_text: string;
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

    const { comment_id, task_id, user_id, comment_text }: CommentNotificationRequest = await req.json();

    console.log("Processing comment notification:", { comment_id, task_id, user_id });

    // Get comment author details
    const { data: author } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", user_id)
      .single();

    // Get task details with project and client
    const { data: task } = await supabaseAdmin
      .from("tasks_with_details")
      .select("*")
      .eq("id", task_id)
      .single();

    if (!task) {
      console.log("Task not found");
      return new Response(
        JSON.stringify({ success: false, message: "Task not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Determine recipients
    const recipients: Set<string> = new Set();

    // Check if author is a client
    const { data: authorRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", user_id);

    const isClientComment = authorRoles?.some((ur: any) => ur.roles?.name === "Cliente");

    if (isClientComment) {
      // Notify project manager (client owner)
      if (task.client_owner_id) {
        const { data: owner } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", task.client_owner_id)
          .single();
        
        if (owner?.email) {
          recipients.add(owner.email);
        }
      }

      // Notify assignee
      if (task.assignee_email && task.assignee_email !== author?.email) {
        recipients.add(task.assignee_email);
      }
    } else {
      // Team member comment - notify client if task is in review
      if (task.status === "Revisão" || task.status === "Aguardando aprovação") {
        // Get client user for this project
        const { data: clientProfile } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("client_id", task.project_id)
          .limit(1)
          .single();

        if (clientProfile?.email && clientProfile.email !== author?.email) {
          recipients.add(clientProfile.email);
        }
      }
    }

    // Get other commenters on this task
    const { data: otherComments } = await supabaseAdmin
      .from("task_comments")
      .select("user_id, profiles(email)")
      .eq("task_id", task_id)
      .neq("user_id", user_id);

    otherComments?.forEach((comment: any) => {
      if (comment.profiles?.email) {
        recipients.add(comment.profiles.email);
      }
    });

    console.log("Sending notifications to:", Array.from(recipients));

    // Send emails to all recipients
    for (const recipientEmail of recipients) {
      try {
        await resend.emails.send({
          from: "Gestão de Projetos <onboarding@resend.dev>",
          to: [recipientEmail],
          subject: `💬 Novo comentário em ${task.product_name}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">💬 Novo Comentário</h1>
                </div>
                
                <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    <strong>${author?.full_name || "Um usuário"}</strong> comentou na tarefa:
                  </p>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; border-radius: 4px; margin: 20px 0;">
                    <p style="margin: 0; font-style: italic; color: #555;">
                      "${comment_text.substring(0, 200)}${comment_text.length > 200 ? '...' : ''}"
                    </p>
                  </div>
                  
                  <div style="margin: 30px 0; padding: 20px; background-color: #fafafa; border-radius: 8px;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                      <strong>Tarefa:</strong> ${task.product_name}
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                      <strong>Projeto:</strong> ${task.project_name}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #666;">
                      <strong>Cliente:</strong> ${task.client_name}
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/client-portal/tasks/${task_id}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                      Ver Tarefa
                    </a>
                  </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                  <p>Este é um email automático, por favor não responda.</p>
                </div>
              </body>
            </html>
          `,
        });

        console.log("Email sent to:", recipientEmail);
      } catch (emailError) {
        console.error("Error sending email to", recipientEmail, emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, recipients: Array.from(recipients) }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-comment-notification function:", error);
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
