import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { FilePreview } from "@/components/FilePreview";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientRequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (user && id) {
      fetchRequestDetail();
    }
  }, [user, id]);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);

      const { data: requestData, error: requestError } = await supabase
        .from("client_requests")
        .select(`
          *,
          products(name, description),
          profiles!client_requests_requested_by_fkey(full_name)
        `)
        .eq("id", id!)
        .single();

      if (requestError) throw requestError;

      const { data: attachmentsData } = await supabase
        .from("request_attachments")
        .select("*")
        .eq("request_id", id!);

      const { data: activitiesData } = await supabase
        .from("activity_log")
        .select("*")
        .eq("client_id", requestData.client_id)
        .order("created_at", { ascending: false })
        .limit(10);

      setRequest(requestData);
      setAttachments(attachmentsData || []);
      setActivities(activitiesData || []);
    } catch (error) {
      console.error("Error fetching request detail:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Solicitação não encontrada</p>
        <Button onClick={() => navigate("/client-portal/requests")} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/client-portal/requests")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Meus Pedidos
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{request.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Criado em {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <StatusBadge status={request.status} type="request" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Serviço</h3>
            <p className="text-muted-foreground">{request.products?.name}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{request.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Quantidade</h3>
              <p className="text-muted-foreground">{request.quantity}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Prioridade</h3>
              <p className="text-muted-foreground">{request.priority}</p>
            </div>
          </div>

          {request.review_notes && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Resposta do Admin</h3>
              <p className="text-muted-foreground">{request.review_notes}</p>
              {request.reviewed_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Respondido em {format(new Date(request.reviewed_at), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              )}
            </div>
          )}

          {attachments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Anexos ({attachments.length})</h3>
              <div className="space-y-2">
                {attachments.map((attachment) => (
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
