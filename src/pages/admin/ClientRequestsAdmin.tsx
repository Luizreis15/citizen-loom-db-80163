import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { FilePreview } from "@/components/FilePreview";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientRequestsAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [taskData, setTaskData] = useState({
    assignee_id: "",
    due_date: ""
  });

  useEffect(() => {
    fetchRequests();
    fetchCollaborators();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_requests")
        .select(`
          *,
          products(name),
          clients(name),
          request_attachments(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately for each request
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          if (request.requested_by) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", request.requested_by)
              .single();
            
            return { ...request, requester_profile: profile };
          }
          return request;
        })
      );

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      // 1. Buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      
      if (profilesError) throw profilesError;
      if (!profiles) return;

      // 2. Para cada profile, buscar roles usando RPC
      const collaboratorsWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: rolesData } = await supabase
            .rpc('get_user_roles', { _user_id: profile.id });
          
          return {
            ...profile,
            roles: rolesData || []
          };
        })
      );

      // 3. Filtrar apenas quem tem roles de colaborador
      const collaboratorRoles = [
        "Colaborador",
        "Editor de Vídeo",
        "Social Mídia",
        "Webdesigner",
        "Administrativo",
        "Finance"
      ];

      const filteredCollaborators = collaboratorsWithRoles.filter(user => 
        user.roles.some((role: any) => collaboratorRoles.includes(role.role_name))
      );

      setCollaborators(filteredCollaborators);
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      setCollaborators([]);
    }
  };

  const filterRequests = () => {
    if (statusFilter === "all") {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(req => req.status === statusFilter));
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !taskData.assignee_id || !taskData.due_date) {
      toast.error("Por favor, preencha executor e data de entrega");
      return;
    }

    try {
      // Get user ID once at the beginning to avoid multiple auth calls
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Erro ao obter dados do usuário. Faça login novamente.");
      }

      const userId = user.id;

      // Update request status
      const { error: updateError } = await supabase
        .from("client_requests")
        .update({
          status: "Aprovado",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq("id", selectedRequest.id);

      if (updateError) throw updateError;

      // Create task using edge function
      const { data: taskResponse, error: taskError } = await supabase.functions.invoke("create-task", {
        body: {
          request_id: selectedRequest.id,
          product_id: selectedRequest.product_id,
          assignee_id: taskData.assignee_id,
          due_date: taskData.due_date,
          quantity: selectedRequest.quantity,
          description: selectedRequest.description
        }
      });

      if (taskError) {
        console.error("Edge function error:", taskError);
        throw new Error("Erro ao criar tarefa: " + taskError.message);
      }

      // Log activity
      const { error: logError } = await supabase.from("activity_log").insert({
        client_id: selectedRequest.client_id,
        user_id: userId,
        action_type: "approval",
        description: `Solicitação aprovada e tarefa criada`
      });

      if (logError) {
        console.error("Error logging activity:", logError);
        // Don't throw - activity log is not critical
      }

      const protocolNumber = selectedRequest.protocol_number || 'N/A';
      toast.success(`Solicitação ${protocolNumber} aprovada e tarefa criada!`);
      setSelectedRequest(null);
      setReviewNotes("");
      setTaskData({ assignee_id: "", due_date: "" });
      fetchRequests();
    } catch (error: any) {
      console.error("Error approving request:", error);
      toast.error("Erro ao aprovar solicitação: " + error.message);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !reviewNotes) {
      toast.error("Por favor, informe o motivo da recusa");
      return;
    }

    try {
      // Get user ID once at the beginning to avoid multiple auth calls
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Erro ao obter dados do usuário. Faça login novamente.");
      }

      const userId = user.id;

      const { error } = await supabase
        .from("client_requests")
        .update({
          status: "Recusado",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      const { error: logError } = await supabase.from("activity_log").insert({
        client_id: selectedRequest.client_id,
        user_id: userId,
        action_type: "status_change",
        description: `Solicitação recusada`
      });

      if (logError) {
        console.error("Error logging activity:", logError);
        // Don't throw - activity log is not critical
      }

      toast.success("Solicitação recusada");
      setSelectedRequest(null);
      setReviewNotes("");
      fetchRequests();
    } catch (error: any) {
      toast.error("Erro ao recusar solicitação: " + error.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-muted-foreground">Carregando...</p>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Solicitações de Clientes</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Pendente">Pendentes</SelectItem>
            <SelectItem value="Em análise">Em análise</SelectItem>
            <SelectItem value="Aprovado">Aprovadas</SelectItem>
            <SelectItem value="Recusado">Recusadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredRequests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div className="space-y-1">
                  <CardTitle className="text-xl">{request.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {request.protocol_number || 'N/A'}
                    </span>
                    <span>•</span>
                    <span>{request.clients?.name}</span>
                    <span>•</span>
                    <span>{request.products?.name}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                </div>
                <StatusBadge status={request.status} type="request" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{request.description}</p>

              {request.request_attachments && request.request_attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Anexos ({request.request_attachments.length})</p>
                  <div className="grid gap-2">
                    {request.request_attachments.map((attachment: any) => (
                      <FilePreview
                        key={attachment.id}
                        fileName={attachment.file_name}
                        fileUrl={attachment.file_url}
                        fileType={attachment.file_type}
                        fileSize={attachment.file_size}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Dialog onOpenChange={(open) => {
                  if (open) {
                    setSelectedRequest(request);
                  } else {
                    setSelectedRequest(null);
                    setReviewNotes("");
                    setTaskData({ assignee_id: "", due_date: "" });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={request.status !== "Pendente"}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Aprovar Solicitação</DialogTitle>
                      <DialogDescription>
                        Protocolo: {selectedRequest?.protocol_number || 'N/A'} - Defina o executor e prazo de entrega
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Responsável *</Label>
                        <Select
                          value={taskData.assignee_id}
                          onValueChange={(value) => setTaskData({ ...taskData, assignee_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o executor" />
                          </SelectTrigger>
                          <SelectContent>
                            {collaborators.map(collab => (
                              <SelectItem key={collab.id} value={collab.id}>
                                {collab.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Data de Entrega *</Label>
                        <Input
                          type="date"
                          value={taskData.due_date}
                          onChange={(e) => setTaskData({ ...taskData, due_date: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Observações (opcional)</Label>
                        <Textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Adicione observações..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleApprove}>
                        Aprovar e Criar Tarefa
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog onOpenChange={(open) => {
                  if (open) {
                    setSelectedRequest(request);
                  } else {
                    setSelectedRequest(null);
                    setReviewNotes("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={request.status !== "Pendente"}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Recusar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Recusar Solicitação</DialogTitle>
                      <DialogDescription>
                        Informe o motivo da recusa
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Motivo da recusa..."
                      rows={4}
                    />
                    <DialogFooter>
                      <Button variant="destructive" onClick={handleReject}>
                        Confirmar Recusa
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/client-portal/requests/${request.id}?client_id=${request.client_id}`)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
