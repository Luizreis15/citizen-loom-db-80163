import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ticket, Users, AlertCircle, CheckCircle2, Clock, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";

interface TicketData {
  id: string;
  protocol_number: string;
  title: string;
  status: string;
  created_at: string;
  client_name: string;
  product_name: string;
  assignee_name: string | null;
  assignee_id: string | null;
  due_date: string | null;
  task_status: string | null;
  priority: string;
}

interface DashboardStats {
  total_open: number;
  overdue: number;
  in_progress: number;
  pending_approval: number;
}

export default function TicketsBoard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_open: 0,
    overdue: 0,
    in_progress: 0,
    pending_approval: 0,
  });
  
  const [filters, setFilters] = useState({
    status: "all",
    assignee: "all",
    client: "all",
    search: "",
  });

  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [assignees, setAssignees] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);

      // Fetch client requests with related data
      const { data: requestsData, error: requestsError } = await supabase
        .from("client_requests")
        .select(`
          id,
          protocol_number,
          title,
          status,
          priority,
          created_at,
          clients (
            id,
            name
          ),
          products (
            name
          )
        `)
        .in("status", ["Aprovado", "Em Progresso"])
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch tasks related to these requests
      const requestIds = requestsData?.map((r) => r.id) || [];
      const { data: tasksData } = await supabase
        .from("tasks")
        .select(`
          request_id,
          assignee_id,
          due_date,
          status,
          profiles (
            full_name
          )
        `)
        .in("request_id", requestIds);

      // Combine data
      const ticketsWithTasks: TicketData[] = (requestsData || []).map((request: any) => {
        const task = tasksData?.find((t) => t.request_id === request.id);
        return {
          id: request.id,
          protocol_number: request.protocol_number,
          title: request.title,
          status: request.status,
          priority: request.priority,
          created_at: request.created_at,
          client_name: request.clients?.name || "N/A",
          product_name: request.products?.name || "N/A",
          assignee_name: task?.profiles?.full_name || null,
          assignee_id: task?.assignee_id || null,
          due_date: task?.due_date || null,
          task_status: task?.status || null,
        };
      });

      setTickets(ticketsWithTasks);

      // Calculate stats
      const now = new Date();
      const statsData: DashboardStats = {
        total_open: ticketsWithTasks.length,
        overdue: ticketsWithTasks.filter((t) => t.due_date && new Date(t.due_date) < now && t.task_status !== "Concluído").length,
        in_progress: ticketsWithTasks.filter((t) => t.task_status === "Em Progresso").length,
        pending_approval: ticketsWithTasks.filter((t) => t.status === "Aprovado" && !t.task_status).length,
      };
      setStats(statsData);

      // Extract unique clients and assignees for filters
      const uniqueClients = Array.from(new Set(ticketsWithTasks.map((t) => t.client_name)))
        .map((name, idx) => ({ id: `client-${idx}`, name }));
      setClients(uniqueClients);

      const uniqueAssignees = Array.from(
        new Set(ticketsWithTasks.filter((t) => t.assignee_name).map((t) => ({ id: t.assignee_id!, name: t.assignee_name! })))
      );
      setAssignees(uniqueAssignees);

    } catch (error: any) {
      console.error("Erro ao buscar tickets:", error);
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    // Filter by status
    if (filters.status !== "all") {
      if (filters.status === "overdue") {
        const now = new Date();
        filtered = filtered.filter((t) => t.due_date && new Date(t.due_date) < now && t.task_status !== "Concluído");
      } else {
        filtered = filtered.filter((t) => t.task_status === filters.status || t.status === filters.status);
      }
    }

    // Filter by assignee
    if (filters.assignee !== "all") {
      filtered = filtered.filter((t) => t.assignee_id === filters.assignee);
    }

    // Filter by client
    if (filters.client !== "all") {
      filtered = filtered.filter((t) => t.client_name === filters.client);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.protocol_number.toLowerCase().includes(searchLower) ||
          t.title.toLowerCase().includes(searchLower) ||
          t.client_name.toLowerCase().includes(searchLower) ||
          t.product_name.toLowerCase().includes(searchLower)
      );
    }

    setFilteredTickets(filtered);
  };

  const getStatusColor = (ticket: TicketData) => {
    if (ticket.due_date && new Date(ticket.due_date) < new Date() && ticket.task_status !== "Concluído") {
      return "destructive";
    }
    if (ticket.task_status === "Em Progresso") return "default";
    if (ticket.task_status === "Concluído") return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Tickets</h1>
          <p className="text-muted-foreground">Gerencie todas as solicitações em andamento</p>
        </div>
        <Button onClick={() => navigate("/admin/solicitacoes")}>
          Ver Todas Solicitações
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_open}</div>
            <p className="text-xs text-muted-foreground">Total em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Passou da data de entrega</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_progress}</div>
            <p className="text-xs text-muted-foreground">Sendo executados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Início</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_approval}</div>
            <p className="text-xs text-muted-foreground">Aprovados, aguardando execução</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine a visualização dos tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Protocolo, título..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                  <SelectItem value="overdue">Atrasados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Executor</label>
              <Select value={filters.assignee} onValueChange={(value) => setFilters({ ...filters, assignee: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {assignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select value={filters.client} onValueChange={(value) => setFilters({ ...filters, client: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Executor</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhum ticket encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/solicitacoes/${ticket.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{ticket.protocol_number}</TableCell>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell>{ticket.client_name}</TableCell>
                    <TableCell>{ticket.product_name}</TableCell>
                    <TableCell>{ticket.assignee_name || <span className="text-muted-foreground">Não atribuído</span>}</TableCell>
                    <TableCell>
                      {ticket.due_date ? (
                        <span className={new Date(ticket.due_date) < new Date() && ticket.task_status !== "Concluído" ? "text-destructive font-semibold" : ""}>
                          {new Date(ticket.due_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(ticket)}>
                        {ticket.task_status || ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticket.priority === "Urgente" ? "destructive" : ticket.priority === "Alta" ? "default" : "outline"}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
