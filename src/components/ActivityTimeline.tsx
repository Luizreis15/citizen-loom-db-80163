import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Upload, MessageSquare, CheckCircle, FileText, DollarSign } from "lucide-react";

interface Activity {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const getIcon = (actionType: string) => {
    switch (actionType) {
      case "upload":
        return Upload;
      case "comment":
        return MessageSquare;
      case "approval":
        return CheckCircle;
      case "request":
        return FileText;
      case "payment":
        return DollarSign;
      default:
        return FileText;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma atividade recente
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = getIcon(activity.action_type);
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="rounded-full p-2 bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              {!isLast && <div className="w-px h-full bg-border mt-2" />}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm font-medium">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
