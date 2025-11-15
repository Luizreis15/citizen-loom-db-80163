import { supabase } from "@/integrations/supabase/client";

// ============================================
// 🧪 HELPER PARA TESTES DE ROLES
// USO: Apenas para desenvolvimento/testes
// Permite ao Owner adicionar/remover roles
// temporariamente para testar diferentes visões
// ============================================

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export const getRoles = async (): Promise<Role[]> => {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('id');
  
  if (error) throw error;
  return data || [];
};

export const getUserRoles = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_user_roles', { _user_id: userId });
  
  if (error) throw error;
  return data || [];
};

export const addTestRole = async (userId: string, roleId: number) => {
  // Verificar se role já existe
  const { data: existing } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .single();
  
  if (existing) {
    throw new Error('Role já existe para este usuário');
  }
  
  const { data, error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, role_id: roleId })
    .select();
  
  if (error) throw error;
  return data;
};

export const removeTestRole = async (userId: string, roleId: number) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);
  
  if (error) throw error;
};

export const removeAllRolesExcept = async (userId: string, keepRoleIds: number[]) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .not('role_id', 'in', `(${keepRoleIds.join(',')})`);
  
  if (error) throw error;
};
