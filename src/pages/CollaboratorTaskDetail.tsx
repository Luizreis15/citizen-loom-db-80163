import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  ArrowLeft, Calendar, Package, User, FileText, 
  Download, Upload, MessageSquare, CheckCircle, Play
} from "lucide-react";
import { FileUpload, UploadedFile } from "@/components/FileUpload";
import { FilePreview } from "@/components/FilePreview";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
  id: string;
  status: string;
  due_date: string;
  variant_description: string | null;
  frozen_price: number;
  frozen_sla_days: number;
  quantity: number;
  created_at: string;
  products: {
    name: string;
    description: string;
  };
  profiles: {
    full_name: string;
  } | null;
  projects: {
    name: string;
  } | null;
  client_requests?: {
    protocol_number: string;
    title: string;
    clients: {
      id: string;
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
  uploader_id: string;
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

export default function CollaboratorTaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTaskDetails();
    fetchAttachments();
    fetchComments();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          products(name, description),
          profiles(full_name),
          projects(name),
          client_requests(
            protocol_number,
            title,
            clients(id, name)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setTask(data);
    } catch (error: any) {
      console.error("Error fetching task:", error);
      toast.error("Erro ao carregar detalhes da tarefa");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch uploader names separately
      const attachmentsWithUploaders = await Promise.all((data || []).map(async (att) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", att.uploader_id)
          .single();
        
        return {
          ...att,
          profiles: { full_name: profile?.full_name || "Desconhecido" }
        };
      }));
      
      setAttachments(attachmentsWithUploaders);
    } catch (error: any) {
      console.error("Error fetching attachments:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("task_comments")
        .select(`
          *,
          profiles(full_name)
        `)
        .eq("task_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleStartWork = async () => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: "Em Progresso" })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Trabalho iniciado!");
      fetchTaskDetails();
    } catch (error: any) {
      console.error("Error starting work:", error);
      toast.error("Erro ao iniciar trabalho");
    }
  };

  const handleSubmitForReview = async () => {
    try {
      // Verificar se há arquivos de saída
      const outputFiles = attachments.filter(a => a.upload_type === "Saída");
      if (outputFiles.length === 0) {
        toast.error("Faça upload do trabalho concluído antes de enviar para revisão");
        return;
      }

      const { error } = await supabase
        .from("tasks")
        .update({ status: "Em Revisão" })
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Trabalho enviado para revisão do admin!");
      fetchTaskDetails();
    } catch (error: any) {
      console.error("Error submitting for review:", error);
      toast.error("Erro ao enviar para revisão");
    }
  };

  const handleFilesUploaded = async (files: UploadedFile[]) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const attachmentsToInsert = files.map(file => ({
        task_id: id,
        file_name: file.name,
        file_url: file.url,
        file_type: file.type,
        uploader_id: user.id,
        upload_type: "Saída" // Colaborador sempre faz upload de trabalho concluído
      }));

      const { error } = await supabase
        .from("task_attachments")
        .insert(attachmentsToInsert);

      if (error) throw error;

      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso`);
      fetchAttachments();
    } catch (error: any) {
      console.error("Error uploading files:", error);
      toast.error("Erro ao fazer upload dos arquivos");
    } finally {
      setUploading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("task_comments")
        .insert({
          task_id: id,
          user_id: user.id,
          comment_text: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      toast.success("Comentário adicionado");
      fetchComments();
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error("Erro ao adicionar comentário");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Tarefa não encontrada</h2>
          <Button asChild className="mt-4">
            <Link to="/collaborator/tasks">Voltar para Tarefas</Link>
          </Button>
        </div>
      </div>
    );
  }

  const inputFiles = attachments.filter(a => a.upload_type === "Entrada");
  const outputFiles = attachments.filter(a => a.upload_type === "Saída");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Backlog": "secondary",
      "Em Progresso": "default",
      "Em Revisão": "outline",
      "Ajustes": "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{task.products.name}</h1>
          <p className="text-muted-foreground">
            {task.client_requests?.protocol_number || `Tarefa #${task.id.slice(0, 8)}`}
          </p>
        </div>
        {getStatusBadge(task.status)}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações da Tarefa */}
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Cliente:</span>
              <span>{task.client_requests?.clients?.name || 'N/A'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Projeto:</span>
              <span>
                {task.projects?.name || 
                 task.client_requests?.protocol_number || 
                 task.client_requests?.title || 
                 'Sem projeto vinculado'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Prazo:</span>
              <span>{format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>

            {task.variant_description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Observações:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {task.variant_description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>Gerencie o andamento do trabalho</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {task.status === "Backlog" && (
              <Button onClick={handleStartWork} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Iniciar Trabalho
              </Button>
            )}

            {task.status === "Em Progresso" && (
              <Button onClick={handleSubmitForReview} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Enviar para Revisão
              </Button>
            )}

            {task.status === "Ajustes" && (
              <Button onClick={handleStartWork} className="w-full" variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Retomar Ajustes
              </Button>
            )}

            {task.status === "Em Revisão" && (
              <div className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-lg">
                Aguardando revisão do admin
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Arquivos de Entrada (do cliente) */}
      {inputFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Arquivos de Referência
            </CardTitle>
            <CardDescription>
              Arquivos enviados pelo cliente para referência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {inputFiles.map((attachment) => (
              <FilePreview
                key={attachment.id}
                fileName={attachment.file_name}
                fileUrl={attachment.file_url}
                fileType="application/octet-stream"
                fileSize={0}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upload de Trabalho Concluído */}
      {["Backlog", "Em Progresso", "Ajustes"].includes(task.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload do Trabalho Concluído
            </CardTitle>
            <CardDescription>
              Faça upload dos arquivos do trabalho finalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              maxSize={100}
              clientId={task.client_requests?.clients?.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Arquivos de Saída (trabalho concluído) */}
      {outputFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Trabalho Enviado
            </CardTitle>
            <CardDescription>
              Arquivos do trabalho concluído
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {outputFiles.map((attachment) => (
              <FilePreview
                key={attachment.id}
                fileName={attachment.file_name}
                fileUrl={attachment.file_url}
                fileType="application/octet-stream"
                fileSize={0}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Comentários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Adicione um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              Adicionar Comentário
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum comentário ainda
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-1 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3" />
                    <span className="font-medium">{comment.profiles.full_name}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(comment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
