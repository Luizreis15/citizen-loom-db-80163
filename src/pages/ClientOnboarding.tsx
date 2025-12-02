import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingFormField } from "@/components/onboarding/OnboardingFormField";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Save, Send } from "lucide-react";
import { ClientPortalSidebar } from "@/components/ClientPortalSidebar";
import type { Json } from "@/integrations/supabase/types";

interface FieldSchema {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  sensitive?: boolean;
}

interface SectionSchema {
  id: string;
  step: number;
  title: string;
  description?: string;
  fields: FieldSchema[];
}

interface TemplateSchema {
  sections: SectionSchema[];
}

export default function ClientOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [instance, setInstance] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [schema, setSchema] = useState<TemplateSchema | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, { name: string; url: string }>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (user) {
      fetchOnboarding();
    }
  }, [user]);

  const fetchOnboarding = async () => {
    try {
      // Buscar profile com client_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user!.id)
        .single();

      if (!profile?.client_id) {
        toast.error("Cliente não encontrado");
        return;
      }

      // Buscar instância de onboarding do cliente
      const { data: instanceData, error: instanceError } = await supabase
        .from("onboarding_instances")
        .select(`
          *,
          onboarding_templates (*)
        `)
        .eq("client_id", profile.client_id)
        .single();

      if (instanceError) {
        if (instanceError.code === "PGRST116") {
          toast.error("Onboarding não iniciado. Entre em contato com o administrador.");
        } else {
          throw instanceError;
        }
        return;
      }

      setInstance(instanceData);
      setTemplate(instanceData.onboarding_templates);
      
      const parsedSchema = instanceData.onboarding_templates.schema as unknown as TemplateSchema;
      setSchema(parsedSchema);
      setCurrentStep(instanceData.current_step || 0);

      // Buscar respostas existentes
      const { data: responses } = await supabase
        .from("onboarding_responses")
        .select("*")
        .eq("onboarding_instance_id", instanceData.id);

      if (responses) {
        const dataMap: Record<string, string> = {};
        responses.forEach((r) => {
          if (!r.is_sensitive) {
            dataMap[r.field_key] = r.value || "";
          }
        });
        setFormData(dataMap);
      }

      // Buscar arquivos existentes
      const { data: attachments } = await supabase
        .from("onboarding_attachments")
        .select("*")
        .eq("onboarding_instance_id", instanceData.id);

      if (attachments) {
        const filesMap: Record<string, { name: string; url: string }> = {};
        attachments.forEach((a) => {
          filesMap[a.field_key] = { name: a.file_name, url: a.file_url };
        });
        setFiles(filesMap);
      }

      // Calcular steps completos
      calculateCompletedSteps(parsedSchema, responses || [], attachments || []);
    } catch (error) {
      console.error("Error fetching onboarding:", error);
      toast.error("Erro ao carregar onboarding");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletedSteps = (
    schemaData: TemplateSchema,
    responses: any[],
    attachments: any[]
  ) => {
    const completed: number[] = [];
    const responseMap = new Map(responses.map((r) => [r.field_key, r.value]));
    const attachmentMap = new Map(attachments.map((a) => [a.field_key, true]));

    schemaData.sections.forEach((section, index) => {
      const requiredFields = section.fields.filter((f) => f.required);
      const allFilled = requiredFields.every((f) => {
        if (f.type === "file") {
          return attachmentMap.has(f.key);
        }
        return responseMap.get(f.key);
      });
      if (allFilled && requiredFields.length > 0) {
        completed.push(index);
      }
    });

    setCompletedSteps(completed);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (key: string, file: File | null) => {
    if (!file) {
      // Remover arquivo
      const existingFile = files[key];
      if (existingFile) {
        await supabase.storage.from("onboarding-files").remove([existingFile.url]);
        await supabase
          .from("onboarding_attachments")
          .delete()
          .eq("onboarding_instance_id", instance.id)
          .eq("field_key", key);
      }
      setFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[key];
        return newFiles;
      });
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${instance.id}/${key}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("onboarding-files")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("onboarding-files")
        .getPublicUrl(fileName);

      // Salvar referência no banco
      await supabase.from("onboarding_attachments").upsert({
        onboarding_instance_id: instance.id,
        field_key: key,
        section: schema!.sections[currentStep].id,
        file_name: file.name,
        file_url: fileName,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: user!.id,
      }, { onConflict: "onboarding_instance_id,field_key" });

      setFiles((prev) => ({
        ...prev,
        [key]: { name: file.name, url: fileName },
      }));

      toast.success("Arquivo enviado!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar arquivo");
    }
  };

  const saveCurrentStep = async () => {
    if (!schema || !instance) return;

    setSaving(true);
    try {
      const currentSection = schema.sections[currentStep];

      for (const field of currentSection.fields) {
        if (field.type === "file") continue;

        const value = formData[field.key] || "";

        if (field.sensitive && value) {
          // Criptografar campo sensível
          const { error } = await supabase.functions.invoke("onboarding-encrypt-sensitive", {
            body: {
              onboarding_instance_id: instance.id,
              field_key: field.key,
              value: value,
              section: currentSection.id,
            },
          });

          if (error) throw error;
        } else {
          // Salvar campo normal
          await supabase.from("onboarding_responses").upsert({
            onboarding_instance_id: instance.id,
            field_key: field.key,
            section: currentSection.id,
            value: value,
            is_sensitive: false,
          }, { onConflict: "onboarding_instance_id,field_key" });
        }
      }

      // Atualizar current_step
      await supabase
        .from("onboarding_instances")
        .update({ current_step: currentStep })
        .eq("id", instance.id);

      toast.success("Progresso salvo!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await saveCurrentStep();
    if (schema && currentStep < schema.sections.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    await saveCurrentStep();

    setSubmitting(true);
    try {
      await supabase
        .from("onboarding_instances")
        .update({
          status: "Concluído",
          completed_at: new Date().toISOString(),
        })
        .eq("id", instance.id);

      toast.success("Onboarding enviado com sucesso!");
      navigate("/client-portal/dashboard");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Erro ao enviar onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <ClientPortalSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!instance || !schema) {
    return (
      <div className="flex h-screen">
        <ClientPortalSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Onboarding não disponível</CardTitle>
              <CardDescription>
                Seu onboarding ainda não foi iniciado. Entre em contato com o administrador.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (instance.status === "Concluído" || instance.status === "Aprovado") {
    return (
      <div className="flex h-screen">
        <ClientPortalSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>
                {instance.status === "Aprovado" ? "Onboarding Aprovado!" : "Onboarding Enviado!"}
              </CardTitle>
              <CardDescription>
                {instance.status === "Aprovado"
                  ? "Seu onboarding foi revisado e aprovado pela equipe."
                  : "Seu onboarding foi enviado e está aguardando revisão."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const currentSection = schema.sections[currentStep];
  const isLastStep = currentStep === schema.sections.length - 1;

  return (
    <div className="flex h-screen">
      <ClientPortalSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container max-w-4xl py-8 px-4">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Onboarding</h1>
            <p className="text-muted-foreground">
              Preencha as informações para configurarmos sua conta
            </p>
          </div>

          <OnboardingProgress
            steps={schema.sections.map((s) => ({ key: s.id, title: s.title }))}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>{currentSection.title}</CardTitle>
              {currentSection.description && (
                <CardDescription>{currentSection.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {currentSection.fields.map((field) => (
                <OnboardingFormField
                  key={field.key}
                  field={field}
                  value={formData[field.key] || ""}
                  onChange={handleFieldChange}
                  onFileUpload={handleFileUpload}
                  fileInfo={files[field.key]}
                />
              ))}

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={saveCurrentStep} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Rascunho
                  </Button>

                  {isLastStep ? (
                    <Button onClick={handleSubmit} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Finalizar e Enviar
                    </Button>
                  ) : (
                    <Button onClick={handleNext} disabled={saving}>
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
