import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { isCollaboratorRole, isClientRole, isAdminRole } from "@/lib/roleUtils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/login");
        return;
      }

      if (role && !allowedRoles.includes(role)) {
        // Redirect based on role
        if (isClientRole(role)) {
          navigate("/client-portal/dashboard");
        } else if (isCollaboratorRole(role)) {
          navigate("/collaborator/dashboard");
        } else if (isAdminRole(role)) {
          navigate("/dashboard");
        }
      }
    }
  }, [user, role, authLoading, roleLoading, allowedRoles, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user || !role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
