import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function ClientPackage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

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

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", profile.client_id)
        .single();

      const { data: servicesData } = await supabase
        .from("client_services")
        .select(`
          *,
          products(name, description)
        `)
        .eq("client_id", profile.client_id)
        .eq("is_active", true);

      setClient(clientData);
      setServices(servicesData || []);
    } catch (error) {
      console.error("Error fetching package data:", error);
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Meu Pacote</h1>

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
                {client?.start_date ? format(new Date(client.start_date), "dd/MM/yyyy") : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">{client?.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h2 className="text-xl font-bold">Serviços Contratados</h2>
        
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {service.products?.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {service.products?.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    R$ {Number(service.negotiated_price).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">por unidade</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SLA</p>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {service.sla_days} dias úteis
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className={service.is_active ? "text-green-600" : "text-red-600"}>
                    {service.is_active ? "Ativo" : "Inativo"}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Utilização mensal</span>
                  <span className="font-medium">0 / ∞</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}

        {services.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum serviço contratado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
