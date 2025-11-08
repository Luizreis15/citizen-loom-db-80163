import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertCircle, DollarSign } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  type?: "request" | "task" | "financial";
}

export function StatusBadge({ status, type = "request" }: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (type === "request") {
      switch (status) {
        case "Pendente":
          return { icon: Clock, variant: "secondary" as const, label: "Pendente" };
        case "Em análise":
          return { icon: AlertCircle, variant: "default" as const, label: "Em análise" };
        case "Aprovado":
          return { icon: CheckCircle, variant: "default" as const, label: "Aprovado", className: "bg-green-500/10 text-green-700 dark:text-green-400" };
        case "Recusado":
          return { icon: XCircle, variant: "destructive" as const, label: "Recusado" };
        default:
          return { icon: Clock, variant: "secondary" as const, label: status };
      }
    }
    
    if (type === "financial") {
      switch (status) {
        case "Pago":
          return { icon: CheckCircle, variant: "default" as const, label: "Pago", className: "bg-green-500/10 text-green-700 dark:text-green-400" };
        case "Pendente":
          return { icon: Clock, variant: "secondary" as const, label: "Pendente" };
        case "Atrasado":
          return { icon: AlertCircle, variant: "destructive" as const, label: "Atrasado" };
        case "Cancelado":
          return { icon: XCircle, variant: "outline" as const, label: "Cancelado" };
        default:
          return { icon: DollarSign, variant: "secondary" as const, label: status };
      }
    }

    return { icon: Clock, variant: "secondary" as const, label: status };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
