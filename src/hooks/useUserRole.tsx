import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    fetchUserRole();
  }, [user, retryCount]);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_roles', { _user_id: user!.id });

      if (error) {
        // Se for erro de JWT expirado, tentar novamente após um pequeno delay
        if (error.code === 'PGRST301' || error.code === 'PGRST302' || error.code === 'PGRST303' || error.message?.includes('JWT')) {
          if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000); // Retry após 1 segundo
            return;
          }
        }
        throw error;
      }

      // Get the first role if multiple exist
      if (data && data.length > 0) {
        setRole(data[0].role_name);
        setRetryCount(0); // Reset retry count on success
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  return { role, loading };
}
