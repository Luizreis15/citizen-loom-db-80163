import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { taskId, action } = await req.json();

    console.log('Collaborator action:', { taskId, action });

    // Buscar task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*, products(name), profiles(full_name, email)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Tarefa não encontrada');
    }

    let newStatus = task.status;

    switch (action) {
      case 'iniciar_trabalho':
        newStatus = 'Em Progresso';
        break;
      
      case 'enviar_para_revisao':
        newStatus = 'Em Revisão';
        break;
      
      case 'retomar_ajustes':
        newStatus = 'Em Progresso';
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
    console.error('Error in collaborator-task-action:', error);
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
