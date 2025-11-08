import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { isCollaboratorRole, isClientRole, isAdminRole } from "@/lib/roleUtils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { AdminViewingBanner } from "@/components/AdminViewingBanner";
import { ClientPortalSidebar } from "@/components/ClientPortalSidebar";
import { CollaboratorSidebar } from "@/components/CollaboratorSidebar";

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

  // Check if user is admin
  const isAdmin = isAdminRole(role);
  
  // Redirect users based on their role
  useEffect(() => {
    if (!loading && !roleLoading && user) {
      // Redirect clients to their portal
      if (isClientRole(role) && !location.pathname.startsWith("/client-portal")) {
        navigate("/client-portal/dashboard");
      }
      
      // Redirect collaborators to their panel
      if (isCollaboratorRole(role) && !location.pathname.startsWith("/collaborator")) {
        navigate("/collaborator/dashboard");
      }
      
      // Redirect admins away from client/collaborator portals if not intentionally viewing
      if (isAdmin && location.pathname === "/") {
        navigate("/dashboard");
      }
    }
  }, [user, loading, role, roleLoading, location.pathname, navigate, isAdmin]);

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

  // Collaborator panel layout
  if (isCollaboratorRole(role)) {
    return (
      <div className="flex min-h-screen w-full">
        <CollaboratorSidebar />
        <main className="flex-1 p-6 bg-muted/30">
          <Outlet />
        </main>
      </div>
    );
  }

  // Client portal layout with sidebar
  if (isClientRole(role) || (isAdmin && location.pathname.startsWith("/client-portal"))) {
    const showAdminBanner = isAdmin && location.pathname.startsWith("/client-portal");
    
    return (
      <div className="flex min-h-screen w-full">
        {showAdminBanner && <AdminViewingBanner />}
        <ClientPortalSidebar />
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
