import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Briefcase, Award, TrendingUp, Megaphone, Rocket, Palette, Zap, Check } from "lucide-react";
import samiraImage from "@/assets/samira-gouvea.png";

export default function Fundadora() {
  const expertise = [
    { icon: <TrendingUp className="h-6 w-6" />, title: "Gestão de Tráfego Pago" },
    { icon: <Megaphone className="h-6 w-6" />, title: "Social Media Estratégico" },
    { icon: <Rocket className="h-6 w-6" />, title: "Lançamentos Digitais" },
    { icon: <Zap className="h-6 w-6" />, title: "Infoprodutos" },
    { icon: <Palette className="h-6 w-6" />, title: "Branding" },
    { icon: <Award className="h-6 w-6" />, title: "Funis de Conversão" },
  ];

  const achievements = [
    "MBA pela Fundação Getulio Vargas (FGV)",
    "Mais de 6 anos de experiência em marketing digital",
    "100+ projetos entregues com sucesso",
    "Especialização em tráfego pago e lançamentos",
    "Mentora de empreendedores digitais",
    "Palestrante em eventos de marketing",
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="relative bg-[hsl(var(--dark-bg))] text-white py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-50" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Foto da Samira */}
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary to-secondary p-1">
                <img 
                  src={samiraImage} 
                  alt="Samira Gouvea - Fundadora Digital Hera" 
                  className="w-full h-full rounded-2xl object-cover"
                />
              </div>
            </div>

            {/* Informações */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold">Samira Gouvea</h1>
              <p className="text-xl text-secondary">Fundadora & Estrategista de Marketing Digital</p>
              
              <div className="flex flex-wrap gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                  <GraduationCap className="h-5 w-5 text-secondary" />
                  <span className="text-sm">MBA pela FGV</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                  <Briefcase className="h-5 w-5 text-secondary" />
                  <span className="text-sm">6+ Anos de Experiência</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                  <Award className="h-5 w-5 text-secondary" />
                  <span className="text-sm">100+ Projetos Entregues</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Introdução */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6 text-lg text-muted-foreground">
            <p>
              Olá! Sou Samira Gouvea, fundadora da Digital Hera e apaixonada por transformar negócios através do marketing digital estratégico.
            </p>
            <p>
              Minha jornada no marketing começou há mais de 6 anos, quando percebi o poder que uma estratégia digital bem executada tem de transformar completamente um negócio. Desde então, dediquei minha carreira a estudar, testar e aplicar as melhores práticas do mercado.
            </p>
          </div>
        </div>
      </section>

      {/* Trajetória */}
      <section className="py-20 bg-[hsl(var(--light-bg))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-8 space-y-4">
                <GraduationCap className="h-10 w-10 text-primary" />
                <h3 className="text-2xl font-bold">Formação Acadêmica</h3>
                <p className="text-muted-foreground">
                  MBA em Marketing pela Fundação Getulio Vargas (FGV), uma das instituições mais renomadas da América Latina.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardContent className="p-8 space-y-4">
                <Briefcase className="h-10 w-10 text-primary" />
                <h3 className="text-2xl font-bold">Experiência Prática</h3>
                <p className="text-muted-foreground">
                  Mais de 6 anos atuando diretamente com estratégias de marketing digital, gestão de tráfego, social media e lançamentos. Já ajudei a alavancar dezenas de negócios de diferentes segmentos e portes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Áreas de Expertise */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Áreas de Expertise</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {expertise.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Filosofia de Trabalho */}
      <section className="py-20 bg-[hsl(var(--dark-bg))] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8">Filosofia de Trabalho</h2>
            <p className="text-lg text-gray-300">
              Acredito que marketing digital não é sobre truques ou fórmulas mágicas. É sobre entender profundamente seu público, criar valor real e construir relacionamentos genuínos.
            </p>
            <p className="text-lg text-gray-300">
              Minha abordagem é sempre consultiva e personalizada. Não existe estratégia única que funcione para todos os negócios. Por isso, cada projeto começa com uma imersão profunda no seu negócio, seus desafios e seus objetivos.
            </p>
            <p className="text-lg text-gray-300">
              Trabalho com foco total em resultados mensuráveis. Cada ação é pensada para gerar ROI e cada campanha é constantemente otimizada baseada em dados reais.
            </p>
          </div>
        </div>
      </section>

      {/* Conquistas */}
      <section className="py-20 bg-[hsl(var(--light-bg))]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-center">Conquistas</h2>
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-secondary shrink-0 mt-0.5" />
                  <span className="text-lg text-muted-foreground">{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Missão Pessoal + CTA */}
      <section className="py-20 bg-gradient-to-br from-background to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold">Missão Pessoal</h2>
            <p className="text-lg text-muted-foreground">
              Minha missão é democratizar o acesso a estratégias de marketing digital de alto nível. Acredito que todo negócio, independente do tamanho, merece ter acesso às melhores práticas do mercado.
            </p>
            <p className="text-lg text-muted-foreground">
              Através da Digital Hera, trabalho para transformar a presença digital de negócios em ativos que geram resultados reais e sustentáveis. Cada cliente é tratado como um parceiro, e seu sucesso é a minha maior realização.
            </p>
            <div className="pt-4">
              <Link to="/contato">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-white text-base px-8">
                  Agendar Conversa com Samira
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
