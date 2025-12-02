import { 
  LayoutDashboard, 
  FileText, 
  Inbox, 
  DollarSign, 
  Package, 
  User,
  LogOut,
  ClipboardList
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ClientPortalSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const menuItems = [
    { to: "/client-portal/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/client-portal/onboarding", icon: ClipboardList, label: "Onboarding" },
    { to: "/client-portal/request", icon: FileText, label: "Solicitar Trabalho" },
    { to: "/client-portal/requests", icon: Inbox, label: "Meus Pedidos" },
    { to: "/client-portal/financial", icon: DollarSign, label: "Financeiro" },
    { to: "/client-portal/package", icon: Package, label: "Meu Pacote" },
    { to: "/client-portal/profile", icon: User, label: "Perfil" },
  ];

  return (
    <div className="flex flex-col h-full w-64 border-r bg-card">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Portal do Cliente</h2>
      </div>
      
      <Separator />
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
            activeClassName="bg-accent text-accent-foreground font-medium"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
