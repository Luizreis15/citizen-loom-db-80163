import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInCalendarDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

interface TaskKanbanProps {
  projectId: string;
}

const STATUSES = [
  "Backlog",
  "Em produção",
  "Revisão interna",
  "Enviado ao cliente",
  "Ajustes",
  "Aprovado",
  "Publicado",
];

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
  
  // If due date is today or has passed
  if (due <= today) {
    return "text-destructive font-semibold";
  }
  
  // Calculate business days until due date
  const businessDaysUntilDue = getBusinessDaysBetween(today, due) - 1; // -1 because we don't count today
  
  // Between 1 and 3 business days: yellow/warning
  if (businessDaysUntilDue >= 1 && businessDaysUntilDue <= 3) {
    return "text-yellow-600 dark:text-yellow-500 font-semibold";
  }
  
  // More than 3 business days: normal color
  return "text-muted-foreground";
}

export function TaskKanban({ projectId }: TaskKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          products(name),
          profiles(full_name)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar tarefas");
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Carregando tarefas...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {STATUSES.map((status) => {
        const statusTasks = getTasksByStatus(status);
        return (
          <div key={status} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-sm">{status}</h3>
              <Badge variant="secondary" className="text-xs">
                {statusTasks.length}
              </Badge>
            </div>
            
            <div className="space-y-2 min-h-[200px]">
              {statusTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {task.products.name}
                    </CardTitle>
                    {task.variant_description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.variant_description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="h-3 w-3" />
                      <span className={cn(getDueDateColorClass(task.due_date))}>
                        {format(new Date(task.due_date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    
                    {task.profiles && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{task.profiles.full_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-xs text-muted-foreground">
                        Qtd: {task.quantity}
                      </span>
                      <span className="text-xs font-semibold">
                        R$ {task.frozen_price.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
