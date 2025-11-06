import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExportRequest {
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { clientId, startDate, endDate }: ExportRequest = await req.json();

    console.log("Export request:", { clientId, startDate, endDate });

    // Build query with filters
    let query = supabase
      .from("tasks_with_details")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientId) {
      // Get client name to filter
      const { data: clientData } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();
      
      if (clientData) {
        query = query.eq("client_name", clientData.name);
      }
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }

    console.log(`Found ${tasks?.length || 0} tasks`);

    // Generate CSV
    const csvHeaders = [
      "Data de Criação",
      "Cliente",
      "Projeto",
      "Tarefa (Produto)",
      "Preço Congelado"
    ];

    const csvRows = tasks?.map(task => {
      const createdAt = new Date(task.created_at).toLocaleDateString("pt-BR");
      const client = task.client_name || "";
      const project = task.project_name || "";
      const product = task.product_name || "";
      const price = task.frozen_price ? parseFloat(task.frozen_price).toFixed(2) : "0.00";

      return [
        createdAt,
        `"${client}"`,
        `"${project}"`,
        `"${product}"`,
        price
      ].join(",");
    }) || [];

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows
    ].join("\n");

    // Add BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return new Response(csvWithBom, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error in export-financial-csv function:", error);
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
