import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload, UploadedFile } from "@/components/FileUpload";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ClientRequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const [formData, setFormData] = useState({
    product_id: "",
    title: "",
    description: "",
    quantity: 1,
    priority: "Normal"
  });

  useEffect(() => {
    fetchProducts();
    fetchClientId();
  }, [user]);

  const fetchClientId = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("client_id")
      .eq("id", user.id)
      .single();

    if (data?.client_id) {
      setClientId(data.client_id);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("name");

    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_id || !formData.title || !formData.description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!clientId) {
      toast.error("Cliente não identificado");
      return;
    }

    setLoading(true);

    try {
      // Create request
      const { data: request, error: requestError } = await supabase
        .from("client_requests")
        .insert({
          client_id: clientId,
          product_id: parseInt(formData.product_id),
          title: formData.title,
          description: formData.description,
          quantity: formData.quantity,
          priority: formData.priority,
          requested_by: user!.id,
          status: "Pendente"
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create attachments
      if (uploadedFiles.length > 0) {
        const attachments = uploadedFiles.map(file => ({
          request_id: request.id,
          file_name: file.name,
          file_url: file.url,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user!.id
        }));

        const { error: attachError } = await supabase
          .from("request_attachments")
          .insert(attachments);

        if (attachError) throw attachError;
      }

      // Log activity
      await supabase.from("activity_log").insert({
        client_id: clientId,
        user_id: user!.id,
        action_type: "request",
        description: `Nova solicitação criada: ${formData.title}`
      });

      // Call edge function to send notification
      await supabase.functions.invoke("send-request-notification", {
        body: { request_id: request.id }
      });

      toast.success("Solicitação enviada com sucesso!");
      navigate("/client-portal/requests");
    } catch (error: any) {
      console.error("Error creating request:", error);
      toast.error("Erro ao criar solicitação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/client-portal/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Nova Solicitação de Trabalho</CardTitle>
          <CardDescription>
            Preencha os detalhes do trabalho que você precisa e faça upload dos arquivos necessários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product">Tipo de Serviço *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Vídeo para Instagram - Promoção Black Friday"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição e Observações *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva em detalhes o que você precisa..."
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Anexos</Label>
              <FileUpload
                clientId={clientId}
                onFilesUploaded={setUploadedFiles}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Enviando..." : "Enviar Solicitação"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/client-portal/dashboard")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
