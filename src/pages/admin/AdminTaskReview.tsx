import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  CheckCircle, AlertCircle, Calendar, User, Package, 
  FileText, Download, Eye
} from "lucide-react";
import { FilePreview } from "@/components/FilePreview";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
  id: string;
  status: string;
  due_date: string;
  variant_description: string | null;
  created_at: string;
  products: {
    name: string;
  };
  profiles: {
    full_name: string;
    email: string;
  } | null;
  client_requests?: {
    protocol_number: string;
    title: string;
    clients: {
      name: string;
    };
  } | null;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  upload_type: string;
  created_at: string;
}

export default function AdminTaskReview() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'liberar' | 'ajustes' | null;
  }>({ open: false, action: null });
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTasksForReview();
  }, []);

  const fetchTasksForReview = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          products(name),
          profiles!tasks_assignee_id_fkey(full_name, email),
          client_requests(
            protocol_number,
            title,
            clients(name)
          )
        `)
        .eq("status", "Em Revisão")
        .order("due_date", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      toast.error("Erro ao carregar tarefas para revisão");
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskAttachments = async (taskId: string) => {
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .eq("upload_type", "Saída")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
      toast.error("Erro ao carregar arquivos");
    }
  };

  const handleViewTask = async (task: Task) => {
    setSelectedTask(task);
    await fetchTaskAttachments(task.id);
  };

  const handleOpenAction = (action: 'liberar' | 'ajustes') => {
    setActionDialog({ open: true, action });
    setNotes("");
  };

  const handleExecuteAction = async () => {
    if (!selectedTask || !actionDialog.action) return;

    try {
      setProcessing(true);

      const action = actionDialog.action === 'liberar' 
        ? 'liberar_para_cliente' 
        : 'solicitar_ajustes_colaborador';

      const { error } = await supabase.functions.invoke('admin-task-action', {
        body: {
          taskId: selectedTask.id,
          action,
          notes: notes.trim() || undefined
        }
      });

      if (error) throw error;

      toast.success(
        actionDialog.action === 'liberar' 
          ? 'Trabalho liberado para o cliente!' 
          : 'Ajustes solicitados ao colaborador!'
      );

      setActionDialog({ open: false, action: null });
      setSelectedTask(null);
      setNotes("");
      fetchTasksForReview();
    } catch (error: any) {
      console.error("Error executing action:", error);
      toast.error("Erro ao executar ação: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revisão de Trabalhos</h1>
          <p className="text-muted-foreground mt-1">
            Revise trabalhos concluídos pelos colaboradores
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
        </Badge>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">Nenhuma tarefa para revisar</h3>
              <p className="text-muted-foreground">
                Não há trabalhos aguardando revisão no momento
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {task.products.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {task.client_requests?.protocol_number || `Tarefa #${task.id.slice(0, 8)}`}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Em Revisão</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cliente:</span>
                    <span className="truncate">{task.client_requests?.clients?.name || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Colaborador:</span>
                    <span className="truncate">{task.profiles?.full_name || 'N/A'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Prazo:</span>
                    <span>{format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </div>

                <Separator />

                <Button 
                  onClick={() => handleViewTask(task)} 
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Revisar Trabalho
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Visualização e Ações */}
      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedTask.products.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedTask.client_requests?.protocol_number} - {selectedTask.client_requests?.clients?.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Informações */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Colaborador</p>
                    <p className="text-base">{selectedTask.profiles?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prazo de Entrega</p>
                    <p className="text-base">
                      {format(new Date(selectedTask.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {selectedTask.variant_description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Observações do Cliente
                    </p>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedTask.variant_description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Arquivos Entregues */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">Trabalho Entregue</h3>
                    <Badge variant="secondary">{attachments.length} arquivo(s)</Badge>
                  </div>
                  
                  {attachments.length === 0 ? (
                    <div className="text-center py-8 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Nenhum arquivo foi enviado
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <FilePreview
                          key={attachment.id}
                          fileName={attachment.file_name}
                          fileUrl={attachment.file_url}
                          fileType="application/octet-stream"
                          fileSize={0}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Ações */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleOpenAction('liberar')}
                    className="flex-1"
                    disabled={attachments.length === 0}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar e Liberar para Cliente
                  </Button>
                  <Button
                    onClick={() => handleOpenAction('ajustes')}
                    className="flex-1"
                    variant="outline"
                  >
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Solicitar Ajustes
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Ação */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'liberar' 
                ? 'Aprovar e Liberar para Cliente' 
                : 'Solicitar Ajustes ao Colaborador'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'liberar' 
                ? 'O cliente será notificado e poderá visualizar o trabalho concluído.'
                : 'O colaborador será notificado e deverá fazer os ajustes solicitados.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">
                Observações {actionDialog.action === 'ajustes' && <span className="text-destructive">*</span>}
              </label>
              <Textarea
                placeholder={
                  actionDialog.action === 'liberar'
                    ? "Adicione observações para o cliente (opcional)"
                    : "Descreva os ajustes necessários"
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ open: false, action: null })}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExecuteAction}
              disabled={processing || (actionDialog.action === 'ajustes' && !notes.trim())}
            >
              {processing ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
