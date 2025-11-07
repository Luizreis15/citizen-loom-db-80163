import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminViewingBanner } from "@/components/AdminViewingBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { Calendar, User, Package, FileText, Download, MessageSquare, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  status: string;
  quantity: number;
  variant_description: string | null;
  frozen_price: number;
  frozen_sla_days: number;
  due_date: string;
  created_at: string;
  products: {
    name: string;
    description: string | null;
  };
  profiles: {
    full_name: string;
  } | null;
  projects: {
    name: string;
  };
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  upload_type: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface Comment {
  id: number;
  comment_text: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const ClientPortalTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { role } = useUserRole();
  const [task, setTask] = useState<Task | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const isAdmin = role === "Owner" || role === "Admin";
  const viewingClientId = searchParams.get("client_id");

  useEffect(() => {
    fetchTaskDetails();
    fetchAttachments();
    fetchComments();

    // Subscribe to realtime changes
    const taskChannel = supabase
      .channel('task-detail-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${id}`,
        },
        () => fetchTaskDetails()
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_comments',
          filter: `task_id=eq.${id}`,
        },
        () => fetchComments()
      )
      .subscribe();

    const attachmentsChannel = supabase
      .channel('attachments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_attachments',
          filter: `task_id=eq.${id}`,
        },
        () => fetchAttachments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(attachmentsChannel);
    };
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          products(name, description),
          profiles(full_name),
          projects(name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setTask(data);
    } catch (error: any) {
      toast.error("Erro ao carregar detalhes da tarefa");
      console.error("Error fetching task:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select(`
          id,
          file_name,
          file_url,
          upload_type,
          created_at,
          uploader_id
        `)
        .eq("task_id", id)
        .eq("upload_type", "Saída")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch uploader profiles separately
      if (data && data.length > 0) {
        const uploaderIds = data.map(a => a.uploader_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", uploaderIds);

        if (profilesError) throw profilesError;

        // Map profiles to attachments
        const attachmentsWithProfiles = data.map(attachment => ({
          ...attachment,
          profiles: profiles?.find(p => p.id === attachment.uploader_id) || { full_name: "Desconhecido" }
        }));

        setAttachments(attachmentsWithProfiles);
      } else {
        setAttachments([]);
      }
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("task_comments")
        .select(`
          id,
          comment_text,
          created_at,
          user_id
        `)
        .eq("task_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(c => c.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        // Map profiles to comments
        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: profiles?.find(p => p.id === comment.user_id) || { full_name: "Desconhecido" }
        }));

        setComments(commentsWithProfiles);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("task_comments")
        .insert({
          task_id: id,
          user_id: user.id,
          comment_text: newComment.trim(),
        });

      if (error) throw error;

      toast.success("Comentário adicionado");
      setNewComment("");
    } catch (error: any) {
      toast.error("Erro ao adicionar comentário");
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string, actionName: string) => {
    if (!id) return;

    try {
      setSubmitting(true);
      
      // Determine action type
      const action = newStatus === "Ajustes" ? "solicitar_ajustes" : "aprovar";
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke("task-client-action", {
        body: {
          task_id: id,
          action: action,
          comment: newComment.trim() || undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        fetchTaskDetails();
        setNewComment(""); // Clear comment after action
      } else {
        throw new Error(data.error || "Erro ao processar ação");
      }
    } catch (error: any) {
      toast.error(error.message || `Erro ao ${actionName.toLowerCase()} tarefa`);
      console.error("Error updating task status:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-muted-foreground">Tarefa não encontrada</p>
        <Button onClick={() => {
          const url = viewingClientId 
            ? `/client-portal/tasks?client_id=${viewingClientId}`
            : "/client-portal/tasks";
          navigate(url);
        }}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAdmin && viewingClientId && <AdminViewingBanner />}
      
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = viewingClientId 
              ? `/client-portal/tasks?client_id=${viewingClientId}`
              : "/client-portal/tasks";
            navigate(url);
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Task Details */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{task.products.name}</CardTitle>
              {task.variant_description && (
                <p className="text-muted-foreground">{task.variant_description}</p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0">
              {task.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Projeto:</span>
              <span>{task.projects.name}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Prazo:</span>
              <span>{format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>

            {task.profiles && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Responsável:</span>
                <span>{task.profiles.full_name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Quantidade:</span>
              <span>{task.quantity}</span>
            </div>
          </div>

          {task.products.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium">Descrição do Produto</h3>
                <p className="text-sm text-muted-foreground">{task.products.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Attachments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Entregáveis ({attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum entregável disponível ainda
            </p>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Enviado por {attachment.profiles.full_name} em{" "}
                        {format(new Date(attachment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(attachment.file_url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentários ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-primary/20 pl-4 py-2">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium">{comment.profiles.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || submitting}
            >
              Adicionar Comentário
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {task.status !== "Aprovado" && task.status !== "Publicado" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleStatusChange("Ajustes", "Solicitado Ajuste")}
                disabled={submitting}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Solicitar Ajustes
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleStatusChange("Aprovado", "Aprovada")}
                disabled={submitting}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientPortalTaskDetail;
