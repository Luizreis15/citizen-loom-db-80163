import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

const Projetos = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
        <p className="text-muted-foreground">
          Gerencie seus projetos e acompanhe o progresso
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Lista de Projetos
          </CardTitle>
          <CardDescription>
            Esta página está em desenvolvimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá visualizar e gerenciar todos os seus projetos aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Projetos;
