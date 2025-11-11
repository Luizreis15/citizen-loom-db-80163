import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { taskId, action, notes } = await req.json();

    console.log('Admin action:', { taskId, action, notes });

    // Buscar task completa
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        products(name),
        profiles!tasks_assignee_id_fkey(full_name, email),
        client_requests(
          protocol_number,
          clients(name, email)
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Tarefa não encontrada');
    }

    let newStatus = task.status;
    let emailSubject = '';
    let emailHtml = '';

    switch (action) {
      case 'liberar_para_cliente':
        newStatus = 'Aguardando Cliente';
        
        // Email para cliente
        if (task.client_requests?.clients?.email) {
          emailSubject = `Trabalho Concluído - ${task.client_requests.protocol_number}`;
          emailHtml = `
            <h2>Olá ${task.client_requests.clients.name}!</h2>
            <p>Seu trabalho <strong>${task.products.name}</strong> foi concluído e está pronto para revisão.</p>
            <p><strong>Protocolo:</strong> ${task.client_requests.protocol_number}</p>
            <p>Acesse o portal do cliente para visualizar e aprovar o trabalho.</p>
            ${notes ? `<p><strong>Observações do revisor:</strong> ${notes}</p>` : ''}
            <p>Atenciosamente,<br>Digital Hera</p>
          `;
        }
        break;
      
      case 'solicitar_ajustes_colaborador':
        newStatus = 'Ajustes';
        
        // Email para colaborador
        if (task.profiles?.email) {
          emailSubject = `Ajustes Solicitados - ${task.client_requests?.protocol_number || task.products.name}`;
          emailHtml = `
            <h2>Olá ${task.profiles.full_name}!</h2>
            <p>Foram solicitados ajustes no trabalho <strong>${task.products.name}</strong>.</p>
            <p><strong>Protocolo:</strong> ${task.client_requests?.protocol_number || 'N/A'}</p>
            ${notes ? `<p><strong>Ajustes necessários:</strong></p><p>${notes}</p>` : ''}
            <p>Por favor, revise o trabalho e faça as correções necessárias.</p>
            <p>Atenciosamente,<br>Digital Hera</p>
          `;
        }
        break;
      
      default:
        throw new Error('Ação inválida');
    }

    // Atualizar status
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (updateError) throw updateError;

    // Enviar email se necessário
    if (emailSubject && emailHtml) {
      try {
        const recipientEmail = action === 'liberar_para_cliente' 
          ? task.client_requests?.clients?.email 
          : task.profiles?.email;

        if (recipientEmail) {
          await resend.emails.send({
            from: 'Digital Hera <noreply@digitalhera.com.br>',
            to: recipientEmail,
            subject: emailSubject,
            html: emailHtml,
          });
          console.log(`Email sent to ${recipientEmail}`);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Não falhar a operação se o email falhar
      }
    }

    console.log(`Task ${taskId} status updated to ${newStatus}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Ação executada com sucesso',
        newStatus 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in admin-task-action:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
