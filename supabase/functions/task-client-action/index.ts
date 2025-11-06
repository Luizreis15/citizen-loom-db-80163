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
        // Get manager profile
        const { data: manager, error: managerError } = await supabaseClient
          .from("profiles")
          .select("email, full_name")
          .eq("id", client.user_id)
          .single();

        if (managerError || !manager) {
          console.error("Error fetching manager:", managerError);
        } else {
          const managerEmail = manager.email;
          const managerName = manager.full_name || "Gestor";
          const clientName = client.name || "Cliente";
          const projectName = (task.projects as any)?.name || "Projeto";
          const productName = (task.products as any)?.name || "Tarefa";

          if (managerEmail) {
            console.log(`Sending notification to manager: ${managerEmail}`);

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Solicitação de Ajustes</h2>
                <p>Olá ${managerName},</p>
                <p>O cliente <strong>${clientName}</strong> solicitou ajustes na seguinte tarefa:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Projeto:</strong> ${projectName}</p>
                  <p style="margin: 5px 0;"><strong>Produto:</strong> ${productName}</p>
                  ${task.variant_description ? `<p style="margin: 5px 0;"><strong>Descrição:</strong> ${task.variant_description}</p>` : ''}
                  ${comment ? `<p style="margin: 5px 0;"><strong>Comentário:</strong> ${comment}</p>` : ''}
                </div>
                <p>Por favor, revise a tarefa e faça os ajustes necessários.</p>
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                  Esta é uma notificação automática do sistema de gerenciamento de projetos.
                </p>
              </div>
            `;

            try {
              const emailResponse = await resend.emails.send({
                from: "Sistema de Projetos <onboarding@resend.dev>",
                to: [managerEmail],
                subject: `Ajustes Solicitados - ${productName}`,
                html: emailHtml,
              });

              console.log("Email sent successfully:", emailResponse);
            } catch (emailError) {
              console.error("Error sending email:", emailError);
              // Don't fail the entire operation if email fails
            }
          } else {
            console.warn("Manager email not found, skipping notification");
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
