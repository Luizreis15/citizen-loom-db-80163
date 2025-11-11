import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";

export function useTaskNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('task-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `assignee_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New task assigned:', payload);
          
          // Fetch task details with product and client info
          const { data: taskData } = await supabase
            .from('tasks')
            .select(`
              *,
              products (name),
              client_requests (
                title,
                protocol_number,
                clients (name)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (taskData) {
            const clientName = taskData.client_requests?.clients?.name || 'Cliente';
            const serviceName = taskData.products?.name || 'Serviço';
            const protocol = taskData.client_requests?.protocol_number || '';

            toast({
              title: "🎯 Novo ticket atribuído!",
              description: (
                <div className="flex items-start gap-2 mt-2">
                  <Bell className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <p className="font-semibold">{protocol}</p>
                    <p className="text-sm">{serviceName}</p>
                    <p className="text-xs text-muted-foreground">Cliente: {clientName}</p>
                    <p className="text-xs text-muted-foreground">Prazo: {new Date(taskData.due_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ),
              duration: 8000,
            });

            // Play notification sound
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSiJ0fPTgjMGHm7A7+OZURE');
            audio.play().catch(() => {
              // Ignore if autoplay is blocked
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `assignee_id=eq.${user.id}`
        },
        async (payload) => {
          // Check if task was just assigned (assignee_id changed from null to current user)
          if (!payload.old.assignee_id && payload.new.assignee_id === user.id) {
            console.log('Task reassigned:', payload);
            
            const { data: taskData } = await supabase
              .from('tasks')
              .select(`
                *,
                products (name),
                client_requests (
                  title,
                  protocol_number,
                  clients (name)
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (taskData) {
              const clientName = taskData.client_requests?.clients?.name || 'Cliente';
              const serviceName = taskData.products?.name || 'Serviço';
              const protocol = taskData.client_requests?.protocol_number || '';

              toast({
                title: "🎯 Ticket atribuído a você!",
                description: (
                  <div className="flex items-start gap-2 mt-2">
                    <Bell className="h-4 w-4 mt-0.5 text-primary" />
                    <div>
                      <p className="font-semibold">{protocol}</p>
                      <p className="text-sm">{serviceName}</p>
                      <p className="text-xs text-muted-foreground">Cliente: {clientName}</p>
                      <p className="text-xs text-muted-foreground">Prazo: {new Date(taskData.due_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ),
                duration: 8000,
              });

              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSiJ0fPTgjMGHm7A7+OZURE');
              audio.play().catch(() => {});
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);
}
