import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ClientContractedServicesSection, ContractedService } from "./ClientContractedServicesSection";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional(),
  company: z.string().trim().max(100).optional(),
});

interface Product {
  id: number;
  name: string;
  description: string | null;
}

interface ClientService {
  product_id: number;
  negotiated_price: string;
  sla_days: string;
  is_active: boolean;
}

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
}

interface Typography {
  heading: string;
  body: string;
}

interface BrandIdentity {
  color_palette: ColorPalette;
  typography: Typography;
  tone_of_voice: string;
  references_links: string[];
  rules_and_observations: string;
}

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    start_date: string | null;
    status: string;
  } | null;
}

export function ClientFormDialog({ open, onOpenChange, onSuccess, client }: ClientFormDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Tab 1: Client Data
  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    start_date: "",
    status: "Pendente",
    client_type: "",
  });
  
  // Tab 2: Brand Identity
  const [brandIdentity, setBrandIdentity] = useState<BrandIdentity>({
    color_palette: { primary: "#000000", secondary: "#ffffff", accent: "#888888" },
    typography: { heading: "", body: "" },
    tone_of_voice: "",
    references_links: [""],
    rules_and_observations: "",
  });
  
  // Tab 3: Client Services (legacy)
  const [clientServices, setClientServices] = useState<ClientService[]>([]);
  
  // Tab 4: Contracted Services (new)
  const [contractedServices, setContractedServices] = useState<ContractedService[]>([]);
  
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchProducts();
      if (client) {
        // Load client data for editing
        setClientData({
          name: client.name,
          email: client.email || "",
          phone: client.phone || "",
          company: client.company || "",
          start_date: client.start_date || "",
          status: client.status,
          client_type: "",
        });
        // Fetch client_type from database
        supabase.from("clients").select("client_type").eq("id", client.id).single().then(({ data }) => {
          if (data?.client_type) {
            setClientData(prev => ({ ...prev, client_type: data.client_type || "" }));
          }
        });
        setSendWelcomeEmail(false); // Don't send email when editing
      } else {
        resetForm();
      }
    }
  }, [open, client]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleAddService = () => {
    setClientServices([
      ...clientServices,
      { product_id: 0, negotiated_price: "", sla_days: "", is_active: true },
    ]);
  };

  const handleRemoveService = (index: number) => {
    setClientServices(clientServices.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: keyof ClientService, value: any) => {
    const updated = [...clientServices];
    updated[index] = { ...updated[index], [field]: value };
    setClientServices(updated);
  };

  const handleAddReferenceLink = () => {
    setBrandIdentity({
      ...brandIdentity,
      references_links: [...brandIdentity.references_links, ""],
    });
  };

  const handleRemoveReferenceLink = (index: number) => {
    setBrandIdentity({
      ...brandIdentity,
      references_links: brandIdentity.references_links.filter((_, i) => i !== index),
    });
  };

  const handleReferenceLinkChange = (index: number, value: string) => {
    const updated = [...brandIdentity.references_links];
    updated[index] = value;
    setBrandIdentity({ ...brandIdentity, references_links: updated });
  };

  const handleSubmit = async () => {
    setErrors({});
    
    try {
      // Validate client data
      const validated = clientSchema.parse(clientData);
      setLoading(true);

      let clientId: string;

      if (client) {
        // Update existing client
        const { error: clientError } = await supabase
          .from("clients")
          .update({
            name: validated.name,
            email: validated.email || null,
            phone: clientData.phone || null,
            company: clientData.company || null,
            start_date: clientData.start_date || null,
            status: clientData.status,
            client_type: clientData.client_type || null,
          })
          .eq("id", client.id);

        if (clientError) throw clientError;
        clientId = client.id;
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert([{
            name: validated.name,
            email: validated.email || null,
            phone: clientData.phone || null,
            company: clientData.company || null,
            start_date: clientData.start_date || null,
            status: clientData.status,
            client_type: clientData.client_type || null,
            user_id: user?.id,
          }])
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      }

      // 2. Create brand identity if any field is filled
      const hasBrandIdentity =
        brandIdentity.tone_of_voice ||
        brandIdentity.typography.heading ||
        brandIdentity.typography.body ||
        brandIdentity.rules_and_observations ||
        brandIdentity.references_links.some((link) => link.trim());

      if (hasBrandIdentity && !client) {
        const { error: brandError } = await supabase
          .from("brand_identities")
          .insert([{
            client_id: clientId,
            color_palette: brandIdentity.color_palette as any,
            typography: brandIdentity.typography as any,
            tone_of_voice: brandIdentity.tone_of_voice || null,
            references_links: brandIdentity.references_links.filter((link) => link.trim()),
            rules_and_observations: brandIdentity.rules_and_observations || null,
          }]);

        if (brandError) throw brandError;
      }

      // 3. Create client services (legacy)
      const validServices = clientServices.filter(
        (service) =>
          service.product_id > 0 &&
          service.negotiated_price &&
          service.sla_days
      );

      if (validServices.length > 0) {
        const servicesToInsert = validServices.map((service) => ({
          client_id: clientId,
          product_id: service.product_id,
          negotiated_price: parseFloat(service.negotiated_price).toString(),
          sla_days: parseInt(service.sla_days),
          is_active: service.is_active,
        }));

        const { error: servicesError } = await supabase
          .from("client_services")
          .insert(servicesToInsert as any);

        if (servicesError) throw servicesError;
      }

      // 4. Create contracted services (new)
      const validContractedServices = contractedServices.filter(
        (service) => service.service_id && service.valor_acordado && service.data_inicio
      );

      if (validContractedServices.length > 0) {
        // First, delete existing contracted services if editing
        if (client) {
          await supabase
            .from("client_contracted_services")
            .delete()
            .eq("client_id", clientId);
        }

        const contractedToInsert = validContractedServices.map((service) => ({
          client_id: clientId,
          service_id: service.service_id,
          valor_acordado: parseFloat(service.valor_acordado),
          tipo_cobranca: service.tipo_cobranca,
          is_plano_principal: service.is_plano_principal,
          data_inicio: service.data_inicio,
          data_fim: service.data_fim || null,
          observacoes: service.observacoes || null,
          is_active: true,
        }));

        const { error: contractedError } = await supabase
          .from("client_contracted_services")
          .insert(contractedToInsert as any);

        if (contractedError) throw contractedError;
      }

      // Send welcome email if checkbox is marked and email is provided
      if (sendWelcomeEmail && validated.email && !client) {
        try {
          await supabase.functions.invoke("send-welcome-client", {
            body: {
              client_id: clientId,
              client_name: validated.name,
              client_email: validated.email,
            },
          });
          console.log("Welcome email sent to client");
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Don't fail the whole operation if email fails
        }
      }

      toast.success(client ? "Cliente atualizado com sucesso!" : "Cliente criado com sucesso!");
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error.message || "Erro ao criar cliente");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientData({ name: "", email: "", phone: "", company: "", start_date: "", status: "Pendente", client_type: "" });
    setBrandIdentity({
      color_palette: { primary: "#000000", secondary: "#ffffff", accent: "#888888" },
      typography: { heading: "", body: "" },
      tone_of_voice: "",
      references_links: [""],
      rules_and_observations: "",
    });
    setClientServices([]);
    setContractedServices([]);
    setSendWelcomeEmail(true);
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {client ? "Atualize as informações do cliente" : "Preencha as informações do cliente em cada aba"}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="data">Dados</TabsTrigger>
            <TabsTrigger value="brand">Identidade</TabsTrigger>
            <TabsTrigger value="contracted">Serviços</TabsTrigger>
            <TabsTrigger value="services">Produtos Avulsos</TabsTrigger>
          </TabsList>

          {/* Tab 1: Client Data */}
          <TabsContent value="data" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={clientData.name}
                onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                placeholder="Nome do cliente"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={clientData.email}
                onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={clientData.phone}
                onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={clientData.company}
                onChange={(e) => setClientData({ ...clientData, company: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={clientData.start_date}
                onChange={(e) => setClientData({ ...clientData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={clientData.status}
                onValueChange={(value) => setClientData({ ...clientData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_type">Tipo de Cliente *</Label>
              <Select
                value={clientData.client_type}
                onValueChange={(value) => setClientData({ ...clientData, client_type: value })}
              >
                <SelectTrigger id="client_type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completo">Completo</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                  <SelectItem value="Gestao_Trafego">Gestão de Tráfego</SelectItem>
                  <SelectItem value="Negocio_Local">Negócio Local</SelectItem>
                  <SelectItem value="Social_Media">Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Tab 2: Brand Identity */}
          <TabsContent value="brand" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Paleta de Cores</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="color-primary">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-primary"
                        type="color"
                        value={brandIdentity.color_palette.primary}
                        onChange={(e) =>
                          setBrandIdentity({
                            ...brandIdentity,
                            color_palette: { ...brandIdentity.color_palette, primary: e.target.value },
                          })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={brandIdentity.color_palette.primary}
                        onChange={(e) =>
                          setBrandIdentity({
                            ...brandIdentity,
                            color_palette: { ...brandIdentity.color_palette, primary: e.target.value },
                          })
                        }
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-secondary">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-secondary"
                        type="color"
                        value={brandIdentity.color_palette.secondary}
                        onChange={(e) =>
                          setBrandIdentity({
                            ...brandIdentity,
                            color_palette: { ...brandIdentity.color_palette, secondary: e.target.value },
                          })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={brandIdentity.color_palette.secondary}
                        onChange={(e) =>
                          setBrandIdentity({
                            ...brandIdentity,
                            color_palette: { ...brandIdentity.color_palette, secondary: e.target.value },
                          })
                        }
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color-accent">Cor de Destaque</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color-accent"
                        type="color"
                        value={brandIdentity.color_palette.accent}
                        onChange={(e) =>
                          setBrandIdentity({
                            ...brandIdentity,
                            color_palette: { ...brandIdentity.color_palette, accent: e.target.value },
                          })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        value={brandIdentity.color_palette.accent}
                        onChange={(e) =>
                          setBrandIdentity({
                            ...brandIdentity,
                            color_palette: { ...brandIdentity.color_palette, accent: e.target.value },
                          })
                        }
                        placeholder="#888888"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="typography-heading">Fonte para Títulos</Label>
                  <Input
                    id="typography-heading"
                    value={brandIdentity.typography.heading}
                    onChange={(e) =>
                      setBrandIdentity({
                        ...brandIdentity,
                        typography: { ...brandIdentity.typography, heading: e.target.value },
                      })
                    }
                    placeholder="ex: Montserrat, Arial"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typography-body">Fonte para Corpo</Label>
                  <Input
                    id="typography-body"
                    value={brandIdentity.typography.body}
                    onChange={(e) =>
                      setBrandIdentity({
                        ...brandIdentity,
                        typography: { ...brandIdentity.typography, body: e.target.value },
                      })
                    }
                    placeholder="ex: Open Sans, Helvetica"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tom de Voz</Label>
                <Textarea
                  id="tone"
                  value={brandIdentity.tone_of_voice}
                  onChange={(e) => setBrandIdentity({ ...brandIdentity, tone_of_voice: e.target.value })}
                  placeholder="Descreva o tom de voz da marca (ex: formal, descontraído, técnico...)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Links de Referência</Label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddReferenceLink}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Link
                  </Button>
                </div>
                {brandIdentity.references_links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(e) => handleReferenceLinkChange(index, e.target.value)}
                      placeholder="https://exemplo.com"
                    />
                    {brandIdentity.references_links.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveReferenceLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Regras e Observações</Label>
                <Textarea
                  id="rules"
                  value={brandIdentity.rules_and_observations}
                  onChange={(e) =>
                    setBrandIdentity({ ...brandIdentity, rules_and_observations: e.target.value })
                  }
                  placeholder="Diretrizes, regras de uso da marca, observações importantes..."
                  rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
                  <input
                    type="checkbox"
                    id="send-welcome-email"
                    checked={sendWelcomeEmail}
                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="send-welcome-email" className="text-sm font-medium cursor-pointer">
                    Enviar email de boas-vindas com link de acesso ao portal
                  </label>
                </div>
              </div>
            </TabsContent>

          {/* Tab 3: Contracted Services (new) */}
          <TabsContent value="contracted" className="space-y-4">
            <ClientContractedServicesSection
              clientId={client?.id}
              contractedServices={contractedServices}
              setContractedServices={setContractedServices}
            />
          </TabsContent>

          {/* Tab 4: Client Services (legacy - produtos avulsos) */}
          <TabsContent value="services" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Produtos Avulsos (Sistema Antigo)</Label>
              <Button type="button" size="sm" onClick={handleAddService}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Serviço
              </Button>
            </div>

            {clientServices.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum serviço adicionado. Clique em "Adicionar Serviço" para começar.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {clientServices.map((service, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <Label className="text-base">Serviço {index + 1}</Label>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveService(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label>Produto/Serviço</Label>
                          <Select
                            value={service.product_id.toString()}
                            onValueChange={(value) =>
                              handleServiceChange(index, "product_id", parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Preço Negociado (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={service.negotiated_price}
                            onChange={(e) =>
                              handleServiceChange(index, "negotiated_price", e.target.value)
                            }
                            placeholder="0.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>SLA (dias úteis)</Label>
                          <Input
                            type="number"
                            value={service.sla_days}
                            onChange={(e) => handleServiceChange(index, "sla_days", e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div className="flex items-center space-x-2 col-span-2">
                          <Switch
                            checked={service.is_active}
                            onCheckedChange={(checked) =>
                              handleServiceChange(index, "is_active", checked)
                            }
                          />
                          <Label>Serviço Ativo</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : (client ? "Salvar" : "Criar Cliente")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
