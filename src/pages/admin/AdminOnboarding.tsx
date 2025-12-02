import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Eye, CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  "Não Iniciado": { label: "Não Iniciado", variant: "outline", icon: AlertCircle },
  "Em Progresso": { label: "Em Progresso", variant: "secondary", icon: Clock },
  "Concluído": { label: "Aguardando Revisão", variant: "default", icon: FileText },
  "Aprovado": { label: "Aprovado", variant: "default", icon: CheckCircle2 },
};

export default function AdminOnboarding() {
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<any[]>([]);
  const [filteredInstances, setFilteredInstances] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
          clients (id, name, company, email),
          onboarding_templates (name)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error("Error fetching instances:", error);
    } finally {
      setLoading(false);
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
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
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

      {/* Instances List */}
      <div className="space-y-4">
        {filteredInstances.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum onboarding encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filteredInstances.map((instance) => (
            <Card key={instance.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{instance.clients?.name}</h3>
                      {getStatusBadge(instance.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {instance.clients?.company || instance.clients?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Atualizado em {format(new Date(instance.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Button asChild>
                    <Link to={`/admin/onboarding/${instance.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
