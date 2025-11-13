import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UserCog, UserPlus, Mail, Video, Palette, Share2, Briefcase, DollarSign, User, Shield, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreateCollaboratorDialog } from "@/components/CreateCollaboratorDialog";
import { isCollaboratorRole, isAdminRole, isClientRole } from "@/lib/roleUtils";

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
    setLoading(true);
    try {
      // Buscar profiles primeiro
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          created_at,
          client_id,
          clients!profiles_client_id_fkey (name)
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Para cada profile, buscar roles usando a RPC
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          const { data: rolesData, error: rolesError } = await supabase
            .rpc('get_user_roles', { _user_id: profile.id });

          if (rolesError) {
            console.error(`Error fetching roles for user ${profile.id}:`, rolesError);
            return {
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              created_at: profile.created_at,
              client_id: profile.client_id,
              clients: profile.clients,
              roles: []
            };
          }

          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            created_at: profile.created_at,
            client_id: profile.client_id,
            clients: profile.clients,
            roles: (rolesData || []).map((r: any) => ({ name: r.role_name }))
          };
        })
      );

      setUsers(usersWithRoles);
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

      toast.loading("Reenviando convite...");
      
      // Buscar role_ids baseado nos nomes das roles que o usuário já tem
      const roleNames = user?.roles.map(r => r.name) || [];
      
      if (roleNames.length === 0) {
        throw new Error("Usuário não possui roles atribuídas");
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id')
        .in('name', roleNames);

      if (rolesError) throw rolesError;

      const roleIds = rolesData?.map(r => r.id) || [];
      
      if (roleIds.length === 0) {
        throw new Error("Não foi possível encontrar os IDs das roles");
      }

      // Buscar client_id se houver
      const clientId = user?.client_id || undefined;

      // Chamar edge function para reenviar convite
      const { error } = await supabase.functions.invoke("send-welcome-collaborator", {
        body: {
          full_name: user?.full_name || '',
          email: email,
          role_ids: roleIds,
          client_id: clientId,
        },
      });

      if (error) throw error;

      toast.success(`Convite reenviado! ${user?.full_name} receberá um novo email de ativação.`);
    } catch (error: any) {
      console.error("Error resending welcome email:", error);
      toast.error(error.message || "Erro ao reenviar email");
    }
  };

  // Filtrar usuários por tipo
  const collaborators = users.filter(u => 
    u.roles.some(r => isCollaboratorRole(r.name))
  );
  const clients = users.filter(u => 
    u.roles.some(r => isClientRole(r.name))
  );
  const admins = users.filter(u => 
    u.roles.some(r => isAdminRole(r.name))
  );

  // Agrupar colaboradores por função
  const groupedCollaborators = {
    "Editor de Vídeo": {
      users: collaborators.filter(c => c.roles.some(r => r.name === "Editor de Vídeo")),
      icon: Video,
      color: "text-purple-500"
    },
    "Webdesigner": {
      users: collaborators.filter(c => c.roles.some(r => r.name === "Webdesigner")),
      icon: Palette,
      color: "text-pink-500"
    },
    "Social Mídia": {
      users: collaborators.filter(c => c.roles.some(r => r.name === "Social Mídia")),
      icon: Share2,
      color: "text-blue-500"
    },
    "Administrativo": {
      users: collaborators.filter(c => c.roles.some(r => r.name === "Administrativo")),
      icon: Briefcase,
      color: "text-orange-500"
    },
    "Finance": {
      users: collaborators.filter(c => c.roles.some(r => r.name === "Finance")),
      icon: DollarSign,
      color: "text-green-500"
    },
    "Colaborador": {
      users: collaborators.filter(c => c.roles.some(r => r.name === "Colaborador")),
      icon: User,
      color: "text-gray-500"
    }
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName === "Owner") return <Crown className="h-4 w-4 text-yellow-500" />;
    if (roleName === "Admin") return <Shield className="h-4 w-4 text-blue-500" />;
    return null;
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

      <Tabs defaultValue="collaborators" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collaborators">
            Colaboradores ({collaborators.length})
          </TabsTrigger>
          <TabsTrigger value="clients">
            Clientes ({clients.length})
          </TabsTrigger>
          <TabsTrigger value="admins">
            Administradores ({admins.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA COLABORADORES */}
        <TabsContent value="collaborators">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Colaboradores por Função
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : collaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum colaborador encontrado.</p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {Object.entries(groupedCollaborators).map(([role, { users: roleUsers, icon: Icon, color }]) => {
                    if (roleUsers.length === 0) return null;
                    
                    return (
                      <AccordionItem key={role} value={role}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${color}`} />
                            <span className="font-medium">{role}</span>
                            <Badge variant="secondary">{roleUsers.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Criado em</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {roleUsers.map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">{user.full_name}</TableCell>
                                  <TableCell>{user.email}</TableCell>
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
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA CLIENTES */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">
                      💡 Clientes são gerenciados na aba <strong>Clientes</strong>
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cliente Vinculado</TableHead>
                        <TableHead>Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA ADMINISTRADORES */}
        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Administradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : admins.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum administrador encontrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {user.roles.map((role, idx) => (
                              <Badge 
                                key={idx} 
                                variant={role.name === "Owner" ? "default" : "secondary"}
                                className="flex items-center gap-1"
                              >
                                {getRoleIcon(role.name)}
                                {role.name}
                              </Badge>
                            ))}
                          </div>
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
        </TabsContent>
      </Tabs>

      <CreateCollaboratorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default Usuarios;
