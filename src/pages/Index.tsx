import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Sistema de Gerenciamento
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Gerencie usuários, papéis e permissões de forma simples e segura
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link to="/login">
            <Button size="lg">
              Fazer Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="lg" variant="outline">
              Criar Conta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
