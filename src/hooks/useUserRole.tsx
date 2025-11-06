import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    fetchUserRole();
  }, [user]);

  const fetchUserRole = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_roles', { _user_id: user!.id });

      if (error) throw error;

      // Get the first role if multiple exist
      if (data && data.length > 0) {
        setRole(data[0].role_name);
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
