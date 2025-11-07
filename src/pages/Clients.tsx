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
import { Plus, Users, MoreVertical, Edit, Archive, Trash2, Mail, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  start_date: string | null;
  status: string;
  client_services: { is_active: boolean }[];
}

const Clients = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

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
          start_date,
          status,
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


  const getStatusVariant = (status: string) => {
    if (status === "Ativo") return "default";
    if (status === "Pendente") return "secondary";
    return "outline"; // Inativo
  };

  const getStatusLabel = (status: string) => {
    if (status === "Ativo") return "Ativo";
    if (status === "Pendente") return "Pendente";
    return "Inativo";
  };

  const handleEditClient = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleArchiveClient = async (clientId: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus = currentStatus === "Ativo" ? "Inativo" : "Ativo";
      const { error } = await supabase
        .from("clients")
        .update({ status: newStatus })
        .eq("id", clientId);

      if (error) throw error;

      toast.success(`Cliente ${newStatus === "Ativo" ? "ativado" : "arquivado"} com sucesso!`);
      fetchClients();
    } catch (error: any) {
      toast.error("Erro ao atualizar status do cliente");
      console.error("Error updating client status:", error);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientToDelete);

      if (error) throw error;

      toast.success("Cliente excluído com sucesso!");
      fetchClients();
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    } catch (error: any) {
      toast.error("Erro ao excluir cliente");
      console.error("Error deleting client:", error);
    }
  };

  const handleResendWelcomeEmail = async (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!client.email) {
      toast.error("Cliente não possui e-mail cadastrado");
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("send-welcome-client", {
        body: {
          client_id: client.id,
          client_name: client.name,
          client_email: client.email,
        },
      });

      if (error) throw error;

      toast.success("E-mail de boas-vindas reenviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar e-mail");
      console.error("Error sending welcome email:", error);
    }
  };

  const openDeleteDialog = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToDelete(clientId);
    setDeleteDialogOpen(true);
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
                    <TableHead className="w-[80px]">Ações</TableHead>
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
                        <Badge variant={getStatusVariant(client.status)}>
                          {getStatusLabel(client.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.start_date 
                          ? format(new Date(client.start_date), "dd/MM/yyyy", { locale: ptBR })
                          : format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })
                        }
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => handleEditClient(client, e)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/client-portal/tasks?client_id=${client.id}`);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver como Cliente
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => handleArchiveClient(client.id, client.status, e)}>
                              <Archive className="mr-2 h-4 w-4" />
                              {client.status === "Ativo" ? "Arquivar" : "Ativar"}
                            </DropdownMenuItem>
                            {client.email && (
                              <DropdownMenuItem onClick={(e) => handleResendWelcomeEmail(client, e)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Reenviar boas-vindas
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => openDeleteDialog(client.id, e)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedClient(null);
        }}
        onSuccess={fetchClients}
        client={selectedClient}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
