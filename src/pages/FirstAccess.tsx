import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function FirstAccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [clientData, setClientData] = useState<{ name: string; email: string; id: string } | null>(null);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [activating, setActivating] = useState(false);
  
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setValidatingToken(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from("activation_tokens")
        .select(`
          *,
          clients (
            id,
            name,
            email,
            status
          )
        `)
        .eq("token", token)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        setTokenValid(false);
      } else {
        setTokenValid(true);
        setClientData({
          name: (data.clients as any).name,
          email: (data.clients as any).email,
          id: (data.clients as any).id,
        });
      }
    } catch (error) {
      console.error("Error validating token:", error);
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    if (pwd.length < 8) return "weak";
    
    let strength = 0;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    
    if (strength <= 1) return "weak";
    if (strength <= 2) return "medium";
    return "strong";
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
    
    if (value.length > 0 && value.length < 8) {
      setErrors(prev => ({ ...prev, password: "A senha deve ter no mínimo 8 caracteres" }));
    } else {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    
    if (value.length > 0 && value !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: "As senhas não coincidem" }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = passwordSchema.safeParse({ password, confirmPassword });
    
    if (!validation.success) {
      const fieldErrors: any = {};
      validation.error.errors.forEach(err => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Termos não aceitos",
        description: "Você precisa aceitar os termos de uso para continuar.",
        variant: "destructive",
      });
      return;
    }

    setActivating(true);

    try {
      let userId: string;

      // 1. Check if client already has a user_id linked to a different email
      if (clientData!.email) {
        const { data: existingClient } = await supabase
          .from("clients")
          .select(`
            user_id,
            profiles!inner(email)
          `)
          .eq("id", clientData!.id)
          .single();

        // If client has user_id but linked to different email, clear it
        if (existingClient?.user_id && existingClient.profiles?.email !== clientData!.email) {
          console.log("Client has user_id linked to different email, clearing link...");
          
          const { error: clearError } = await supabase
            .from("clients")
            .update({ 
              user_id: null,
              status: "Pendente",
              activated_at: null 
            })
            .eq("id", clientData!.id);

          if (clearError) {
            console.error("Error clearing incorrect user_id link:", clearError);
          }
        }
      }

      // 2. Try to login first (user might already exist from previous attempts)
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: clientData!.email,
        password: password,
      });

      if (loginError) {
        // If login fails with invalid credentials, user doesn't exist yet - create it
        if (loginError.message.includes('Invalid login credentials')) {
          const { data: userData, error: signUpError } = await supabase.auth.signUp({
            email: clientData!.email,
            password: password,
            options: {
              emailRedirectTo: `${window.location.origin}/client-portal/tasks`,
              data: {
                full_name: clientData!.name,
              }
            }
          });

          if (signUpError) throw signUpError;
          if (!userData.user) throw new Error("User creation failed");

          userId = userData.user.id;

          // Auto login after creating user
          const { error: autoLoginError } = await supabase.auth.signInWithPassword({
            email: clientData!.email,
            password: password,
          });

          if (autoLoginError) throw autoLoginError;
        } else {
          // Other login error - throw it
          throw loginError;
        }
      } else {
        // Login successful - user already exists
        if (!loginData.user) throw new Error("Login failed");
        userId = loginData.user.id;
      }

      // 2. Now with authenticated session, mark token as used
      const { error: tokenError } = await supabase
        .from("activation_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token);

      if (tokenError) throw tokenError;

      // 3. Update client record
      const { error: clientError } = await supabase
        .from("clients")
        .update({
          status: "Ativo",
          user_id: userId,
          activated_at: new Date().toISOString(),
        })
        .eq("id", clientData!.id);

      if (clientError) throw clientError;

      // 4. Update profile with client_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ client_id: clientData!.id })
        .eq("id", userId);

      if (profileError) console.error("Error updating profile:", profileError);

      toast({
        title: "Conta ativada com sucesso!",
        description: "Bem-vindo(a) à Digital Hera!",
      });

      // 5. Redirect to client portal
      setTimeout(() => {
        navigate("/client-portal/tasks");
      }, 1000);

    } catch (error: any) {
      console.error("Error activating account:", error);
      toast({
        title: "Erro ao ativar conta",
        description: error.message || "Ocorreu um erro. Por favor, tente novamente ou entre em contato.",
        variant: "destructive",
      });
    } finally {
      setActivating(false);
    }
  };

  const isFormValid = password.length >= 8 && 
                      password === confirmPassword && 
                      termsAccepted && 
                      !errors.password && 
                      !errors.confirmPassword;

  if (validatingToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Validando token...</p>
        </div>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-destructive/10 p-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Token Inválido</h1>
            <p className="mt-2 text-muted-foreground">
              Este link de ativação não é válido, já foi usado ou expirou.
            </p>
          </div>
          
          <Button 
            onClick={() => navigate("/contato")} 
            className="w-full"
          >
            Entrar em Contato
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
        {activating ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle2 className="h-12 w-12 animate-pulse text-primary" />
            </div>
            <p className="text-lg font-medium">Conta ativada!</p>
            <p className="text-sm text-muted-foreground">Redirecionando...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Ativar Conta</h1>
              <p className="text-muted-foreground">
                Bem-vindo, <span className="font-semibold text-primary">{clientData?.name}</span>! 
                Crie uma senha para acessar sua área de cliente.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={clientData?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {password.length > 0 && (
                  <div className="flex gap-1">
                    <div className={`h-1.5 flex-1 rounded-full ${passwordStrength === "weak" ? "bg-destructive" : passwordStrength === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${passwordStrength === "medium" || passwordStrength === "strong" ? "bg-yellow-500" : "bg-muted"}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${passwordStrength === "strong" ? "bg-green-500" : "bg-muted"}`} />
                  </div>
                )}
                
                {errors.password && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {errors.confirmPassword && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-relaxed text-muted-foreground cursor-pointer"
                >
                  Aceito os termos de uso e a política de privacidade
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!isFormValid || activating}
              >
                {activating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ativando conta...
                  </>
                ) : (
                  "Ativar Conta e Fazer Login"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
