import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/StatusBadge";
import { FileUpload } from "@/components/FileUpload";
import { DollarSign, Upload, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ClientFinancial() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    pending: 0,
    overdue: 0
  });

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.client_id) return;

      setClientId(profile.client_id);

      const { data } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("client_id", profile.client_id)
        .order("due_date", { ascending: false });

      if (data) {
        setTransactions(data);

        const totalPaid = data
          .filter(t => t.status === "Pago")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const pending = data.filter(t => t.status === "Pendente").length;
        const overdue = data.filter(t => t.status === "Atrasado").length;

        setSummary({ totalPaid, pending, overdue });
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (files: any[], transactionId: string) => {
    if (files.length === 0) return;

    try {
      const { error } = await supabase
        .from("financial_transactions")
        .update({ 
          payment_proof_url: files[0].url,
          status: "Pendente" // Admin will verify and mark as paid
        })
        .eq("id", transactionId);

      if (error) throw error;

      toast.success("Comprovante enviado! Aguarde a confirmação.");
      fetchFinancialData();
    } catch (error: any) {
      toast.error("Erro ao enviar comprovante: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financeiro</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {summary.totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">No total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending}</div>
            <p className="text-xs text-muted-foreground">Pagamentos a fazer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.overdue}</div>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.due_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>R$ {Number(transaction.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <StatusBadge status={transaction.status} type="financial" />
                  </TableCell>
                  <TableCell>
                    {transaction.status === "Pendente" && !transaction.payment_proof_url && (
                      <FileUpload
                        clientId={clientId}
                        requestId={transaction.id}
                        onFilesUploaded={(files) => handleUploadProof(files, transaction.id)}
                        acceptedTypes={['image/*', '.pdf']}
                        maxSize={5}
                      />
                    )}
                    {transaction.payment_proof_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(transaction.payment_proof_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {transactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação encontrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
