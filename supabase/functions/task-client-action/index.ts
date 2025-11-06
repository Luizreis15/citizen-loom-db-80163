import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TaskActionRequest {
  task_id: string;
  action: "solicitar_ajustes" | "aprovar";
  comment?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Sem autorização");
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

    const { task_id, action, comment }: TaskActionRequest = await req.json();

    console.log(`Processing action: ${action} for task: ${task_id}`);

    // Get task details with project and client information
    const { data: task, error: taskError } = await supabaseClient
      .from("tasks")
      .select(`
        id,
        status,
        variant_description,
        products!inner(name),
        projects!inner(
          id,
          name,
          client_id
        )
      `)
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      console.error("Error fetching task:", taskError);
      throw new Error("Tarefa não encontrada");
    }

    console.log("Task found:", task);

    // Determine new status based on action
    const newStatus = action === "solicitar_ajustes" ? "Ajustes" : "Aprovado";

    // Update task status
    const { error: updateError } = await supabaseClient
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task_id);

    if (updateError) {
      console.error("Error updating task:", updateError);
      throw new Error("Erro ao atualizar tarefa");
    }

    console.log(`Task status updated to: ${newStatus}`);

    // Get user information for notifications
    const { data: { user } } = await supabaseClient.auth.getUser();

    // If requesting adjustments, send notification to project manager
    if (action === "solicitar_ajustes") {
      // Get client and manager information
      const { data: client, error: clientError } = await supabaseClient
        .from("clients")
        .select(`
          id,
          name,
          user_id
        `)
        .eq("id", (task.projects as any).client_id)
        .single();

      if (clientError || !client) {
        console.error("Error fetching client:", clientError);
      } else {
        // Get manager and assignee information
        const { data: manager } = await supabaseClient
          .from("profiles")
          .select("email, full_name")
          .eq("id", client.user_id)
          .single();

        // Get task assignee
        const { data: taskDetails } = await supabaseClient
          .from("tasks")
          .select("assignee_id")
          .eq("id", task_id)
          .single();

        let assigneeEmail = null;
        let assigneeName = null;
        
        if (taskDetails?.assignee_id) {
          const { data: assignee } = await supabaseClient
            .from("profiles")
            .select("email, full_name")
            .eq("id", taskDetails.assignee_id)
            .single();
          
          assigneeEmail = assignee?.email;
          assigneeName = assignee?.full_name;
        }

        // Get client profile who made the request
        const { data: clientProfile } = await supabaseClient
          .from("profiles")
          .select("full_name")
          .eq("id", user?.id)
          .single();

        const managerEmail = manager?.email;
        const managerName = manager?.full_name || "Gestor";
        const clientName = client.name || "Cliente";
        const clientUserName = clientProfile?.full_name || "Cliente";
        const projectName = (task.projects as any)?.name || "Projeto";
        const productName = (task.products as any)?.name || "Tarefa";

        // Send email to manager
        if (managerEmail) {
          try {
            await resend.emails.send({
              from: "Gestão de Projetos <onboarding@resend.dev>",
              to: [managerEmail],
              subject: `🔄 Ajustes solicitados em ${productName}`,
              html: `
                <!DOCTYPE html>
                <html>
                  <head><meta charset="UTF-8"></head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">🔄 Ajustes Solicitados</h1>
                    </div>
                    <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                      <p style="font-size: 16px;">Olá <strong>${managerName}</strong>,</p>
                      <p style="font-size: 16px;">O cliente <strong>${clientUserName}</strong> solicitou ajustes na tarefa:</p>
                      <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Tarefa:</strong> ${productName}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Projeto:</strong> ${projectName}</p>
                        <p style="margin: 0;"><strong>Cliente:</strong> ${clientName}</p>
                      </div>
                      ${comment ? `<div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;"><p style="margin: 0; font-weight: bold;">Comentário do cliente:</p><p style="margin: 10px 0 0 0; font-style: italic;">"${comment}"</p></div>` : ""}
                      <p style="font-size: 16px; margin-top: 30px;">Por favor, revise a tarefa e faça os ajustes necessários.</p>
                    </div>
                  </body>
                </html>
              `,
            });
            console.log("Manager notification sent");
          } catch (emailError) {
            console.error("Error sending email to manager:", emailError);
          }
        }

        // Send email to assignee if different from manager
        if (assigneeEmail && assigneeEmail !== managerEmail) {
          try {
            await resend.emails.send({
              from: "Gestão de Projetos <onboarding@resend.dev>",
              to: [assigneeEmail],
              subject: `🔄 Ajustes solicitados em ${productName}`,
              html: `
                <!DOCTYPE html>
                <html>
                  <head><meta charset="UTF-8"></head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">🔄 Ajustes Solicitados</h1>
                    </div>
                    <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                      <p style="font-size: 16px;">Olá <strong>${assigneeName}</strong>,</p>
                      <p style="font-size: 16px;">O cliente solicitou ajustes em uma tarefa atribuída a você:</p>
                      <div style="background-color: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Tarefa:</strong> ${productName}</p>
                        <p style="margin: 0;"><strong>Projeto:</strong> ${projectName}</p>
                      </div>
                      ${comment ? `<div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;"><p style="margin: 0; font-weight: bold;">Comentário do cliente:</p><p style="margin: 10px 0 0 0; font-style: italic;">"${comment}"</p></div>` : ""}
                    </div>
                  </body>
                </html>
              `,
            });
            console.log("Assignee notification sent");
          } catch (emailError) {
            console.error("Error sending email to assignee:", emailError);
          }
        }
      }
    } else if (action === "aprovar") {
      // Notify manager and assignee about approval
      const { data: client } = await supabaseClient
        .from("clients")
        .select("id, name, user_id")
        .eq("id", (task.projects as any).client_id)
        .single();

      if (client) {
        const { data: manager } = await supabaseClient
          .from("profiles")
          .select("email, full_name")
          .eq("id", client.user_id)
          .single();

        const { data: taskDetails } = await supabaseClient
          .from("tasks")
          .select("assignee_id")
          .eq("id", task_id)
          .single();

        const recipients = [];
        if (manager?.email) recipients.push(manager.email);

        if (taskDetails?.assignee_id) {
          const { data: assignee } = await supabaseClient
            .from("profiles")
            .select("email")
            .eq("id", taskDetails.assignee_id)
            .single();

          if (assignee?.email && assignee.email !== manager?.email) {
            recipients.push(assignee.email);
          }
        }

        if (recipients.length > 0) {
          try {
            await resend.emails.send({
              from: "Gestão de Projetos <onboarding@resend.dev>",
              to: recipients,
              subject: `✅ Tarefa aprovada: ${(task.products as any)?.name}`,
              html: `
                <!DOCTYPE html>
                <html>
                  <head><meta charset="UTF-8"></head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">✅ Tarefa Aprovada!</h1>
                    </div>
                    <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                      <p style="font-size: 16px;">Ótima notícia! 🎉</p>
                      <p style="font-size: 16px;">A seguinte tarefa foi aprovada pelo cliente:</p>
                      <div style="background-color: #d1fae5; padding: 20px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Tarefa:</strong> ${(task.products as any)?.name}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Projeto:</strong> ${(task.projects as any)?.name}</p>
                        <p style="margin: 0;"><strong>Cliente:</strong> ${client.name}</p>
                      </div>
                      <p style="font-size: 16px; margin-top: 30px;">Parabéns pelo excelente trabalho! 👏</p>
                    </div>
                  </body>
                </html>
              `,
            });
            console.log("Approval notification sent");
          } catch (emailError) {
            console.error("Error sending approval email:", emailError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === "solicitar_ajustes" 
          ? "Ajustes solicitados com sucesso" 
          : "Tarefa aprovada com sucesso",
        new_status: newStatus,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in task-client-action function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Erro ao processar ação"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
