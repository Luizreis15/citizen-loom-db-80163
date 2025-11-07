import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AdminViewingBanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("client_id");
  const [clientName, setClientName] = useState<string>("");

  useEffect(() => {
    if (clientId) {
      fetchClientName();
    }
  }, [clientId]);

  const fetchClientName = async () => {
    try {
      const { data } = await supabase
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();
      
      if (data) {
        setClientName(data.name);
      }
    } catch (error) {
      console.error("Error fetching client name:", error);
    }
  };

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Modo Visualização de Cliente
            {clientName && ` - ${clientName}`}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/clients")}
          className="text-primary hover:text-primary hover:bg-primary/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Painel Admin
        </Button>
      </div>
    </div>
  );
}
