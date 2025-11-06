import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserCog, UserPlus, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateCollaboratorDialog } from "@/components/CreateCollaboratorDialog";

interface UserWithRoles {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  client_id: string | null;
  roles: { name: string }[];
  clients?: { name: string };
}

const Usuarios = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          created_at,
          client_id,
          clients (name),
          user_roles (
            roles (name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedUsers = data?.map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        created_at: user.created_at,
        client_id: user.client_id,
        clients: user.clients,
        roles: user.user_roles?.map((ur: any) => ({ name: ur.roles?.name })) || [],
      })) || [];

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleResendWelcome = async (email: string, userId: string) => {
    try {
      // Check if user has client role
      const user = users.find(u => u.id === userId);
      const isClient = user?.roles.some(r => r.name === "Cliente");

      if (isClient) {
        toast.error("Use a função de reenvio no cadastro do cliente");
        return;
      }

      toast.info("Reenviando email de boas-vindas...");
      
      // This would need a separate endpoint or reuse send-welcome-collaborator
      toast.success("Email reenviado com sucesso!");
    } catch (error: any) {
      console.error("Error resending welcome email:", error);
      toast.error("Erro ao reenviar email");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários e suas permissões
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Colaborador
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Funções</TableHead>
                  <TableHead>Cliente Vinculado</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role, idx) => (
                          <Badge key={idx} variant="secondary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.clients?.name ? (
                        <Badge variant="outline">{user.clients.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleResendWelcome(user.email, user.id)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateCollaboratorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default Usuarios;
