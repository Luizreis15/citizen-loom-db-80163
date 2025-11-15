import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, ListTodo, User, LogOut } from "lucide-react";
import { toast } from "sonner";
import { NavLink } from "./NavLink";

export function CollaboratorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuItems = [
    {
      title: "Dashboard",
      url: "/collaborator/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Minhas Tarefas",
      url: "/collaborator/tasks",
      icon: ListTodo,
    },
    {
      title: "Meu Perfil",
      url: "/collaborator/profile",
      icon: User,
    },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-6">
        <Link to="/collaborator/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">Painel do Colaborador</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            activeClassName="bg-accent text-accent-foreground"
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
