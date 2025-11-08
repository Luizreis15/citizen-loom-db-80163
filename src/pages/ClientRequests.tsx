import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { FilePreview } from "@/components/FilePreview";
import { Plus, Search, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.client_id) return;

      const { data, error } = await supabase
        .from("client_requests")
        .select(`
          *,
          products(name),
          request_attachments(*)
        `)
        .eq("client_id", profile.client_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meus Pedidos</h1>
        <Button onClick={() => navigate("/client-portal/request")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Em análise">Em análise</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
            <SelectItem value="Recusado">Recusado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar os filtros"
                : "Crie sua primeira solicitação"}
            </p>
            <Button onClick={() => navigate("/client-portal/request")}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/client-portal/requests/${request.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{request.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {request.description}
                </p>

                {request.request_attachments && request.request_attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Anexos ({request.request_attachments.length})</p>
                    <div className="grid gap-2">
                      {request.request_attachments.slice(0, 2).map((attachment: any) => (
                        <FilePreview
                          key={attachment.id}
                          fileName={attachment.file_name}
                          fileUrl={attachment.file_url}
                          fileType={attachment.file_type}
                          fileSize={attachment.file_size}
                        />
                      ))}
                      {request.request_attachments.length > 2 && (
                        <p className="text-xs text-muted-foreground">
                          +{request.request_attachments.length - 2} arquivo(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {request.review_notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Resposta do Admin:</p>
                    <p className="text-sm text-muted-foreground">{request.review_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
