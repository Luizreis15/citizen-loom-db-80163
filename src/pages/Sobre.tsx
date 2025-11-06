import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Award, TrendingUp, Shield, Users, Heart, Lightbulb } from "lucide-react";

export default function Sobre() {
  const mission = {
    icon: <Target className="h-10 w-10 text-secondary" />,
    title: "Nossa Missão",
    description: "Empoderar negócios através de estratégias de marketing digital que geram resultados reais e mensuráveis, transformando presença online em crescimento sustentável.",
  };

  const vision = {
    icon: <Eye className="h-10 w-10 text-secondary" />,
    title: "Nossa Visão",
    description: "Ser referência em marketing digital estratégico, reconhecida pela excelência na entrega de resultados e pela transformação que geramos nos negócios dos nossos clientes.",
  };

  const values = [
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: "Resultados Acima de Tudo",
      description: "Cada estratégia é pensada para gerar ROI mensurável",
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Transparência Total",
      description: "Relatórios claros e comunicação honesta em todas as etapas",
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-primary" />,
      title: "Inovação Constante",
      description: "Sempre atualizados com as últimas tendências e ferramentas",
    },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: "Parceria Verdadeira",
      description: "Seu sucesso é o nosso sucesso",
    },
  ];

  const differentials = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Abordagem Consultiva",
      description: "Não vendemos pacotes prontos. Criamos estratégias personalizadas para seu negócio",
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: "Expertise Comprovada",
      description: "MBA pela FGV e mais de 6 anos de experiência prática no mercado",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Foco em ROI",
      description: "Cada real investido é pensado para gerar retorno mensurável",
    },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: "Atendimento Humanizado",
      description: "Você não é apenas mais um cliente. Somos parceiros na sua jornada",
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
              Somos a <span className="text-secondary">Digital Hera</span>
            </h1>
            <p className="text-xl text-gray-300">
              Transformando negócios através do marketing digital estratégico
            </p>
          </div>
        </div>
      </section>

      {/* Introdução */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6 text-lg text-muted-foreground">
            <p>
              Fundada com a missão de democratizar o acesso a estratégias de marketing digital de alto nível, a Digital Hera nasceu da experiência e paixão de Samira Gouvea, profissional com mais de 6 anos de mercado e MBA pela Fundação Getulio Vargas.
            </p>
            <p>
              Ao longo dos anos, percebemos que muitos negócios têm potencial incrível, mas não sabem como se posicionar digitalmente ou como transformar sua presença online em vendas reais. Foi aí que decidimos criar a Digital Hera: uma agência que une estratégia, criatividade e tecnologia para gerar resultados mensuráveis.
            </p>
            <p>
              Não somos apenas executores. Somos parceiros estratégicos que entendem seu negócio, seus desafios e suas ambições. Cada projeto é tratado com atenção personalizada, porque acreditamos que não existe fórmula mágica – existe estratégia bem executada.
            </p>
          </div>
        </div>
      </section>

      {/* Missão e Visão */}
      <section className="py-20 bg-[hsl(var(--dark-bg))] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[mission, vision].map((item, index) => (
              <Card key={index} className="bg-white/5 border-primary/30 hover:bg-white/10 transition-all">
                <CardContent className="p-8 space-y-4">
                  {item.icon}
                  <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                  <p className="text-gray-300">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-20 bg-[hsl(var(--light-bg))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Nossos Valores</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    {value.icon}
                    <h3 className="text-xl font-semibold">{value.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-20 bg-[hsl(var(--dark-bg))] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Por Que Somos Diferentes</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {differentials.map((item, index) => (
              <Card key={index} className="bg-white/5 border-primary/30 hover:bg-white/10 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    {item.icon}
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-gray-300">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
