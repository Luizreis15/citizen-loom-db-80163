import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { ArrowLeft, FolderKanban, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchClientAndProjects();
    }
  }, [user, id]);

  const fetchClientAndProjects = async () => {
    try {
      setLoading(true);
      
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch projects for this client
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados do cliente");
      console.error("Error fetching client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Ativo":
        return "default";
      case "Concluído":
        return "secondary";
      case "Pausado":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-lg font-medium mb-4">Cliente não encontrado</p>
        <Button onClick={() => navigate("/clients")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Clientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          <p className="text-muted-foreground">
            {client.company || "Detalhes do cliente"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.email && (
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
            )}
            {client.phone && (
              <div>
                <p className="text-sm font-medium">Telefone</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
            )}
            {client.company && (
              <div>
                <p className="text-sm font-medium">Empresa</p>
                <p className="text-sm text-muted-foreground">{client.company}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Projetos
              </CardTitle>
              <CardDescription>
                {projects.length} {projects.length === 1 ? "projeto" : "projetos"}
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum projeto cadastrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Comece adicionando um projeto para este cliente
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Projeto
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Projeto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data de Término</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(project.start_date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        {project.end_date
                          ? format(new Date(project.end_date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDetail;
