import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TaskKanban } from "@/components/TaskKanban";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Project {
  id: string;
  name: string;
}

const CollaboratorTasks = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchMyProjects();
      fetchMyTasks();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMyTasks();
    }
  }, [selectedProject, user]);

  const fetchMyProjects = async () => {
    try {
      // We need to fetch projects that have tasks assigned to this user
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("project_id")
        .eq("assignee_id", user?.id || "")
        .not("project_id", "is", null);

      if (!tasksData || tasksData.length === 0) {
        setProjects([]);
        return;
      }

      const projectIds = [...new Set(tasksData.map((t) => t.project_id).filter(Boolean))];

      if (projectIds.length === 0) {
        setProjects([]);
        return;
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name")
        .in("id", projectIds)
        .order("name");

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);
    } catch (error: any) {
      console.error("Erro ao carregar projetos:", error);
    }
  };

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("tasks")
        .select(`
          *,
          projects (
            id,
            name,
            clients (
              id,
              name
            )
          ),
          client_requests (
            title,
            clients (
              id,
              name
            )
          ),
          products (
            id,
            name
          )
        `)
        .eq("assignee_id", user?.id || "");

      if (selectedProject !== "all") {
        query = query.eq("project_id", selectedProject);
      }

      const { data, error } = await query.order("due_date", { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar tarefas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async () => {
    await fetchMyTasks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Carregando tarefas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minhas Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie as tarefas atribuídas a você
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Todos os projetos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <TaskKanban 
        tasks={tasks} 
        onTaskUpdate={handleTaskUpdate}
        isCollaboratorView={true}
      />
    </div>
  );
};

export default CollaboratorTasks;
