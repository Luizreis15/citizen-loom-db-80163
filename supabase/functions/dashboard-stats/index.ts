import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DashboardStats {
  tasksAtRisk: number;
  overdueTasks: number;
  monthlyRevenue: number;
  productRevenue: Array<{ name: string; value: number }>;
  recentApprovedTasks: Array<{
    id: string;
    client_name: string;
    project_name: string;
    product_name: string;
    frozen_price: number;
    created_at: string;
  }>;
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

    console.log("Fetching dashboard stats...");

    // Get current date boundaries
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch all tasks with details
    const { data: allTasks, error: tasksError } = await supabase
      .from("tasks_with_details")
      .select("*");

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      throw tasksError;
    }

    console.log(`Fetched ${allTasks?.length || 0} tasks`);

    // Calculate tasks at risk (due within 3 days, not approved/published)
    const tasksAtRisk = allTasks?.filter((task) => {
      const dueDate = new Date(task.due_date);
      return (
        dueDate >= now &&
        dueDate <= threeDaysFromNow &&
        task.status !== "Aprovado" &&
        task.status !== "Publicado"
      );
    }).length || 0;

    console.log(`Tasks at risk: ${tasksAtRisk}`);

    // Calculate overdue tasks (past due date, not approved/published)
    const overdueTasks = allTasks?.filter((task) => {
      const dueDate = new Date(task.due_date);
      return (
        dueDate < now &&
        task.status !== "Aprovado" &&
        task.status !== "Publicado"
      );
    }).length || 0;

    console.log(`Overdue tasks: ${overdueTasks}`);

    // Calculate monthly revenue (tasks created this month)
    const monthlyTasks = allTasks?.filter((task) => {
      const createdDate = new Date(task.created_at);
      return createdDate >= startOfMonth && createdDate <= endOfMonth;
    }) || [];

    const monthlyRevenue = monthlyTasks.reduce(
      (acc, task) => acc + Number(task.frozen_price || 0),
      0
    );

    console.log(`Monthly revenue: ${monthlyRevenue} (from ${monthlyTasks.length} tasks)`);

    // Calculate revenue by product for current month
    const revenueByProduct: Record<string, number> = {};
    monthlyTasks.forEach((task) => {
      const productName = task.product_name || "Sem Produto";
      revenueByProduct[productName] =
        (revenueByProduct[productName] || 0) + Number(task.frozen_price || 0);
    });

    const productRevenue = Object.entries(revenueByProduct)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    console.log(`Product revenue calculated for ${productRevenue.length} products`);

    // Get 5 most recent approved tasks
    const recentApprovedTasks = (allTasks || [])
      .filter((task) => task.status === "Aprovado")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((task) => ({
        id: task.id,
        client_name: task.client_name || "N/A",
        project_name: task.project_name || "N/A",
        product_name: task.product_name || "N/A",
        frozen_price: Number(task.frozen_price || 0),
        created_at: task.created_at,
      }));

    console.log(`Found ${recentApprovedTasks.length} recent approved tasks`);

    const stats: DashboardStats = {
      tasksAtRisk,
      overdueTasks,
      monthlyRevenue,
      productRevenue,
      recentApprovedTasks,
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in dashboard-stats function:", error);
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
