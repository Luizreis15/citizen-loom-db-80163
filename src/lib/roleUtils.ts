// Função que identifica se um role é de colaborador (operacional)
export function isCollaboratorRole(role: string | null): boolean {
  if (!role) return false;
  
  const collaboratorRoles = [
    "Colaborador",
    "Editor de Vídeo",
    "Social Mídia",
    "Webdesigner",
    "Administrativo",
    "Finance"
  ];
  
  return collaboratorRoles.includes(role);
}

// Função que identifica se um role é de admin
export function isAdminRole(role: string | null): boolean {
  if (!role) return false;
  return role === "Owner" || role === "Admin";
}

// Função que identifica se um role é de cliente
export function isClientRole(role: string | null): boolean {
  if (!role) return false;
  return role === "Cliente";
}
