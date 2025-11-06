import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

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
];

// Droppable status columns (excluding "Publicado")
const DROPPABLE_STATUSES = STATUSES;

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
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Find the task being moved
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    );

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;

      toast.success(`Tarefa movida para ${newStatus}`);
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Erro ao atualizar status da tarefa");
      
      // Revert optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, status: task.status } : t
        )
      );
    }
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Carregando tarefas...</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {DROPPABLE_STATUSES.map((status) => {
          const statusTasks = getTasksByStatus(status);
          return (
            <DroppableColumn key={status} id={status} status={status} count={statusTasks.length}>
              {statusTasks.map((task) => (
                <DraggableTaskCard key={task.id} task={task} />
              ))}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable Column Component
function DroppableColumn({ 
  id, 
  status, 
  count, 
  children 
}: { 
  id: string; 
  status: string; 
  count: number; 
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="flex flex-col gap-2">
      <div className={cn(
        "flex items-center justify-between px-2 py-1 rounded-lg transition-colors",
        isOver ? "bg-primary/10" : "bg-muted/50"
      )}>
        <h3 className="font-semibold text-sm">{status}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      
      <div className="space-y-2 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}

// Draggable Task Card Component
function DraggableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TaskCard task={task} />
    </div>
  );
}

// Task Card Component
function TaskCard({ task, isDragging = false }: { task: Task; isDragging?: boolean }) {
  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing",
      isDragging && "shadow-lg"
    )}>
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
  );
}
