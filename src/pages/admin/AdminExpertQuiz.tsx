import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Eye, Copy, Trash2, Search, Sparkles, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";

type ExpertOnboarding = {
  id: string;
  expert_name: string;
  expert_email: string;
  expert_whatsapp: string | null;
  project_name: string | null;
  status: string;
  current_block: number;
  token: string;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
  internal_notes: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  created: { label: "Criado", variant: "secondary" },
  in_progress: { label: "Em Progresso", variant: "default" },
  completed: { label: "Concluído", variant: "outline" },
};

export default function AdminExpertQuiz() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    expert_name: "", expert_email: "", expert_whatsapp: "", project_name: "", internal_notes: "", days_to_expire: "7",
  });

  const sendQuizEmail = async (expertName: string, expertEmail: string, token: string, projectName: string | null, daysToExpire: number) => {
    const appUrl = window.location.origin;
    const quizLink = `${appUrl}/quiz/${token}`;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) throw new Error("Sessão expirada");

    const res = await supabase.functions.invoke("send-expert-quiz-invite", {
      body: {
        expert_name: expertName,
        expert_email: expertEmail,
        quiz_link: quizLink,
        project_name: projectName || undefined,
        expires_in_days: daysToExpire,
      },
    });
    if (res.error) throw res.error;
    return res.data;
  };

  const { data: onboardings = [], isLoading } = useQuery({
    queryKey: ["expert-onboardings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expert_onboardings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExpertOnboarding[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID();
      const days = parseInt(form.days_to_expire) || 7;
      const expires_at = new Date(Date.now() + days * 86400000).toISOString();
      const { error } = await supabase.from("expert_onboardings").insert({
        expert_name: form.expert_name,
        expert_email: form.expert_email,
        expert_whatsapp: form.expert_whatsapp || null,
        project_name: form.project_name || null,
        internal_notes: form.internal_notes || null,
        token,
        expires_at,
      });
      if (error) throw error;
      // Send email
      try {
        await sendQuizEmail(form.expert_name, form.expert_email, token, form.project_name || null, parseInt(form.days_to_expire) || 7);
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
        // Quiz created but email failed - we'll handle in onSuccess
        return { emailFailed: true, token };
      }
      return { emailFailed: false, token };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["expert-onboardings"] });
      setDialogOpen(false);
      setForm({ expert_name: "", expert_email: "", expert_whatsapp: "", project_name: "", internal_notes: "", days_to_expire: "7" });
      if (result?.emailFailed) {
        toast({ title: "Quiz criado, mas o email falhou", description: "Copie o link manualmente para enviar ao expert.", variant: "destructive" });
      } else {
        toast({ title: "Quiz criado e email enviado! ✉️" });
      }
    },
    onError: () => toast({ title: "Erro ao criar quiz", variant: "destructive" }),
  });

  const handleResendEmail = async (o: ExpertOnboarding) => {
    setResendingId(o.id);
    try {
      const daysLeft = Math.max(1, Math.ceil((new Date(o.expires_at).getTime() - Date.now()) / 86400000));
      await sendQuizEmail(o.expert_name, o.expert_email, o.token, o.project_name, daysLeft);
      toast({ title: "Email reenviado! ✉️" });
    } catch {
      toast({ title: "Erro ao reenviar email", variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expert_onboardings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-onboardings"] });
      toast({ title: "Quiz excluído" });
    },
  });

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${token}`);
    toast({ title: "Link copiado!" });
  };

  const filtered = onboardings.filter((o) => {
    const matchSearch = !search || o.expert_name.toLowerCase().includes(search.toLowerCase()) || o.expert_email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    created: onboardings.filter((o) => o.status === "created").length,
    in_progress: onboardings.filter((o) => o.status === "in_progress").length,
    completed: onboardings.filter((o) => o.status === "completed").length,
    total: onboardings.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quiz de Experts</h1>
          <p className="text-muted-foreground">Gerencie os questionários enviados para experts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Quiz</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Quiz</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>Nome do Expert *</Label><Input value={form.expert_name} onChange={(e) => setForm({ ...form, expert_name: e.target.value })} /></div>
              <div><Label>Email *</Label><Input type="email" value={form.expert_email} onChange={(e) => setForm({ ...form, expert_email: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={form.expert_whatsapp} onChange={(e) => setForm({ ...form, expert_whatsapp: e.target.value })} /></div>
              <div><Label>Nome do Projeto</Label><Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} /></div>
              <div><Label>Notas Internas</Label><Textarea value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} /></div>
              <div><Label>Dias para expirar</Label><Input type="number" value={form.days_to_expire} onChange={(e) => setForm({ ...form, days_to_expire: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={!form.expert_name || !form.expert_email || createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Quiz"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Criados" value={stats.created} icon={FileText} />
        <MetricCard title="Em Progresso" value={stats.in_progress} icon={Clock} />
        <MetricCard title="Concluídos" value={stats.completed} icon={CheckCircle} />
        <MetricCard title="Total" value={stats.total} icon={BarChart3} />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="created">Criado</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-center text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">Nenhum quiz encontrado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expert</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((o) => {
                  const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.created;
                  const progress = Math.round((o.current_block / 10) * 100);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.expert_name}</TableCell>
                      <TableCell>{o.expert_email}</TableCell>
                      <TableCell>{o.project_name || "—"}</TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell>{progress}%</TableCell>
                      <TableCell>{format(new Date(o.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" asChild><Link to={`/admin/expert-quiz/${o.id}`}><Eye className="h-4 w-4" /></Link></Button>
                          <Button variant="ghost" size="icon" onClick={() => copyLink(o.token)}><Copy className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleResendEmail(o)} disabled={resendingId === o.id}>
                            {resendingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir quiz?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O quiz de <strong>{o.expert_name}</strong> será excluído permanentemente. Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(o.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
