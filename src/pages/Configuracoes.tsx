import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, Lock, TestTube, RefreshCw } from "lucide-react";
import { getRoles, getUserRoles, addTestRole, removeTestRole, removeAllRolesExcept } from "@/lib/testRoleSwitch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Configuracoes = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  
  // Estados para teste de roles
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [currentRoles, setCurrentRoles] = useState<any[]>([]);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      if (role === "Owner") {
        fetchRolesData();
      }
    }
  }, [user, role]);

  const fetchProfile = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

      setProfile(profileData);
      setFormData({
        full_name: profileData?.full_name || "",
        email: profileData?.email || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: formData.full_name })
        .eq("id", user!.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
      fetchProfile();
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error("Erro ao alterar senha: " + error.message);
    }
  };

  const getUserInitials = () => {
    return formData.full_name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchRolesData = async () => {
    try {
      const [roles, userRoles] = await Promise.all([
        getRoles(),
        getUserRoles(user!.id)
      ]);
      setAvailableRoles(roles);
      setCurrentRoles(userRoles);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleAddRole = async (roleId: number) => {
    setTestLoading(true);
    try {
      await addTestRole(user!.id, roleId);
      toast.success("Role adicionada! Recarregando...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar role");
    } finally {
      setTestLoading(false);
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    setTestLoading(true);
    try {
      await removeTestRole(user!.id, roleId);
      toast.success("Role removida! Recarregando...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error("Erro ao remover role");
    } finally {
      setTestLoading(false);
    }
  };

  const handleResetToOwner = async () => {
    setTestLoading(true);
    try {
      // Encontrar ID da role Owner
      const ownerRole = availableRoles.find(r => r.name === "Owner");
      if (!ownerRole) {
        throw new Error("Role Owner não encontrada");
      }
      
      await removeAllRolesExcept(user!.id, [ownerRole.id]);
      toast.success("Resetado para Owner! Recarregando...");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error("Erro ao resetar roles");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Meu Perfil</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{formData.full_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">
                <User className="inline h-4 w-4 mr-2" />
                Nome Completo
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-2" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Lock className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
                <DialogDescription>
                  Digite sua nova senha abaixo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
                <Button onClick={handleChangePassword} className="w-full">
                  Alterar Senha
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {role === "Owner" && (
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-muted-foreground" />
              <CardTitle>🧪 Teste de Roles (Desenvolvimento)</CardTitle>
            </div>
            <CardDescription>
              Adicione roles temporariamente para testar diferentes visões do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Roles Ativas</Label>
              <div className="flex flex-wrap gap-2 mb-4">
                {currentRoles.length > 0 ? (
                  currentRoles.map((r) => (
                    <Badge key={r.role_id} variant="secondary" className="gap-2">
                      {r.role_name}
                      {r.role_name !== "Owner" && (
                        <button
                          onClick={() => handleRemoveRole(r.role_id)}
                          disabled={testLoading}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma role ativa</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Adicionar Role para Teste</Label>
              <div className="flex flex-wrap gap-2">
                {availableRoles
                  .filter(r => !currentRoles.find(cr => cr.role_id === r.id))
                  .map((role) => (
                    <Button
                      key={role.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddRole(role.id)}
                      disabled={testLoading}
                    >
                      + {role.name}
                    </Button>
                  ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleResetToOwner}
                disabled={testLoading}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Resetar para Owner Apenas
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Como usar:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Clique em "+ Nome da Role" para adicionar</li>
                <li>A página será recarregada automaticamente</li>
                <li>Você verá a interface daquela role</li>
                <li>Use "Resetar" para voltar apenas para Owner</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Configuracoes;
