import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Clock, DollarSign, CheckCircle2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";

interface Task {
  id: string;
  due_date: string;
  status: string;
  frozen_price: number;
  created_at: string;
  product_name: string;
  project_name: string;
  client_name: string;
}

interface ProductRevenue {
  name: string;
  value: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasksAtRisk, setTasksAtRisk] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [productRevenue, setProductRevenue] = useState<ProductRevenue[]>([]);
  const [recentApprovedTasks, setRecentApprovedTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Call edge function to get all dashboard stats
      const { data, error } = await supabase.functions.invoke("dashboard-stats");

      if (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
      }

      console.log("Dashboard stats received:", data);

      setTasksAtRisk(data.tasksAtRisk || 0);
      setOverdueTasks(data.overdueTasks || 0);
      setMonthlyRevenue(data.monthlyRevenue || 0);
      setProductRevenue(data.productRevenue || []);
      setRecentApprovedTasks(data.recentApprovedTasks || []);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Gerencial</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {user?.user_metadata?.full_name || user?.email}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksAtRisk}</div>
            <p className="text-xs text-muted-foreground">
              Vencem em menos de 3 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Prazo vencido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Prevista (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(), "MMMM/yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Pie Chart - Revenue by Product */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Produto</CardTitle>
            <CardDescription>Distribuição da receita no mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            {productRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productRevenue}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {productRevenue.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível para o mês atual
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Approved Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Últimas Tarefas Aprovadas
            </CardTitle>
            <CardDescription>5 tarefas aprovadas mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentApprovedTasks.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentApprovedTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          {task.client_name}
                        </TableCell>
                        <TableCell>{task.project_name}</TableCell>
                        <TableCell>{task.product_name}</TableCell>
                        <TableCell className="text-right">
                          R$ {Number(task.frozen_price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Nenhuma tarefa aprovada ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
