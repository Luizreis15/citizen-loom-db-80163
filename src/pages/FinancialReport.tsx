import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { toast } from "sonner";
import { CalendarIcon, Download, DollarSign, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
}

interface FinancialTask {
  id: string;
  created_at: string;
  frozen_price: number;
  client_name: string;
  project_name: string;
  product_name: string;
}

const FinancialReport = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<FinancialTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<FinancialTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Total
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchClients();
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, selectedClient, startDate, endDate]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar clientes");
      console.error("Error fetching clients:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          id,
          created_at,
          frozen_price,
          projects!inner(
            name,
            clients!inner(
              id,
              name
            )
          ),
          products(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedTasks: FinancialTask[] = (data || []).map((task: any) => ({
        id: task.id,
        created_at: task.created_at,
        frozen_price: task.frozen_price,
        client_name: task.projects?.clients?.name || "N/A",
        project_name: task.projects?.name || "N/A",
        product_name: task.products?.name || "N/A",
      }));

      setTasks(formattedTasks);
    } catch (error: any) {
      toast.error("Erro ao carregar tarefas");
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Filter by client
    if (selectedClient && selectedClient !== "all") {
      filtered = filtered.filter((task) => {
        const client = clients.find((c) => c.id === selectedClient);
        return client && task.client_name === client.name;
      });
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter((task) => {
        const taskDate = new Date(task.created_at);
        taskDate.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        return taskDate >= start;
      });
    }

    if (endDate) {
      filtered = filtered.filter((task) => {
        const taskDate = new Date(task.created_at);
        taskDate.setHours(23, 59, 59, 999);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return taskDate <= end;
      });
    }

    setFilteredTasks(filtered);
    
    // Calculate total
    const sum = filtered.reduce((acc, task) => acc + Number(task.frozen_price), 0);
    setTotal(sum);
  };

  const exportToCSV = async () => {
    if (filteredTasks.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    try {
      toast.loading("Gerando relatório CSV...");

      const { data, error } = await supabase.functions.invoke("export-financial-csv", {
        body: {
          clientId: selectedClient !== "all" ? selectedClient : undefined,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
        },
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss();
      toast.success("Relatório exportado com sucesso");
    } catch (error: any) {
      toast.dismiss();
      toast.error("Erro ao exportar relatório");
      console.error("Error exporting CSV:", error);
    }
  };

  const clearFilters = () => {
    setSelectedClient("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <p className="text-muted-foreground">Carregando relatório...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório Financeiro</h1>
        <p className="text-muted-foreground">
          Visualize e exporte dados financeiros das tarefas
        </p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total do Período</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? "tarefa" : "tarefas"}
          </p>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tarefas</CardTitle>
          <Button onClick={exportToCSV} disabled={filteredTasks.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma tarefa encontrada com os filtros aplicados
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Tarefa (Produto)</TableHead>
                    <TableHead className="text-right">Preço Congelado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        {format(new Date(task.created_at), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>{task.client_name}</TableCell>
                      <TableCell>{task.project_name}</TableCell>
                      <TableCell>{task.product_name}</TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {task.frozen_price.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={4} className="text-right">
                      TOTAL
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;
