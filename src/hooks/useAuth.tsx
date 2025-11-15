import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      toast.success("Cadastro realizado com sucesso!");
      return { data, error: null };
    } catch (error: any) {
      const message = error.message === "User already registered" 
        ? "Este e-mail já está cadastrado"
        : error.message;
      toast.error(message);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se precisa trocar senha
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("require_password_change")
          .eq("id", data.user.id)
          .single();

        if (profile?.require_password_change) {
          window.location.href = "/trocar-senha";
          return { data, error: null };
        }
      }

      toast.success("Login realizado com sucesso!");
      return { data, error: null };
    } catch (error: any) {
      const message = error.message === "Invalid login credentials"
        ? "E-mail ou senha incorretos"
        : error.message;
      toast.error(message);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Mesmo que dê erro "session not found", considerar sucesso
      // pois o objetivo é deslogar
      if (error && error.message !== "Session from session_id claim in JWT does not exist") {
        throw error;
      }
      
      toast.success("Logout realizado com sucesso!");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error("Erro ao fazer logout, mas redirecionando...");
    } finally {
      // SEMPRE redirecionar, mesmo que dê erro
      window.location.href = "/login";
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
