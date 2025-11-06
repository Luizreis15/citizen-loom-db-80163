import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ArrowRight, Target, Award, TrendingUp, Users, BarChart, Megaphone, Rocket, Palette, Lightbulb, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const [counters, setCounters] = useState({ years: 0, projects: 0, roi: 0, satisfaction: 0 });

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const targets = { years: 6, projects: 100, roi: 500, satisfaction: 95 };
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setCounters({
        years: Math.floor(targets.years * progress),
        projects: Math.floor(targets.projects * progress),
        roi: Math.floor(targets.roi * progress),
        satisfaction: Math.floor(targets.satisfaction * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounters(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const benefits = [
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: "Abordagem estratégica baseada em dados",
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: "Expertise comprovada com MBA pela FGV",
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Foco total em ROI e resultados mensuráveis",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Atendimento personalizado e consultivo",
    },
  ];

  const services = [
    {
      icon: <Megaphone className="h-6 w-6" />,
      title: "Social Media",
      description: "Construa uma presença digital marcante. Criamos conteúdo estratégico que engaja, educa e converte seu público em clientes fiéis.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Gestão de Tráfego",
      description: "Invista seu orçamento de forma inteligente. Campanhas otimizadas para maximizar ROI e escalar seus resultados.",
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Infoprodutos & Expert Digitais",
      description: "Transforme seu conhecimento em um negócio lucrativo. Estruturamos e vendemos seus produtos digitais.",
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Lançamentos",
      description: "Estratégias de lançamento que geram buzz e vendas. Do pré-lançamento ao pós-venda.",
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Branding & Identidade Visual",
      description: "Sua marca é sua maior vantagem. Desenvolvemos identidades visuais memoráveis e diferenciadas.",
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Funis Inteligentes para WhatsApp",
      description: "Automatize suas vendas sem perder o toque humano. Funis de conversação que fecham vendas.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="relative bg-[hsl(var(--dark-bg))] text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
              <span className="text-sm font-medium">✨ Transformação Digital de Resultados</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Transforme Seu Negócio em uma{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Máquina de Resultados Digitais
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Estratégias de marketing digital que convertem visitantes em clientes fiéis. Mais de 6 anos impulsionando negócios através de social media, tráfego pago e funis inteligentes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contato">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white text-base px-8">
                  Agendar Consultoria Gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/servicos">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white text-base px-8">
                  Conhecer Nossos Serviços
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[hsl(var(--dark-bg))] border-t border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: counters.years, suffix: "+", label: "Anos de Experiência" },
              { value: counters.projects, suffix: "+", label: "Projetos Entregues" },
              { value: counters.roi, suffix: "%", label: "ROI Médio" },
              { value: counters.satisfaction, suffix: "%", label: "Clientes Satisfeitos" },
            ].map((stat, index) => (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl lg:text-5xl font-bold text-secondary mb-2">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-sm text-gray-300">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-[hsl(var(--light-bg))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
              Por Que Escolher a Digital Hera?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Expertise, estratégia e resultados mensuráveis para o seu negócio
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 flex items-start gap-4">
                  {benefit.icon}
                  <p className="text-base font-medium text-foreground">{benefit.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-[hsl(var(--dark-bg))] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Nossos Serviços</h2>
            <p className="text-lg text-gray-300">
              Soluções completas para impulsionar seu crescimento digital
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="bg-white/5 border-primary/30 hover:bg-white/10 hover:border-primary transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="inline-flex p-3 rounded-lg bg-primary/20 text-primary">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                  <p className="text-sm text-gray-300">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/servicos">
              <Button variant="outline" size="lg" className="border-secondary text-secondary hover:bg-secondary hover:text-white">
                Ver Todos os Serviços
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[hsl(var(--light-bg))] to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
            Pronto Para Transformar Seu Negócio Digital?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Agende uma consultoria gratuita e descubra como podemos impulsionar seus resultados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/5511999999999?text=Olá!%20Gostaria%20de%20saber%20mais%20sobre%20os%20serviços%20da%20Digital%20Hera."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white text-base px-8">
                Falar com Especialista no WhatsApp
              </Button>
            </a>
            <Link to="/contato">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white text-base px-8">
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
