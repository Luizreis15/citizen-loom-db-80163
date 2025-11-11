import { Home, Users, FolderKanban, UserCog, Settings, FileText, Inbox, Ticket, ClipboardCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Solicitações", url: "/admin/requests", icon: Inbox },
  { title: "Tickets", url: "/admin/tickets", icon: Ticket },
  { title: "Revisão", url: "/admin/review", icon: ClipboardCheck },
  { title: "Clientes", url: "/clients", icon: Users },
  { title: "Projetos", url: "/projetos", icon: FolderKanban },
  { title: "Usuários", url: "/usuarios", icon: UserCog },
  { title: "Relatório Financeiro", url: "/reports/financial", icon: FileText },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={cn(
                          "hover:bg-accent/50",
                          isActive && "bg-accent text-accent-foreground font-medium"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
