import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateTaskPayload {
  request_id: string;
  project_id: string;
  product_id: number;
  assignee_id?: string;
  due_date: string;
  quantity: number;
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      request_id,
      project_id,
      product_id,
      assignee_id,
      due_date,
      quantity,
      description
    }: CreateTaskPayload = await req.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get product details for SLA and price
    const { data: clientService } = await supabase
      .from("client_services")
      .select("negotiated_price, sla_days")
      .eq("product_id", product_id)
      .single();

    // Get project to find client_id
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", project_id)
      .single();

    const slaData = clientService || { negotiated_price: 0, sla_days: 7 };

    // Create task
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        project_id,
        product_id,
        assignee_id: assignee_id || null,
        due_date,
        quantity,
        variant_description: description,
        frozen_price: slaData.negotiated_price,
        frozen_sla_days: slaData.sla_days,
        status: "Backlog"
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Get attachments from request
    const { data: attachments } = await supabase
      .from("request_attachments")
      .select("*")
      .eq("request_id", request_id);

    // Copy attachments to task
    if (attachments && attachments.length > 0) {
      const taskAttachments = attachments.map(att => ({
        task_id: task.id,
        file_name: att.file_name,
        file_url: att.file_url,
        file_size: att.file_size,
        file_type: att.file_type,
        upload_type: "Cliente",
        uploader_id: att.uploaded_by
      }));

      await supabase.from("task_attachments").insert(taskAttachments);
    }

    // Log activity
    if (project?.client_id) {
      await supabase.from("activity_log").insert({
        client_id: project.client_id,
        user_id: assignee_id,
        action_type: "request",
        description: `Tarefa criada a partir da solicitação`
      });
    }

    console.log("Task created successfully:", task);

    return new Response(JSON.stringify({ success: true, task }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in create-task:", error);
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
