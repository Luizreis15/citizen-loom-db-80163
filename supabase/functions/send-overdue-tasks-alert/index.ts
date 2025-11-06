import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
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

    console.log("Starting overdue tasks alert job");

    // Get all overdue tasks
    const { data: overdueTasks, error } = await supabaseAdmin
      .from("tasks_with_details")
      .select("*")
      .lt("due_date", new Date().toISOString().split("T")[0])
      .not("status", "in", '("Aprovado","Publicado")');

    if (error) {
      console.error("Error fetching overdue tasks:", error);
      throw error;
    }

    if (!overdueTasks || overdueTasks.length === 0) {
      console.log("No overdue tasks found");
      return new Response(
        JSON.stringify({ success: true, message: "No overdue tasks" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${overdueTasks.length} overdue tasks`);

    // Group tasks by assignee
    const tasksByAssignee = new Map<string, any[]>();

    for (const task of overdueTasks) {
      if (task.assignee_id && task.assignee_email) {
        if (!tasksByAssignee.has(task.assignee_id)) {
          tasksByAssignee.set(task.assignee_id, []);
        }
        tasksByAssignee.get(task.assignee_id)?.push(task);
      }
    }

    console.log(`Sending alerts to ${tasksByAssignee.size} assignees`);

    // Send email to each assignee
    for (const [assigneeId, tasks] of tasksByAssignee) {
      const assignee = tasks[0]; // Get assignee info from first task
      
      const taskRows = tasks
        .map(task => {
          const dueDate = new Date(task.due_date);
          const today = new Date();
          const diffTime = today.getTime() - dueDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${task.project_name}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${task.product_name}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${new Date(task.due_date).toLocaleDateString('pt-BR')}</td>
              <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #dc2626; font-weight: bold;">${diffDays} dia${diffDays !== 1 ? 's' : ''}</td>
            </tr>
          `;
        })
        .join("");

      try {
        await resend.emails.send({
          from: "Digital Hera <noreply@digitalhera.com.br>",
          to: [assignee.assignee_email],
          subject: `⚠️ Você tem ${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''} atrasada${tasks.length !== 1 ? 's' : ''}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Tarefas Atrasadas</h1>
                </div>
                
                <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Olá <strong>${assignee.assignee_name}</strong>,
                  </p>
                  
                  <p style="font-size: 16px; margin-bottom: 30px;">
                    As seguintes tarefas estão atrasadas e precisam de sua atenção:
                  </p>
                  
                  <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                    <thead>
                      <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #667eea;">Projeto</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #667eea;">Tarefa</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #667eea;">Prazo</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #667eea;">Atraso</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${taskRows}
                    </tbody>
                  </table>
                  
                  <p style="font-size: 16px; margin: 30px 0;">
                    Por favor, revise e atualize o status dessas tarefas o quanto antes.
                  </p>
                  
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/dashboard" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                      Ver Minhas Tarefas
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

        console.log(`Alert sent to ${assignee.assignee_email}`);
      } catch (emailError) {
        console.error(`Error sending email to ${assignee.assignee_email}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        overdue_tasks: overdueTasks.length,
        assignees_notified: tasksByAssignee.size
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-overdue-tasks-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
