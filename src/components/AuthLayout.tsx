import { useEffect, useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasClientId, setHasClientId] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Check if client user has client_id in profile
  useEffect(() => {
    const checkClientProfile = async () => {
      if (!loading && !roleLoading && user && isClientRole(role) && !profileChecked) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("client_id")
          .eq("id", user.id)
          .single();

        setProfileChecked(true);
        
        if (!profile?.client_id) {
          setHasClientId(false);
          toast.error("Sua conta precisa ser ativada. Entre em contato com o suporte.");
          navigate("/contato");
        } else {
          setHasClientId(true);
        }
      }
    };

    checkClientProfile();
  }, [user, loading, role, roleLoading, profileChecked, navigate]);

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
