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
import { ArrowLeft, CheckSquare, Plus, Kanban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TaskKanban } from "@/components/TaskKanban";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";

interface Project {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  client_id: string;
  clients: {
    name: string;
    company: string | null;
  };
}

interface Task {
  id: string;
  status: string;
  quantity: number;
  variant_description: string | null;
  frozen_price: number;
  due_date: string;
  created_at: string;
  products: {
    name: string;
  };
  profiles: {
    full_name: string;
  } | null;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchProjectAndTasks();
    }
  }, [user, id]);

  const fetchProjectAndTasks = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select(`
          *,
          clients(name, company)
        `)
        .eq("id", id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch tasks for this project
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          products(name),
          profiles(full_name)
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados do projeto");
      console.error("Error fetching project data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Backlog":
        return "secondary";
      case "Em produção":
        return "default";
      case "Revisão interna":
        return "outline";
      case "Enviado ao cliente":
        return "default";
      case "Ajustes":
        return "outline";
      case "Aprovado":
        return "default";
      case "Publicado":
        return "default";
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

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-lg font-medium mb-4">Projeto não encontrado</p>
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
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`/clients/${project.client_id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            Cliente: {project.clients.name}
          </p>
        </div>
        <Badge variant={getStatusVariant(project.status)}>
          {project.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Data de Início</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {format(new Date(project.start_date), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Data de Término</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {project.end_date
                ? format(new Date(project.end_date), "dd/MM/yyyy", {
                    locale: ptBR,
                  })
                : "Em andamento"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tasks.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="kanban" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        <TabsContent value="kanban" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma tarefa cadastrada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Comece adicionando uma tarefa para este projeto
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Tarefa
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TaskKanban projectId={id!} />
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Tarefas
                  </CardTitle>
                  <CardDescription>
                    {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhuma tarefa cadastrada</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comece adicionando uma tarefa para este projeto
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Tarefa
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p>{task.products.name}</p>
                              {task.variant_description && (
                                <p className="text-sm text-muted-foreground">
                                  {task.variant_description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(task.status)}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.profiles?.full_name || "-"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(task.due_date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>{task.quantity}</TableCell>
                          <TableCell>
                            R$ {task.frozen_price.toFixed(2)}
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
      </Tabs>

      {project && (
        <CreateTaskDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          projectId={project.id}
          clientId={project.client_id}
          onSuccess={fetchProjectAndTasks}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
