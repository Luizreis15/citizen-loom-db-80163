import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Search, Eye, CheckCircle2, Clock, AlertCircle, FileText, MoreHorizontal, RotateCcw, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; color: string }> = {
  "Não Iniciado": { label: "Não Iniciado", variant: "outline", icon: AlertCircle, color: "text-muted-foreground" },
  "Em Progresso": { label: "Em Progresso", variant: "secondary", icon: Clock, color: "text-yellow-600" },
  "Concluído": { label: "Aguardando Revisão", variant: "default", icon: FileText, color: "text-blue-600" },
  "Aprovado": { label: "Aprovado", variant: "default", icon: CheckCircle2, color: "text-green-600" },
};

export default function AdminOnboarding() {
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<any[]>([]);
  const [filteredInstances, setFilteredInstances] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchInstances();
  }, []);

  useEffect(() => {
    filterInstances();
  }, [instances, searchTerm, statusFilter]);

  const fetchInstances = async () => {
    try {
      const { data, error } = await supabase
        .from("onboarding_instances")
        .select(`
          *,
          clients (id, name, company, email, client_type),
          onboarding_templates (name, schema)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setInstances(data || []);

      // Calculate progress for each instance
      if (data) {
        const progressData: Record<string, number> = {};
        for (const instance of data) {
          progressData[instance.id] = await calculateProgress(instance);
        }
        setProgressMap(progressData);
      }
    } catch (error) {
      console.error("Error fetching instances:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = async (instance: any) => {
    try {
      const { data: responses } = await supabase
        .from("onboarding_responses")
        .select("field_key, value")
        .eq("onboarding_instance_id", instance.id);

      if (!responses || !instance.onboarding_templates?.schema) return 0;

      const schema = instance.onboarding_templates.schema as any;
      const sections = schema.sections || [];
      let totalFields = 0;
      let filledFields = 0;

      sections.forEach((section: any) => {
        const fields = section.fields || [];
        fields.forEach((field: any) => {
          totalFields++;
          const response = responses.find((r) => r.field_key === field.key);
          if (response?.value && response.value.trim() !== "") {
            filledFields++;
          }
        });
      });

      return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
    } catch {
      return 0;
    }
  };

  const filterInstances = () => {
    let filtered = [...instances];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.clients?.name?.toLowerCase().includes(term) ||
          i.clients?.company?.toLowerCase().includes(term) ||
          i.clients?.email?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    setFilteredInstances(filtered);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig["Não Iniciado"];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 whitespace-nowrap">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleApprove = async (instanceId: string) => {
    try {
      const { error } = await supabase
        .from("onboarding_instances")
        .update({
          status: "Aprovado",
          approved_at: new Date().toISOString(),
        })
        .eq("id", instanceId);

      if (error) throw error;
      toast.success("Onboarding aprovado com sucesso!");
      fetchInstances();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Erro ao aprovar onboarding");
    }
  };

  const handleReopen = async (instanceId: string) => {
    try {
      const { error } = await supabase
        .from("onboarding_instances")
        .update({
          status: "Em Progresso",
          reopened_at: new Date().toISOString(),
        })
        .eq("id", instanceId);

      if (error) throw error;
      toast.success("Onboarding reaberto para ajustes");
      fetchInstances();
    } catch (error) {
      console.error("Error reopening:", error);
      toast.error("Erro ao reabrir onboarding");
    }
  };

  const handleSendReminder = async (instance: any) => {
    toast.info(`Lembrete enviado para ${instance.clients?.email}`);
    // TODO: Implementar edge function para enviar email de lembrete
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Onboarding de Clientes</h1>
        <p className="text-muted-foreground">
          Gerencie o onboarding dos clientes e revise informações enviadas
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Não Iniciado">Não Iniciado</SelectItem>
            <SelectItem value="Em Progresso">Em Progresso</SelectItem>
            <SelectItem value="Concluído">Aguardando Revisão</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {instances.filter((i) => i.status === "Concluído").length}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando Revisão</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {instances.filter((i) => i.status === "Em Progresso").length}
            </div>
            <p className="text-xs text-muted-foreground">Em Progresso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {instances.filter((i) => i.status === "Aprovado").length}
            </div>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{instances.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Instances Table */}
      <Card>
        <CardContent className="p-0">
          {filteredInstances.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum onboarding encontrado</p>
            </div>
          ) : (
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[150px]">Progresso</TableHead>
                    <TableHead>Atualizado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstances.map((instance) => {
                    const progress = progressMap[instance.id] || 0;
                    const canApprove = instance.status === "Concluído";
                    const canReopen = instance.status === "Aprovado" || instance.status === "Concluído";
                    const canRemind = instance.status === "Não Iniciado" || instance.status === "Em Progresso";

                    return (
                      <TableRow key={instance.id}>
                        <TableCell className="font-medium">
                          {instance.clients?.name || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {instance.clients?.company || instance.clients?.email || "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(instance.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-9">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(instance.updated_at), "dd/MM HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={`/admin/onboarding/${instance.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Visualizar</TooltipContent>
                            </Tooltip>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canApprove && (
                                  <DropdownMenuItem onClick={() => handleApprove(instance.id)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                    Aprovar
                                  </DropdownMenuItem>
                                )}
                                {canReopen && (
                                  <DropdownMenuItem onClick={() => handleReopen(instance.id)}>
                                    <RotateCcw className="h-4 w-4 mr-2 text-yellow-600" />
                                    Reabrir para Ajustes
                                  </DropdownMenuItem>
                                )}
                                {canRemind && (
                                  <DropdownMenuItem onClick={() => handleSendReminder(instance)}>
                                    <Mail className="h-4 w-4 mr-2 text-blue-600" />
                                    Enviar Lembrete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
