import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Shield } from "lucide-react";

export default function ChangePasswordRequired() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    setIsSubmitting(true);

    try {
      // Atualizar senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Remover flag de troca de senha obrigatória
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ require_password_change: false })
          .eq("id", user.id);

        if (profileError) throw profileError;
      }

      toast.success("Senha alterada com sucesso!");
      
      // Redirecionar para o dashboard apropriado
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Erro ao alterar senha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 8) return { strength: 25, label: "Fraca", color: "bg-red-500" };
    
    let strength = 25;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 30;
    
    if (strength <= 40) return { strength, label: "Fraca", color: "bg-red-500" };
    if (strength <= 70) return { strength, label: "Média", color: "bg-yellow-500" };
    return { strength: 100, label: "Forte", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Alterar Senha</CardTitle>
          <CardDescription className="text-center">
            Por segurança, você precisa criar uma nova senha antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Força da senha:</span>
                    <span className={`font-medium ${
                      passwordStrength.label === "Forte" ? "text-green-600" : 
                      passwordStrength.label === "Média" ? "text-yellow-600" : 
                      "text-red-600"
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">As senhas não coincidem</p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Sua senha deve conter:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className={newPassword.length >= 8 ? "text-green-600" : ""}>
                  ✓ No mínimo 8 caracteres
                </li>
                <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
                  ✓ Letras maiúsculas
                </li>
                <li className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
                  ✓ Letras minúsculas
                </li>
                <li className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>
                  ✓ Números
                </li>
                <li className={/[^a-zA-Z0-9]/.test(newPassword) ? "text-green-600" : ""}>
                  ✓ Caracteres especiais (@, #, $, etc)
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || newPassword !== confirmPassword || newPassword.length < 8}
            >
              {isSubmitting ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}