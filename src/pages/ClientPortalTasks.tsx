import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { Calendar, User, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

interface Task {
  id: string;
  status: string;
  quantity: number;
  variant_description: string | null;
  frozen_price: number;
  due_date: string;
  products: {
    name: string;
  };
  profiles: {
    full_name: string;
  } | null;
  projects: {
    name: string;
  };
}

// Simplified statuses for client portal
const CLIENT_STATUSES = [
  "Em produção",
  "Revisão",
  "Aprovado"
];

// Map internal statuses to client-friendly names
function mapToClientStatus(internalStatus: string): string {
  switch (internalStatus) {
    case "Em produção":
      return "Em produção";
    case "Revisão interna":
    case "Enviado ao cliente":
    case "Ajustes":
      return "Revisão";
    case "Aprovado":
    case "Publicado":
      return "Aprovado";
    default:
      return ""; // Hide other statuses
  }
}

// Calculate business days between two dates (excluding weekends)
function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// Get the appropriate color class based on due date
function getDueDateColorClass(dueDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  if (due <= today) {
    return "text-destructive font-semibold";
  }
  
  const businessDaysUntilDue = getBusinessDaysBetween(today, due) - 1;
  
  if (businessDaysUntilDue >= 1 && businessDaysUntilDue <= 3) {
    return "text-yellow-600 dark:text-yellow-500 font-semibold";
  }
  
  return "text-muted-foreground";
}

const ClientPortalTasks = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role } = useUserRole();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isAdmin = role === "Owner" || role === "Admin";
  const viewingClientId = searchParams.get("client_id");

  useEffect(() => {
    fetchTasks();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('client-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewingClientId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("tasks")
        .select(`
          *,
          products(name),
          profiles(full_name),
          projects(name, client_id)
        `)
        .order("due_date", { ascending: true });
      
      // If admin is viewing a specific client, filter by that client's projects
      if (isAdmin && viewingClientId) {
        const { data: clientProjects, error: projectsError } = await supabase
          .from("projects")
          .select("id")
          .eq("client_id", viewingClientId);
        
        if (projectsError) throw projectsError;
        
        const projectIds = clientProjects?.map(p => p.id) || [];
        if (projectIds.length > 0) {
          query = query.in("project_id", projectIds);
        } else {
          // No projects for this client, return empty
          setTasks([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter tasks to only show relevant statuses
      const filteredTasks = (data || []).filter((task) => {
        const clientStatus = mapToClientStatus(task.status);
        return clientStatus !== "";
      });
      
      setTasks(filteredTasks);
    } catch (error: any) {
      toast.error("Erro ao carregar tarefas");
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTasksByClientStatus = (clientStatus: string) => {
    return tasks.filter((task) => mapToClientStatus(task.status) === clientStatus);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Carregando suas tarefas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minhas Tarefas</h1>
        <p className="text-muted-foreground">
          Acompanhe o progresso dos seus projetos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CLIENT_STATUSES.map((status) => {
          const statusTasks = getTasksByClientStatus(status);
          return (
            <div key={status} className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">{status}</h3>
                <Badge variant="secondary">
                  {statusTasks.length}
                </Badge>
              </div>
              
              <div className="space-y-3 min-h-[400px]">
                {statusTasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      const url = viewingClientId 
                        ? `/client-portal/tasks/${task.id}?client_id=${viewingClientId}`
                        : `/client-portal/tasks/${task.id}`;
                      navigate(url);
                    }}
                  >
                    <CardHeader className="p-4 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-medium">
                          {task.products.name}
                        </CardTitle>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {task.projects.name}
                        </Badge>
                      </div>
                      {task.variant_description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.variant_description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span className={cn(getDueDateColorClass(task.due_date))}>
                          Entrega: {format(new Date(task.due_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      
                      {task.profiles && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{task.profiles.full_name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>Quantidade: {task.quantity}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {statusTasks.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    Nenhuma tarefa nesta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientPortalTasks;
