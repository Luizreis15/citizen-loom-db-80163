

## Plano de Automação do Onboarding

### Passo 1: Adicionar campo `client_type` ao formulário de cliente
- Adicionar um `Select` na aba "Dados" do `ClientFormDialog.tsx`
- Opções: Completo, Expert, Gestão de Tráfego, Negócio Local, Social Media
- Campo obrigatório para novos clientes (opcional na edição)
- Salvar o `client_type` ao criar/atualizar cliente

### Passo 2: Criar trigger SQL para automação
```sql
CREATE OR REPLACE FUNCTION public.auto_create_onboarding_instance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  template_uuid UUID;
BEGIN
  -- Só cria se client_type estiver definido e for INSERT (novo cliente)
  IF NEW.client_type IS NOT NULL THEN
    -- Buscar o template correspondente ao client_type
    SELECT id INTO template_uuid 
    FROM onboarding_templates 
    WHERE client_type = NEW.client_type AND is_active = true
    LIMIT 1;
    
    -- Se encontrou template, criar instância de onboarding
    IF template_uuid IS NOT NULL THEN
      INSERT INTO onboarding_instances (client_id, template_id, status, current_step)
      VALUES (NEW.id, template_uuid, 'Nao_Iniciado', 1)
      ON CONFLICT DO NOTHING; -- Evita duplicatas
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para novos clientes
CREATE TRIGGER on_client_created_create_onboarding
  AFTER INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_onboarding_instance();

-- Trigger para atualização de client_type (quando admin define depois)
CREATE TRIGGER on_client_type_updated_create_onboarding
  AFTER UPDATE OF client_type ON clients
  FOR EACH ROW
  WHEN (OLD.client_type IS NULL AND NEW.client_type IS NOT NULL)
  EXECUTE FUNCTION auto_create_onboarding_instance();
```

### Passo 3: Atualizar `ClientFormDialog.tsx`
- Adicionar state para `client_type`
- Adicionar campo Select com os 5 tipos de cliente
- Incluir `client_type` no INSERT do cliente
- Buscar `client_type` existente ao editar cliente

### Resultado Esperado
1. ✅ Admin seleciona tipo do cliente ao cadastrar
2. ✅ Trigger cria automaticamente a instância de onboarding
3. ✅ Cliente pode acessar onboarding imediatamente após ativação
4. ✅ Se admin editar e definir `client_type` depois, onboarding também é criado
5. ✅ Nunca mais teremos o problema do Growup

