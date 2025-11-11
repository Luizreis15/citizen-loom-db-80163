import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle2, ListTodo } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetricCard } from "@/components/MetricCard";

interface Task {
  id: string;
  variant_description: string | null;
  status: string;
  due_date: string;
  projects?: {
    name: string;
  } | null;
  client_requests?: {
    title: string;
    clients: {
      name: string;
    };
  } | null;
  products: {
    name: string;
  };
}

const CollaboratorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    completedThisWeek: 0,
  });

  useEffect(() => {
    if (user) {
      fetchMyTasks();
    }
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          projects (
            name
          ),
          client_requests (
            title,
            clients (
              name
            )
          ),
          products (
            name
          )
        `)
        .eq("assignee_id", user?.id)
        .order("due_date", { ascending: true });

      if (error) throw error;

      const taskData = data || [];
      setTasks(taskData);

      // Calculate stats
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      
      const overdue = taskData.filter(
        (t) => new Date(t.due_date) < new Date() && t.status !== "Concluído"
      ).length;

      const completedThisWeek = taskData.filter((t) => {
        if (t.status !== "Concluído" || !t.updated_at) return false;
        const updatedDate = new Date(t.updated_at);
        return updatedDate >= weekStart;
      }).length;

      setStats({
        total: taskData.length,
        overdue,
        completedThisWeek,
      });
    } catch (error: any) {
      toast.error("Erro ao carregar tarefas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingTasks = tasks
    .filter((t) => t.status !== "Concluído")
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel de colaborador
        </p>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Minhas Tarefas"
          value={stats.total}
          icon={ListTodo}
        />
        <MetricCard
          title="Tarefas Atrasadas"
          value={stats.overdue}
          icon={AlertCircle}
        />
        <MetricCard
          title="Concluídas (Semana)"
          value={stats.completedThisWeek}
          icon={CheckCircle2}
        />
      </div>

      {/* Próximas Tarefas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Próximas Tarefas
          </CardTitle>
          <CardDescription>
            Tarefas com prazos mais próximos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma tarefa pendente no momento
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingTasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date();
                return (
                  <div
                    key={task.id}
                    onClick={() => navigate("/collaborator/tasks")}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {task.products.name}
                        {task.variant_description && ` - ${task.variant_description}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cliente: {task.client_requests?.clients.name || 'N/A'}
                      </p>
                      {task.client_requests && (
                        <p className="text-sm text-muted-foreground">
                          Solicitação: {task.client_requests.title}
                        </p>
                      )}
                      {task.projects && (
                        <p className="text-sm text-muted-foreground">
                          Projeto: {task.projects.name}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p
                        className={`text-sm font-medium ${
                          isOverdue ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        {format(new Date(task.due_date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">{task.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaboratorDashboard;
