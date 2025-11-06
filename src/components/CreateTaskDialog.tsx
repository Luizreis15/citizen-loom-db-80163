import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  clientId: string;
  onSuccess: () => void;
}

export function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  clientId,
  onSuccess 
}: CreateTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [formData, setFormData] = useState({
    product_id: "",
    assignee_id: "",
    quantity: "1",
    variant_description: "",
  });

  useEffect(() => {
    if (open) {
      fetchAvailableProducts();
      fetchUsers();
    }
  }, [open, clientId]);

  const fetchAvailableProducts = async () => {
    try {
      // Get products that this client has contracted
      const { data, error } = await supabase
        .from("client_services")
        .select(`
          product_id,
          is_active,
          products(id, name, description)
        `)
        .eq("client_id", clientId)
        .eq("is_active", true);

      if (error) throw error;

      const products = data
        .filter((service: any) => service.products)
        .map((service: any) => service.products);
      
      setAvailableProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erro ao carregar produtos disponíveis");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id) {
      toast.error("Selecione um produto");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-task", {
        body: {
          project_id: projectId,
          product_id: parseInt(formData.product_id),
          assignee_id: formData.assignee_id || null,
          quantity: parseInt(formData.quantity),
          variant_description: formData.variant_description || null,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data.message || "Tarefa criada com sucesso!");
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast.error(error.message || "Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      assignee_id: "",
      quantity: "1",
      variant_description: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Crie uma nova tarefa para este projeto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Produto/Serviço *</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              required
            >
              <SelectTrigger id="product">
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum produto contratado para este cliente
                  </div>
                ) : (
                  availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Responsável</Label>
            <Select
              value={formData.assignee_id}
              onValueChange={(value) => setFormData({ ...formData, assignee_id: value })}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Selecione um responsável (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variant">Variante/Descrição</Label>
            <Textarea
              id="variant"
              value={formData.variant_description}
              onChange={(e) => setFormData({ ...formData, variant_description: e.target.value })}
              placeholder="Ex: Feed 1:1, Reels vertical, etc."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
