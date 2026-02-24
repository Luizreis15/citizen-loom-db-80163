import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Mail, Phone, FolderOpen, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QUIZ_BLOCKS, QUIZ_QUESTIONS } from "@/components/expert-quiz/quizSchema";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  created: { label: "Criado", variant: "secondary" },
  in_progress: { label: "Em Progresso", variant: "default" },
  completed: { label: "Concluído", variant: "outline" },
};

export default function AdminExpertQuizDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: onboarding, isLoading: loadingOnboarding } = useQuery({
    queryKey: ["expert-onboarding", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expert_onboardings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: responses = [] } = useQuery({
    queryKey: ["expert-onboarding-responses", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expert_onboarding_responses")
        .select("*")
        .eq("onboarding_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (loadingOnboarding) {
    return <div className="flex min-h-[400px] items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  }

  if (!onboarding) {
    return <div className="flex min-h-[400px] items-center justify-center"><p className="text-muted-foreground">Quiz não encontrado</p></div>;
  }

  const cfg = STATUS_CONFIG[onboarding.status] || STATUS_CONFIG.created;
  const responseMap = new Map(responses.map((r) => [r.field_key, r.value]));

  // Group questions by block (skip bloco_0 consent)
  const blocks = QUIZ_BLOCKS.filter((b) => b.id !== "bloco_0").map((block) => {
    const questions = QUIZ_QUESTIONS.filter((q) => q.block === block.id);
    const answered = questions.filter((q) => responseMap.has(q.key) && responseMap.get(q.key)).length;
    const total = questions.length;
    const progress = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { ...block, questions, answered, total, progress };
  });

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(18);
    doc.text("Diagnóstico Expert", pageWidth / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(11);
    doc.text(`Nome: ${onboarding.expert_name}`, 14, y); y += 6;
    doc.text(`Email: ${onboarding.expert_email}`, 14, y); y += 6;
    if (onboarding.expert_whatsapp) { doc.text(`WhatsApp: ${onboarding.expert_whatsapp}`, 14, y); y += 6; }
    if (onboarding.project_name) { doc.text(`Projeto: ${onboarding.project_name}`, 14, y); y += 6; }
    doc.text(`Status: ${cfg.label}`, 14, y); y += 6;
    doc.text(`Criado: ${format(new Date(onboarding.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, y); y += 6;
    if (onboarding.completed_at) { doc.text(`Concluído: ${format(new Date(onboarding.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, y); y += 6; }
    y += 4;

    blocks.forEach((block) => {
      const rows = block.questions.map((q) => {
        const val = responseMap.get(q.key) || "Pendente";
        return [q.label, val];
      });

      autoTable(doc, {
        startY: y,
        head: [[block.label, "Resposta"]],
        body: rows,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 30, 60], textColor: 255 },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: "auto" } },
        margin: { left: 14, right: 14 },
        didDrawPage: () => { y = 20; },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
    });

    doc.save(`diagnostico-${onboarding.expert_name.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/admin/expert-quiz"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
        </Button>
        <Button variant="outline" onClick={handleDownloadPdf} className="gap-2">
          <Download className="h-4 w-4" /> Baixar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{onboarding.expert_name}</CardTitle>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{onboarding.expert_email}</span>
                {onboarding.expert_whatsapp && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{onboarding.expert_whatsapp}</span>}
                {onboarding.project_name && <span className="flex items-center gap-1"><FolderOpen className="h-4 w-4" />{onboarding.project_name}</span>}
              </div>
            </div>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span>Criado: {format(new Date(onboarding.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            <span>Expira: {format(new Date(onboarding.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
            {onboarding.completed_at && <span>Concluído: {format(new Date(onboarding.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>}
            <span>Progresso: Bloco {onboarding.current_block}/10</span>
          </div>
          {onboarding.internal_notes && (
            <div className="mt-4 rounded-md bg-muted p-3 text-sm">
              <strong>Notas internas:</strong> {onboarding.internal_notes}
            </div>
          )}
        </CardContent>
      </Card>

      {blocks.map((block) => (
        <Card key={block.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{block.label}</CardTitle>
              <span className="text-sm text-muted-foreground">{block.answered}/{block.total}</span>
            </div>
            <Progress value={block.progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {block.questions.map((q) => {
              const value = responseMap.get(q.key);
              return (
                <div key={q.key} className="border-b pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium">{q.label}</p>
                  {value ? (
                    <p className="mt-1 text-sm whitespace-pre-wrap">{value}</p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground italic">Pendente</p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
