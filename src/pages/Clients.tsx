import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Users } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClientFormDialog } from "@/components/ClientFormDialog";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
  client_services: { is_active: boolean }[];
}

const Clients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("clients")
        .select(`
          id,
          name,
          email,
          phone,
          company,
          created_at,
          client_services(is_active)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setClients(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar clientes");
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const getClientStatus = (client: Client) => {
    const hasActiveServices = client.client_services?.some((service) => service.is_active);
    return hasActiveServices ? "Ativo" : "Inativo";
  };

  const getStatusVariant = (status: string) => {
    return status === "Ativo" ? "default" : "secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e suas informações
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Clientes
          </CardTitle>
          <CardDescription>
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"} cadastrado
            {clients.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum cliente cadastrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comece adicionando seu primeiro cliente
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Início</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow 
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <p>{client.name}</p>
                          {client.company && (
                            <p className="text-sm text-muted-foreground">
                              {client.company}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(getClientStatus(client))}>
                          {getClientStatus(client)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(client.created_at), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchClients}
      />
    </div>
  );
};

export default Clients;
