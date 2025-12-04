import { useState, useEffect } from "react";
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
import { Package, Check, DollarSign, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";

interface ContractedServiceView {
  id: string;
  service_id: string;
  valor_acordado: number;
  tipo_cobranca: string;
  is_plano_principal: boolean;
  data_inicio: string;
  data_fim: string | null;
  observacoes: string | null;
  is_active: boolean;
  service: {
    id: string;
    name: string;
    description: string | null;
    tipo_servico: string;
    itens_inclusos: string[] | null;
  };
}

interface ClientContractedServicesViewProps {
  clientId: string;
}

export function ClientContractedServicesView({ clientId }: ClientContractedServicesViewProps) {
  const [services, setServices] = useState<ContractedServiceView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, [clientId]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("client_contracted_services")
        .select(`
          *,
          service:service_catalog(*)
        `)
        .eq("client_id", clientId)
        .eq("is_active", true)
        .order("is_plano_principal", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching contracted services:", error);
    } finally {
      setLoading(false);
    }
  };

  const planoAtual = services.find((s) => s.is_plano_principal);
  const produtosAdicionais = services.filter((s) => !s.is_plano_principal);

  const totalMensal = services
    .filter((s) => s.tipo_cobranca === "mensal")
    .reduce((acc, s) => acc + (s.valor_acordado || 0), 0);

  const totalPontual = services
    .filter((s) => s.tipo_cobranca === "pontual")
    .reduce((acc, s) => acc + (s.valor_acordado || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando serviços contratados...
        </CardContent>
      </Card>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum serviço contratado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plano Mensal */}
      {planoAtual && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
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

            {planoAtual.service.itens_inclusos && planoAtual.service.itens_inclusos.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Inclui:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {planoAtual.service.itens_inclusos.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3 w-3 text-green-600" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Produtos Adicionais */}
      {produtosAdicionais.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
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
                    <TableHead>Término</TableHead>
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
                      <TableCell>
                        {service.data_fim
                          ? format(new Date(service.data_fim), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
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

      {/* Totais */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Totais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-background border">
              <div className="p-2 rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recorrente Mensal</p>
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
    </div>
  );
}
