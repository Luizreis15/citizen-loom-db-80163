import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, Check, DollarSign, Calendar } from "lucide-react";

interface ServiceCatalog {
  id: string;
  name: string;
  description: string | null;
  tipo_servico: string;
  eh_plano_principal: boolean;
  preco_padrao: number | null;
  itens_inclusos: string[] | null;
  ordem_exibicao: number;
}

interface ContractedService {
  id?: string;
  service_id: string;
  valor_acordado: string;
  tipo_cobranca: "mensal" | "pontual";
  is_plano_principal: boolean;
  data_inicio: string;
  data_fim: string;
  observacoes: string;
  is_active: boolean;
  // For display
  service?: ServiceCatalog;
}

interface ClientContractedServicesSectionProps {
  clientId?: string;
  contractedServices: ContractedService[];
  setContractedServices: (services: ContractedService[]) => void;
  readOnly?: boolean;
}

export function ClientContractedServicesSection({
  clientId,
  contractedServices,
  setContractedServices,
  readOnly = false,
}: ClientContractedServicesSectionProps) {
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServiceCatalog();
    if (clientId) {
      fetchExistingServices();
    }
  }, [clientId]);

  const fetchServiceCatalog = async () => {
    try {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("is_active", true)
        .order("ordem_exibicao");

      if (error) throw error;
      setServiceCatalog(data || []);
    } catch (error) {
      console.error("Error fetching service catalog:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingServices = async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from("client_contracted_services")
        .select(`
          *,
          service:service_catalog(*)
        `)
        .eq("client_id", clientId)
        .eq("is_active", true);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapped = data.map((item: any) => ({
          id: item.id,
          service_id: item.service_id,
          valor_acordado: item.valor_acordado?.toString() || "",
          tipo_cobranca: item.tipo_cobranca,
          is_plano_principal: item.is_plano_principal,
          data_inicio: item.data_inicio || "",
          data_fim: item.data_fim || "",
          observacoes: item.observacoes || "",
          is_active: item.is_active,
          service: item.service,
        }));
        setContractedServices(mapped);
      }
    } catch (error) {
      console.error("Error fetching existing services:", error);
    }
  };

  const planos = serviceCatalog.filter((s) => s.eh_plano_principal);
  const produtosAdicionais = serviceCatalog.filter((s) => !s.eh_plano_principal);

  const planoAtual = contractedServices.find((s) => s.is_plano_principal);
  const servicesAdicionais = contractedServices.filter((s) => !s.is_plano_principal);

  const handleSelectPlano = (serviceId: string) => {
    if (serviceId === "none") {
      // Remove current plan
      setContractedServices(contractedServices.filter((s) => !s.is_plano_principal));
      return;
    }

    const plano = serviceCatalog.find((s) => s.id === serviceId);
    if (!plano) return;

    const newPlano: ContractedService = {
      service_id: serviceId,
      valor_acordado: plano.preco_padrao?.toString() || "",
      tipo_cobranca: "mensal",
      is_plano_principal: true,
      data_inicio: new Date().toISOString().split("T")[0],
      data_fim: "",
      observacoes: "",
      is_active: true,
      service: plano,
    };

    // Replace existing plan or add new one
    const filteredServices = contractedServices.filter((s) => !s.is_plano_principal);
    setContractedServices([newPlano, ...filteredServices]);
  };

  const handleAddProdutoAdicional = () => {
    const newService: ContractedService = {
      service_id: "",
      valor_acordado: "",
      tipo_cobranca: "pontual",
      is_plano_principal: false,
      data_inicio: new Date().toISOString().split("T")[0],
      data_fim: "",
      observacoes: "",
      is_active: true,
    };
    setContractedServices([...contractedServices, newService]);
  };

  const handleRemoveService = (index: number) => {
    const updated = [...contractedServices];
    updated.splice(index, 1);
    setContractedServices(updated);
  };

  const handleServiceChange = (index: number, field: keyof ContractedService, value: any) => {
    const updated = [...contractedServices];
    
    if (field === "service_id" && value) {
      const service = serviceCatalog.find((s) => s.id === value);
      if (service) {
        updated[index] = {
          ...updated[index],
          [field]: value,
          service,
          valor_acordado: updated[index].valor_acordado || service.preco_padrao?.toString() || "",
          tipo_cobranca: service.tipo_servico === "produto_pontual" ? "pontual" : 
                         service.tipo_servico === "produto_mensal" ? "mensal" : 
                         updated[index].tipo_cobranca,
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setContractedServices(updated);
  };

  // Calculate totals
  const totalMensal = contractedServices
    .filter((s) => s.tipo_cobranca === "mensal" && s.is_active && s.valor_acordado)
    .reduce((acc, s) => acc + (parseFloat(s.valor_acordado) || 0), 0);

  const totalPontual = contractedServices
    .filter((s) => s.tipo_cobranca === "pontual" && s.is_active && s.valor_acordado)
    .reduce((acc, s) => acc + (parseFloat(s.valor_acordado) || 0), 0);

  if (loading) {
    return <div className="text-muted-foreground p-4">Carregando catálogo de serviços...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Plano Mensal Principal */}
      <div className="space-y-4">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Plano Mensal Principal
        </Label>

        {!readOnly && (
          <Select
            value={planoAtual?.service_id || "none"}
            onValueChange={handleSelectPlano}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um plano mensal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum plano selecionado</SelectItem>
              {planos.map((plano) => (
                <SelectItem key={plano.id} value={plano.id}>
                  {plano.name}
                  {plano.preco_padrao && ` - R$ ${plano.preco_padrao.toFixed(2)}/mês`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {planoAtual && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{planoAtual.service?.name}</span>
                <Badge variant="default">Ativo</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">{planoAtual.service?.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {planoAtual.service?.itens_inclusos && planoAtual.service.itens_inclusos.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Inclui:</Label>
                  <ul className="mt-1 space-y-1">
                    {planoAtual.service.itens_inclusos.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                        <Check className="h-3 w-3 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Padrão</Label>
                  <p className="text-sm text-muted-foreground">
                    {planoAtual.service?.preco_padrao
                      ? `R$ ${planoAtual.service.preco_padrao.toFixed(2)}`
                      : "A definir"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plano-valor">Valor Acordado (R$)</Label>
                  <Input
                    id="plano-valor"
                    type="number"
                    step="0.01"
                    value={planoAtual.valor_acordado}
                    onChange={(e) => {
                      const idx = contractedServices.findIndex((s) => s.is_plano_principal);
                      if (idx >= 0) handleServiceChange(idx, "valor_acordado", e.target.value);
                    }}
                    placeholder="0.00"
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plano-inicio">Data de Início</Label>
                  <Input
                    id="plano-inicio"
                    type="date"
                    value={planoAtual.data_inicio}
                    onChange={(e) => {
                      const idx = contractedServices.findIndex((s) => s.is_plano_principal);
                      if (idx >= 0) handleServiceChange(idx, "data_inicio", e.target.value);
                    }}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!planoAtual && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-muted-foreground">
              Nenhum plano mensal selecionado
            </CardContent>
          </Card>
        )}
      </div>

      {/* Produtos Adicionais */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Produtos Adicionais</Label>
          {!readOnly && (
            <Button type="button" size="sm" onClick={handleAddProdutoAdicional}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Produto
            </Button>
          )}
        </div>

        {servicesAdicionais.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-muted-foreground">
              Nenhum produto adicional contratado
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {servicesAdicionais.map((service, idx) => {
              const actualIndex = contractedServices.findIndex(
                (s) => s === service || (s.id && s.id === service.id)
              );
              
              return (
                <Card key={idx}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="space-y-2 col-span-2 md:col-span-1">
                          <Label>Serviço</Label>
                          <Select
                            value={service.service_id}
                            onValueChange={(value) =>
                              handleServiceChange(actualIndex, "service_id", value)
                            }
                            disabled={readOnly}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um serviço" />
                            </SelectTrigger>
                            <SelectContent>
                              {produtosAdicionais.map((prod) => (
                                <SelectItem key={prod.id} value={prod.id}>
                                  {prod.name}
                                  {prod.preco_padrao && ` - R$ ${prod.preco_padrao.toFixed(2)}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Valor Acordado (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={service.valor_acordado}
                            onChange={(e) =>
                              handleServiceChange(actualIndex, "valor_acordado", e.target.value)
                            }
                            placeholder={service.service?.preco_padrao?.toString() || "0.00"}
                            disabled={readOnly}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tipo de Cobrança</Label>
                          <Select
                            value={service.tipo_cobranca}
                            onValueChange={(value) =>
                              handleServiceChange(actualIndex, "tipo_cobranca", value)
                            }
                            disabled={readOnly}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pontual">Pontual</SelectItem>
                              <SelectItem value="mensal">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Data de Início</Label>
                          <Input
                            type="date"
                            value={service.data_inicio}
                            onChange={(e) =>
                              handleServiceChange(actualIndex, "data_inicio", e.target.value)
                            }
                            disabled={readOnly}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Data de Término (opcional)</Label>
                          <Input
                            type="date"
                            value={service.data_fim}
                            onChange={(e) =>
                              handleServiceChange(actualIndex, "data_fim", e.target.value)
                            }
                            disabled={readOnly}
                          />
                        </div>

                        <div className="space-y-2 col-span-2">
                          <Label>Observações</Label>
                          <Textarea
                            value={service.observacoes}
                            onChange={(e) =>
                              handleServiceChange(actualIndex, "observacoes", e.target.value)
                            }
                            placeholder="Observações sobre o serviço..."
                            rows={2}
                            disabled={readOnly}
                          />
                        </div>
                      </div>

                      {!readOnly && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="ml-2"
                          onClick={() => handleRemoveService(actualIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Resumo Financeiro */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <div className="p-2 rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recorrente Mensal</p>
                <p className="text-xl font-bold text-primary">
                  R$ {totalMensal.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
              <div className="p-2 rounded-full bg-secondary/50">
                <Calendar className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serviços Pontuais</p>
                <p className="text-xl font-bold">R$ {totalPontual.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export type { ContractedService, ServiceCatalog };
