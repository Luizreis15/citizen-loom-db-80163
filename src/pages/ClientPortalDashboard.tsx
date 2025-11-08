import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MetricCard } from "@/components/MetricCard";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, DollarSign, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientPortalDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    pendingRequests: 0,
    activeTasks: 0,
    pendingPayments: 0,
    totalPaid: 0
  });
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get client_id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.client_id) return;

      // Fetch requests count
      const { count: requestsCount } = await supabase
        .from("client_requests")
        .select("*", { count: "exact", head: true })
        .eq("client_id", profile.client_id)
        .in("status", ["Pendente", "Em análise"]);

      // Fetch active tasks count
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("client_id", profile.client_id);

      const projectIds = projects?.map(p => p.id) || [];

      const { count: tasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("project_id", projectIds)
        .neq("status", "Aprovado");

      // Fetch financial data
      const { data: transactions } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("client_id", profile.client_id);

      const pendingPayments = transactions?.filter(t => t.status === "Pendente").length || 0;
      const totalPaid = transactions
        ?.filter(t => t.status === "Pago")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from("activity_log")
        .select("*")
        .eq("client_id", profile.client_id)
        .order("created_at", { ascending: false })
        .limit(10);

      setMetrics({
        pendingRequests: requestsCount || 0,
        activeTasks: tasksCount || 0,
        pendingPayments,
        totalPaid
      });

      setActivities(activityData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => navigate("/client-portal/request")}>
          <FileText className="mr-2 h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Pedidos Pendentes"
          value={metrics.pendingRequests}
          icon={Inbox}
          description="Aguardando análise"
        />
        <MetricCard
          title="Tarefas Ativas"
          value={metrics.activeTasks}
          icon={Clock}
          description="Em andamento"
        />
        <MetricCard
          title="Pagamentos Pendentes"
          value={metrics.pendingPayments}
          icon={DollarSign}
          description="A vencer"
        />
        <MetricCard
          title="Total Pago"
          value={`R$ ${metrics.totalPaid.toFixed(2)}`}
          icon={DollarSign}
          description="Este mês"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={activities} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/client-portal/request")}
            >
              <FileText className="mr-2 h-4 w-4" />
              Criar Nova Solicitação
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/client-portal/requests")}
            >
              <Inbox className="mr-2 h-4 w-4" />
              Ver Meus Pedidos
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/client-portal/financial")}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Ver Financeiro
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
