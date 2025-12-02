import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  RotateCcw, 
  Download, 
  ArrowLeft,
  Shield,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FieldSchema {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  sensitive?: boolean;
}

interface SectionSchema {
  key: string;
  title: string;
  description?: string;
  fields: FieldSchema[];
}

interface TemplateSchema {
  steps: SectionSchema[];
}

export default function AdminOnboardingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState<any>(null);
  const [schema, setSchema] = useState<TemplateSchema | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [attachments, setAttachments] = useState<Record<string, any>>({});
  const [decryptedFields, setDecryptedFields] = useState<Record<string, string>>({});
  const [decryptingField, setDecryptingField] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOnboardingDetail();
    }
  }, [id]);

  const fetchOnboardingDetail = async () => {
    try {
      // Buscar instância com cliente e template
      const { data: instanceData, error } = await supabase
        .from("onboarding_instances")
        .select(`
          *,
          clients (id, name, company, email, phone),
          onboarding_templates (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setInstance(instanceData);
      setSchema(instanceData.onboarding_templates.schema as unknown as TemplateSchema);

      // Buscar respostas
      const { data: responsesData } = await supabase
        .from("onboarding_responses")
        .select("*")
        .eq("onboarding_instance_id", id);

      if (responsesData) {
        const responsesMap: Record<string, any> = {};
        responsesData.forEach((r) => {
          responsesMap[r.field_key] = r;
        });
        setResponses(responsesMap);
      }

      // Buscar arquivos
      const { data: attachmentsData } = await supabase
        .from("onboarding_attachments")
        .select("*")
        .eq("onboarding_instance_id", id);

      if (attachmentsData) {
        const attachmentsMap: Record<string, any> = {};
        attachmentsData.forEach((a) => {
          attachmentsMap[a.field_key] = a;
        });
        setAttachments(attachmentsMap);
      }

      // Buscar logs de auditoria
      const { data: logsData } = await supabase
        .from("onboarding_audit_log")
        .select("*, profiles:user_id(full_name)")
        .eq("onboarding_instance_id", id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (logsData) {
        setAuditLogs(logsData);
      }
    } catch (error) {
      console.error("Error fetching onboarding:", error);
      toast.error("Erro ao carregar onboarding");
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async (fieldKey: string) => {
    setDecryptingField(fieldKey);
    try {
      const { data, error } = await supabase.functions.invoke("onboarding-decrypt-sensitive", {
        body: {
          onboarding_instance_id: id,
          field_key: fieldKey,
        },
      });

      if (error) throw error;

      setDecryptedFields((prev) => ({
        ...prev,
        [fieldKey]: data.value,
      }));

      // Atualizar logs
      fetchOnboardingDetail();
    } catch (error: any) {
      console.error("Decrypt error:", error);
      toast.error(error.message || "Erro ao descriptografar");
    } finally {
      setDecryptingField(null);
    }
  };

  const handleHideDecrypted = (fieldKey: string) => {
    setDecryptedFields((prev) => {
      const newState = { ...prev };
      delete newState[fieldKey];
      return newState;
    });
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await supabase
        .from("onboarding_instances")
        .update({
          status: "Aprovado",
          approved_at: new Date().toISOString(),
          approved_by: user!.id,
        })
        .eq("id", id);

      toast.success("Onboarding aprovado com sucesso!");
      navigate("/admin/onboarding");
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Erro ao aprovar onboarding");
    } finally {
      setProcessing(false);
    }
  };

  const handleReopen = async () => {
    setProcessing(true);
    try {
      await supabase
        .from("onboarding_instances")
        .update({
          status: "Em Progresso",
          reopened_at: new Date().toISOString(),
          reopened_by: user!.id,
        })
        .eq("id", id);

      toast.success("Onboarding reaberto para edição");
      fetchOnboardingDetail();
    } catch (error) {
      console.error("Reopen error:", error);
      toast.error("Erro ao reabrir onboarding");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadFile = async (attachment: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("onboarding-files")
        .download(attachment.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const renderFieldValue = (field: FieldSchema) => {
    if (field.type === "file") {
      const attachment = attachments[field.key];
      if (!attachment) return <span className="text-muted-foreground">Não enviado</span>;
      
      return (
        <Button variant="outline" size="sm" onClick={() => handleDownloadFile(attachment)}>
          <Download className="h-4 w-4 mr-2" />
          {attachment.file_name}
        </Button>
      );
    }

    const response = responses[field.key];
    if (!response) return <span className="text-muted-foreground">Não preenchido</span>;

    if (field.sensitive) {
      const isDecrypted = decryptedFields[field.key] !== undefined;
      const isDecrypting = decryptingField === field.key;

      return (
        <div className="flex items-center gap-2">
          {isDecrypted ? (
            <>
              <code className="bg-muted px-2 py-1 rounded text-sm">{decryptedFields[field.key]}</code>
              <Button variant="ghost" size="sm" onClick={() => handleHideDecrypted(field.key)}>
                <EyeOff className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-muted-foreground">••••••••</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDecrypt(field.key)}
                disabled={isDecrypting}
              >
                {isDecrypting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      );
    }

    return <span>{response.value || "-"}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!instance || !schema) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Onboarding não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <Button variant="ghost" className="mb-4" onClick={() => navigate("/admin/onboarding")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>{instance.clients?.name}</CardTitle>
              <CardDescription>
                {instance.clients?.company || instance.clients?.email}
              </CardDescription>
            </div>
            <Badge
              variant={instance.status === "Aprovado" ? "default" : "secondary"}
              className="w-fit"
            >
              {instance.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {instance.status === "Concluído" && (
              <>
                <Button onClick={handleApprove} disabled={processing}>
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aprovar
                </Button>
                <Button variant="outline" onClick={handleReopen} disabled={processing}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reabrir para Edição
                </Button>
              </>
            )}
            {instance.status === "Aprovado" && (
              <Button variant="outline" onClick={handleReopen} disabled={processing}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reabrir para Edição
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      {schema.steps?.map((section) => (
        <Card key={section.key} className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{section.title}</CardTitle>
            {section.description && <CardDescription>{section.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {section.fields?.map((field) => (
                <div key={field.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="sm:w-1/3 font-medium text-sm flex items-center gap-2">
                    {field.label}
                    {field.sensitive && <Shield className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <div className="sm:w-2/3">{renderFieldValue(field)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Log de Auditoria
          </CardTitle>
          <CardDescription>
            Registro de visualizações de dados sensíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum registro</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">
                    {log.action}
                  </Badge>
                  <span className="text-muted-foreground">
                    {log.profiles?.full_name || "Sistema"} visualizou{" "}
                    <code className="bg-muted px-1 rounded">{log.field_key}</code>
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
