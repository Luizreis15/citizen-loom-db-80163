import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

export function AuthLayout() {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Redirect clients to their portal
  useEffect(() => {
    if (!loading && !roleLoading && user && role === "Cliente") {
      if (!location.pathname.startsWith("/client-portal")) {
        navigate("/client-portal/tasks");
      }
    }
  }, [user, loading, role, roleLoading, location.pathname, navigate]);

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Client portal layout (no sidebar)
  if (role === "Cliente") {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <AppHeader showSidebarTrigger={false} />
        <main className="flex-1 p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    );
  }

  // Standard layout with sidebar for other users
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
