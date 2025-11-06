import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Clock, Instagram, Linkedin, Facebook, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contato() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
    budget: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Mensagem enviada!",
      description: "Entraremos em contato em breve.",
    });

    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      service: "",
      message: "",
      budget: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="relative bg-[hsl(var(--dark-bg))] text-white py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              Vamos Conversar Sobre Seu{" "}
              <span className="text-secondary">Projeto Digital?</span>
            </h1>
            <p className="text-xl text-gray-300">
              Entre em contato e descubra como podemos transformar seu negócio
            </p>
          </div>
        </div>
      </section>

      {/* Formulário e Informações */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Formulário */}
            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome Completo *</label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <Input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone (WhatsApp)</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="(XX) XXXXX-XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Empresa/Negócio</label>
                    <Input
                      value={formData.company}
                      onChange={(e) => handleChange("company", e.target.value)}
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Serviço de Interesse *</label>
                    <Select required value={formData.service} onValueChange={(value) => handleChange("service", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social-media">Social Media</SelectItem>
                        <SelectItem value="trafego">Gestão de Tráfego</SelectItem>
                        <SelectItem value="infoprodutos">Infoprodutos</SelectItem>
                        <SelectItem value="lancamentos">Lançamentos</SelectItem>
                        <SelectItem value="branding">Branding</SelectItem>
                        <SelectItem value="consultoria">Consultoria</SelectItem>
                        <SelectItem value="whatsapp">Funis WhatsApp</SelectItem>
                        <SelectItem value="locais">Negócios Locais</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Orçamento Mensal (opcional)</label>
                    <Select value={formData.budget} onValueChange={(value) => handleChange("budget", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ate-2k">Até R$ 2.000</SelectItem>
                        <SelectItem value="2k-5k">R$ 2.000 - R$ 5.000</SelectItem>
                        <SelectItem value="5k-10k">R$ 5.000 - R$ 10.000</SelectItem>
                        <SelectItem value="acima-10k">Acima de R$ 10.000</SelectItem>
                        <SelectItem value="nao-informar">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Mensagem *</label>
                    <Textarea
                      required
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder="Conte-nos sobre seu projeto"
                      rows={5}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-secondary hover:bg-secondary/90 text-white">
                    Enviar Mensagem
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Informações de Contato */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Informações de Contato</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-muted-foreground">contato@digitalhera.com.br</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">WhatsApp</h3>
                      <p className="text-muted-foreground">(XX) XXXXX-XXXX</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Clock className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">Horário de Atendimento</h3>
                      <p className="text-muted-foreground">Segunda a Sexta: 9h às 18h</p>
                      <p className="text-muted-foreground">Sábado: 9h às 13h</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Redes Sociais</h3>
                <div className="flex gap-4">
                  <a
                    href="https://instagram.com/digitalhera.mkt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <Instagram className="h-6 w-6" />
                  </a>
                  <a
                    href="https://linkedin.com/company/digitalhera"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <Linkedin className="h-6 w-6" />
                  </a>
                  <a
                    href="https://facebook.com/digitalhera"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                  </a>
                </div>
              </div>

              {/* Cards de Contato Alternativo */}
              <div className="space-y-4 pt-8">
                <Card className="border-primary/30 hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <MessageCircle className="h-8 w-8 text-[#25D366]" />
                        <div>
                          <h3 className="font-semibold">WhatsApp</h3>
                          <p className="text-sm text-muted-foreground">Atendimento rápido e personalizado</p>
                        </div>
                      </div>
                      <a
                        href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20Digital%20Hera."
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="bg-[#25D366] hover:bg-[#20BA5A] text-white">
                          Iniciar Conversa
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/30 hover:border-primary transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Mail className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="font-semibold">Email</h3>
                          <p className="text-sm text-muted-foreground">contato@digitalhera.com.br</p>
                        </div>
                      </div>
                      <a href="mailto:contato@digitalhera.com.br">
                        <Button size="sm" variant="outline" className="border-primary text-primary">
                          Enviar Email
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="py-20 bg-gradient-to-br from-[hsl(var(--light-bg))] to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Falar com Especialista no WhatsApp</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Prefere um atendimento mais direto? Clique no botão abaixo e fale diretamente com nossa equipe pelo WhatsApp.
          </p>
          <a
            href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20Digital%20Hera."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-[#25D366] hover:bg-[#20BA5A] text-white">
              <MessageCircle className="mr-2 h-5 w-5" />
              Chamar no WhatsApp
            </Button>
          </a>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
