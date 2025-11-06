import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Megaphone, TrendingUp, Lightbulb, Rocket, Palette, MessageSquare, Users, MapPin } from "lucide-react";

export default function Servicos() {
  const services = [
    {
      id: "social-media",
      icon: <Megaphone className="h-10 w-10 text-primary" />,
      title: "Social Media",
      description: "Construa uma presença digital marcante e engajadora. Criamos estratégias de conteúdo que educam, entretêm e convertem seu público em clientes fiéis.",
      items: [
        "Planejamento estratégico de conteúdo",
        "Criação de posts e stories",
        "Gestão de comunidade",
        "Análise de métricas e otimização",
        "Calendário editorial personalizado",
      ],
    },
    {
      id: "trafego",
      icon: <TrendingUp className="h-10 w-10 text-primary" />,
      title: "Gestão de Tráfego",
      description: "Invista seu orçamento de publicidade de forma inteligente. Criamos e otimizamos campanhas pagas que maximizam seu ROI e escalam seus resultados.",
      items: [
        "Campanhas no Meta Ads (Facebook e Instagram)",
        "Google Ads (Search, Display, YouTube)",
        "Otimização de conversão",
        "Testes A/B contínuos",
        "Relatórios detalhados de performance",
      ],
    },
    {
      id: "infoprodutos",
      icon: <Lightbulb className="h-10 w-10 text-primary" />,
      title: "Infoprodutos & Expert Digitais",
      description: "Transforme seu conhecimento em um negócio digital lucrativo. Estruturamos, posicionamos e vendemos seus produtos digitais com estratégias comprovadas.",
      items: [
        "Posicionamento de autoridade",
        "Estruturação de produtos digitais",
        "Funis de vendas automatizados",
        "Estratégias de lançamento",
        "Gestão de tráfego para infoprodutos",
      ],
    },
    {
      id: "lancamentos",
      icon: <Rocket className="h-10 w-10 text-primary" />,
      title: "Lançamentos",
      description: "Estratégias de lançamento que geram expectativa, engajamento e vendas explosivas. Do pré-lançamento ao pós-venda, cuidamos de cada detalhe.",
      items: [
        "Planejamento de lançamento completo",
        "Criação de materiais (páginas, emails, anúncios)",
        "Gestão de tráfego durante o lançamento",
        "Automações de email marketing",
        "Análise e otimização em tempo real",
      ],
    },
    {
      id: "branding",
      icon: <Palette className="h-10 w-10 text-primary" />,
      title: "Branding & Identidade Visual",
      description: "Sua marca é sua maior vantagem competitiva. Desenvolvemos identidades visuais memoráveis que comunicam seus valores e diferenciam você da concorrência.",
      items: [
        "Desenvolvimento de identidade visual",
        "Manual de marca",
        "Materiais de comunicação",
        "Aplicações em redes sociais",
        "Consultoria de posicionamento",
      ],
    },
    {
      id: "consultorias",
      icon: <Users className="h-10 w-10 text-primary" />,
      title: "Consultorias de Marketing",
      description: "Orientação estratégica personalizada para impulsionar seu negócio. Analisamos seu cenário atual e traçamos um plano de ação claro e executável.",
      items: [
        "Diagnóstico completo do negócio",
        "Análise de concorrência",
        "Plano estratégico personalizado",
        "Sessões de mentoria",
        "Suporte na implementação",
      ],
    },
    {
      id: "whatsapp",
      icon: <MessageSquare className="h-10 w-10 text-primary" />,
      title: "Funis Inteligentes para WhatsApp",
      description: "Automatize suas vendas sem perder o toque humano. Criamos funis de conversação que qualificam leads e fecham vendas pelo WhatsApp.",
      items: [
        "Estruturação de funis de conversação",
        "Integração com CRM",
        "Automações inteligentes",
        "Scripts de vendas otimizados",
        "Treinamento da equipe",
      ],
    },
    {
      id: "locais",
      icon: <MapPin className="h-10 w-10 text-primary" />,
      title: "Negócios Locais",
      description: "Estratégias específicas para negócios locais dominarem sua região. Aumente sua visibilidade e atraia mais clientes da sua área.",
      items: [
        "Google Meu Negócio otimizado",
        "Campanhas locais de tráfego",
        "Gestão de avaliações",
        "Conteúdo geo-localizado",
        "Estratégias de fidelização",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="relative bg-[hsl(var(--dark-bg))] text-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
              Soluções Completas Para Seu{" "}
              <span className="text-secondary">Crescimento Digital</span>
            </h1>
            <p className="text-xl text-gray-300">
              Serviços estratégicos que transformam sua presença online em resultados reais
            </p>
          </div>
        </div>
      </section>

      {/* Serviços com Tabs */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="social-media" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 h-auto p-2 bg-muted">
              {services.slice(0, 8).map((service) => (
                <TabsTrigger key={service.id} value={service.id} className="text-sm">
                  {service.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {services.map((service) => (
              <TabsContent key={service.id} value={service.id} className="mt-8">
                <Card className="border-primary/30">
                  <CardContent className="p-8 lg:p-12">
                    <div className="grid lg:grid-cols-2 gap-8 items-start">
                      <div className="space-y-6">
                        <div className="inline-flex p-4 rounded-lg bg-primary/10">
                          {service.icon}
                        </div>
                        <h2 className="text-3xl font-bold">{service.title}</h2>
                        <p className="text-lg text-muted-foreground">{service.description}</p>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-4">O que inclui:</h3>
                        <ul className="space-y-3">
                          {service.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[hsl(var(--light-bg))] to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Pronto Para Começar?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Agende uma consultoria gratuita e descubra qual serviço é ideal para o seu negócio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20Digital%20Hera."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white">
                Falar com Especialista
              </Button>
            </a>
            <Link to="/contato">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                Agendar Consultoria
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
