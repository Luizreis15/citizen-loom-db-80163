import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Calendar, Check, DollarSign, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

interface ContractedService {
  id: string;
  valor_acordado: number;
  tipo_cobranca: string;
  is_plano_principal: boolean;
  data_inicio: string;
  data_fim: string | null;
  observacoes: string | null;
  service: {
    id: string;
    name: string;
    description: string | null;
    itens_inclusos: string[] | null;
    ordem_exibicao: number | null;
  };
}

interface Client {
  id: string;
  name: string;
  company: string | null;
  start_date: string | null;
  status: string;
}

interface ServiceCatalog {
  id: string;
  name: string;
  itens_inclusos: string[] | null;
  ordem_exibicao: number | null;
  eh_plano_principal: boolean;
}

export default function ClientPackage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [contractedServices, setContractedServices] = useState<ContractedService[]>([]);
  const [allPlans, setAllPlans] = useState<ServiceCatalog[]>([]);

  useEffect(() => {
    if (user) {
      fetchPackageData();
    }
  }, [user]);

  const fetchPackageData = async () => {
    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.client_id) return;

      // Fetch all plans for hierarchy expansion
      const { data: plansData } = await supabase
        .from("service_catalog")
        .select("id, name, itens_inclusos, ordem_exibicao, eh_plano_principal")
        .eq("eh_plano_principal", true)
        .order("ordem_exibicao", { ascending: true });

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", profile.client_id)
        .single();

      const { data: servicesData } = await supabase
        .from("client_contracted_services")
        .select(`
          *,
          service:service_catalog(id, name, description, itens_inclusos, ordem_exibicao)
        `)
        .eq("client_id", profile.client_id)
        .eq("is_active", true)
        .order("is_plano_principal", { ascending: false });

      setAllPlans(plansData || []);
      setClient(clientData);
      setContractedServices(servicesData || []);
    } catch (error) {
      console.error("Error fetching package data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get all included items, expanding lower-tier plans
  const getExpandedItensInclusos = (plano: ContractedService): string[] => {
    const currentOrdem = plano.service.ordem_exibicao || 0;
    const expandedItems: string[] = [];

    // Get items from all lower-tier plans first
    allPlans
      .filter(p => p.ordem_exibicao && p.ordem_exibicao < currentOrdem)
      .sort((a, b) => (a.ordem_exibicao || 0) - (b.ordem_exibicao || 0))
      .forEach(lowerPlan => {
        if (lowerPlan.itens_inclusos) {
          lowerPlan.itens_inclusos.forEach(item => {
            // Skip "Tudo do Plano X" items
            if (!item.startsWith("Tudo do Plano")) {
              expandedItems.push(item);
            }
          });
        }
      });

    // Add current plan items (excluding "Tudo do Plano X")
    if (plano.service.itens_inclusos) {
      plano.service.itens_inclusos.forEach(item => {
        if (!item.startsWith("Tudo do Plano")) {
          expandedItems.push(item);
        }
      });
    }

    // Remove duplicates
    return [...new Set(expandedItems)];
  };

  const planoAtual = contractedServices.find((s) => s.is_plano_principal);
  const produtosAdicionais = contractedServices.filter((s) => !s.is_plano_principal);

  const totalMensal = contractedServices
    .filter((s) => s.tipo_cobranca === "mensal")
    .reduce((acc, s) => acc + (s.valor_acordado || 0), 0);

  const totalPontual = contractedServices
    .filter((s) => s.tipo_cobranca === "pontual")
    .reduce((acc, s) => acc + (s.valor_acordado || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meu Contrato</h1>

      {/* Informações do Contrato */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome do Cliente</p>
              <p className="text-lg font-semibold">{client?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Empresa</p>
              <p className="text-lg font-semibold">{client?.company || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
              <p className="text-lg font-semibold">
                {client?.start_date ? format(new Date(client.start_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={client?.status === "Ativo" ? "default" : "secondary"}>
                {client?.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plano Mensal */}
      {planoAtual && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Plano Mensal
              </CardTitle>
              <Badge variant="default" className="bg-green-600">
                Ativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{planoAtual.service.name}</h3>
                <p className="text-sm text-muted-foreground">{planoAtual.service.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  R$ {planoAtual.valor_acordado.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">/mês</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Desde: {format(new Date(planoAtual.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
            </div>

            {(() => {
              const expandedItems = getExpandedItensInclusos(planoAtual);
              return expandedItems.length > 0 ? (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">O que está incluso:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {expandedItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-green-600" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>
      )}

      {/* Produtos Adicionais */}
      {produtosAdicionais.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Produtos Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosAdicionais.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.service.name}</TableCell>
                      <TableCell>
                        <Badge variant={service.tipo_cobranca === "mensal" ? "default" : "secondary"}>
                          {service.tipo_cobranca === "mensal" ? "Mensal" : "Pontual"}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {service.valor_acordado.toFixed(2)}</TableCell>
                      <TableCell>
                        {format(new Date(service.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {service.observacoes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Financeiro */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <div className="p-2 rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Mensal</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {totalMensal.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <div className="p-2 rounded-full bg-muted">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serviços Pontuais</p>
                <p className="text-2xl font-bold">R$ {totalPontual.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sem serviços */}
      {contractedServices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum serviço contratado</p>
            <p className="text-muted-foreground">
              Entre em contato com a equipe para contratar um plano ou serviço.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
