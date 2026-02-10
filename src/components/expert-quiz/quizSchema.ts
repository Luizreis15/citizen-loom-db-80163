export type QuizFieldType = 'text' | 'textarea' | 'email' | 'url' | 'phone' | 'single-select' | 'multi-select';

export interface QuizQuestion {
  key: string;
  label: string;
  type: QuizFieldType;
  options?: string[];
  required?: boolean;
  block: string;
  blockLabel: string;
  showWhen?: { field: string; includes: string };
  placeholder?: string;
}

export const QUIZ_BLOCKS = [
  { id: 'bloco_0', label: 'Consentimento' },
  { id: 'bloco_1', label: 'Dados Básicos' },
  { id: 'bloco_2', label: 'Maturidade' },
  { id: 'bloco_3', label: 'Tema, Promessa e Público' },
  { id: 'bloco_4', label: 'Oferta e Formato' },
  { id: 'bloco_5', label: 'Ticket e Objetivo' },
  { id: 'bloco_6', label: 'Autoridade e Provas' },
  { id: 'bloco_7', label: 'Audiência e Canais' },
  { id: 'bloco_8', label: 'Restrições' },
  { id: 'bloco_9', label: 'Operação e Execução' },
  { id: 'bloco_10', label: 'Confirmação e Escopo' },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Bloco 1 — Dados básicos
  {
    key: 'nome_completo',
    label: 'Qual é o seu nome completo?',
    type: 'text',
    required: true,
    block: 'bloco_1',
    blockLabel: 'Dados Básicos',
    placeholder: 'Digite seu nome completo',
  },
  {
    key: 'email',
    label: 'Qual o seu melhor e-mail?',
    type: 'email',
    required: true,
    block: 'bloco_1',
    blockLabel: 'Dados Básicos',
    placeholder: 'seu@email.com',
  },
  {
    key: 'whatsapp',
    label: 'Qual o seu WhatsApp? (com DDD)',
    type: 'phone',
    block: 'bloco_1',
    blockLabel: 'Dados Básicos',
    placeholder: '(11) 99999-9999',
  },
  {
    key: 'cidade_estado_pais',
    label: 'Qual a cidade/estado e país do seu público principal?',
    type: 'text',
    block: 'bloco_1',
    blockLabel: 'Dados Básicos',
    placeholder: 'Ex: São Paulo/SP - Brasil',
  },
  {
    key: 'link_instagram',
    label: 'Link do seu Instagram (se tiver)',
    type: 'url',
    block: 'bloco_1',
    blockLabel: 'Dados Básicos',
    placeholder: 'https://instagram.com/seuperfil',
  },
  {
    key: 'link_youtube',
    label: 'Link do seu YouTube (se tiver)',
    type: 'url',
    block: 'bloco_1',
    blockLabel: 'Dados Básicos',
    placeholder: 'https://youtube.com/@seucanal',
  },
  {
    key: 'link_site',
    label: 'Link do seu site (se tiver)',
    type: 'url',
    block: 'bloco_1',
    blockLabel: 'Dados Básicos',
    placeholder: 'https://seusite.com.br',
  },
  {
    key: 'link_linkedin',
    label: 'Link do seu LinkedIn (se tiver)',
    type: 'url',
    block: 'bloco_1',
    blockLabel: 'Dados Básicos',
    placeholder: 'https://linkedin.com/in/seuperfil',
  },

  // Bloco 2 — Maturidade
  {
    key: 'fase_atual',
    label: 'Em qual fase você está hoje?',
    type: 'single-select',
    required: true,
    block: 'bloco_2',
    blockLabel: 'Maturidade',
    options: [
      'Ideia inicial (nunca vendi)',
      'Tenho audiência, nunca vendi produto',
      'Já vendi informal (serviço/mentoria)',
      'Já tenho infoproduto (quero estruturar/escalar)',
      'Já tenho esteira (otimizar)',
    ],
  },
  {
    key: 'materiais_prontos',
    label: 'Você já tem algo pronto? (pode marcar vários)',
    type: 'multi-select',
    block: 'bloco_2',
    blockLabel: 'Maturidade',
    options: [
      'Conteúdo gravado',
      'Aulas ao vivo estruturadas',
      'Apostila/material',
      'Página de vendas',
      'Copy/VSL',
      'Criativos de anúncios',
      'Produto hospedado (plataforma)',
      'Nada disso ainda',
    ],
  },
  {
    key: 'plataforma_hospedagem',
    label: 'Em qual plataforma está hospedado?',
    type: 'single-select',
    block: 'bloco_2',
    blockLabel: 'Maturidade',
    showWhen: { field: 'materiais_prontos', includes: 'Produto hospedado (plataforma)' },
    options: ['Hotmart', 'Eduzz', 'Kiwify', 'Monetizze', 'Teachable', 'Thinkific', 'Outra'],
  },
  {
    key: 'link_checkout',
    label: 'Qual o link do checkout ou página do produto?',
    type: 'url',
    block: 'bloco_2',
    blockLabel: 'Maturidade',
    showWhen: { field: 'materiais_prontos', includes: 'Produto hospedado (plataforma)' },
    placeholder: 'https://...',
  },

  // Bloco 3 — Tema, promessa e público
  {
    key: 'tema_central',
    label: 'Qual é o tema central do seu produto em 1 frase?',
    type: 'text',
    required: true,
    block: 'bloco_3',
    blockLabel: 'Tema, Promessa e Público',
    placeholder: 'Ex: Ajudo mulheres a emagrecer com alimentação natural',
  },
  {
    key: 'transformacao_prometida',
    label: 'Qual a transformação que você promete ao seu cliente?',
    type: 'textarea',
    required: true,
    block: 'bloco_3',
    blockLabel: 'Tema, Promessa e Público',
    placeholder: 'Descreva o resultado que seu aluno/cliente alcança',
  },
  {
    key: 'para_quem_e',
    label: 'Para quem é o seu produto?',
    type: 'text',
    required: true,
    block: 'bloco_3',
    blockLabel: 'Tema, Promessa e Público',
    placeholder: 'Descreva seu público-alvo ideal',
  },
  {
    key: 'para_quem_nao_e',
    label: 'Para quem NÃO é?',
    type: 'text',
    block: 'bloco_3',
    blockLabel: 'Tema, Promessa e Público',
    placeholder: 'Quem não se beneficiaria do seu produto',
  },
  {
    key: 'principal_problema',
    label: 'Qual o principal problema do seu público?',
    type: 'textarea',
    required: true,
    block: 'bloco_3',
    blockLabel: 'Tema, Promessa e Público',
    placeholder: 'Descreva a dor principal',
  },
  {
    key: 'duvidas_frequentes',
    label: 'Quais as 3 dúvidas mais frequentes do seu público?',
    type: 'textarea',
    block: 'bloco_3',
    blockLabel: 'Tema, Promessa e Público',
    placeholder: '1. ...\n2. ...\n3. ...',
  },

  // Bloco 4 — Oferta e formato
  {
    key: 'formato_preferido',
    label: 'Qual formato de produto você prefere? (pode marcar vários)',
    type: 'multi-select',
    required: true,
    block: 'bloco_4',
    blockLabel: 'Oferta e Formato',
    options: [
      'Mentoria em grupo (Zoom)',
      'Mentoria 1:1',
      'Curso gravado',
      'Curso gravado + encontros ao vivo',
      'Workshop/Imersão ao vivo',
      'Masterclass (aula única)',
      'Ebook/Guia',
      'Assinatura/Comunidade',
      'Consultoria productizada',
      'Ainda não sei (quero recomendação)',
    ],
  },
  {
    key: 'modelo_encontros',
    label: 'Quantos encontros ao vivo você pretende fazer?',
    type: 'single-select',
    block: 'bloco_4',
    blockLabel: 'Oferta e Formato',
    showWhen: { field: 'formato_preferido', includes: 'ao vivo' },
    options: ['Sem ao vivo', '4 encontros', '6 encontros', '8 encontros', 'Semanal contínuo (comunidade)'],
  },
  {
    key: 'tempo_disponivel',
    label: 'Quanto tempo disponível você tem por semana?',
    type: 'single-select',
    block: 'bloco_4',
    blockLabel: 'Oferta e Formato',
    options: ['1–2h', '3–5h', '6–10h', '10h+'],
  },
  {
    key: 'duracao_produto',
    label: 'Qual a duração estimada do seu produto?',
    type: 'single-select',
    block: 'bloco_4',
    blockLabel: 'Oferta e Formato',
    options: ['1–2 semanas', '3–4 semanas', '6–8 semanas', '10–12 semanas', '3–6 meses (comunidade/assinatura)'],
  },
  {
    key: 'bonus_desejados',
    label: 'Quais bônus você gostaria de oferecer?',
    type: 'multi-select',
    block: 'bloco_4',
    blockLabel: 'Oferta e Formato',
    options: [
      'Templates/modelos',
      'Planilhas/checklists',
      'Scripts/roteiros',
      'Banco de documentos',
      'Comunidade',
      'Plantões',
      'Certificado',
      'Não sei ainda',
    ],
  },

  // Bloco 5 — Ticket e objetivo
  {
    key: 'faixa_preco',
    label: 'Qual faixa de preço você pretende praticar?',
    type: 'single-select',
    required: true,
    block: 'bloco_5',
    blockLabel: 'Ticket e Objetivo',
    options: ['R$ 297–497', 'R$ 497–997', 'R$ 997–1.997', 'R$ 1.997–3.997', 'R$ 3.997+'],
  },
  {
    key: 'oferta_entrada',
    label: 'Você tem uma oferta de entrada (front-end)?',
    type: 'single-select',
    block: 'bloco_5',
    blockLabel: 'Ticket e Objetivo',
    options: ['Sim', 'Não, quero criar', 'Não quero', 'Não sei'],
  },
  {
    key: 'objetivo_90_dias',
    label: 'Qual seu principal objetivo nos próximos 90 dias?',
    type: 'single-select',
    required: true,
    block: 'bloco_5',
    blockLabel: 'Ticket e Objetivo',
    options: [
      'Validar e fazer primeiras vendas',
      'Estruturar e vender com consistência',
      'Escalar com tráfego',
      'Reposicionar e aumentar ticket',
      'Criar esteira completa',
    ],
  },

  // Bloco 6 — Autoridade e provas
  {
    key: 'experiencia_tema',
    label: 'Há quanto tempo você trabalha com esse tema?',
    type: 'single-select',
    required: true,
    block: 'bloco_6',
    blockLabel: 'Autoridade e Provas',
    options: ['< 1 ano', '1–3 anos', '3–5 anos', '5–10 anos', '10+ anos'],
  },
  {
    key: 'possui_certificacoes',
    label: 'Possui certificações ou formações relevantes?',
    type: 'single-select',
    block: 'bloco_6',
    blockLabel: 'Autoridade e Provas',
    options: ['Sim', 'Não'],
  },
  {
    key: 'lista_certificacoes',
    label: 'Liste suas certificações/formações relevantes:',
    type: 'textarea',
    block: 'bloco_6',
    blockLabel: 'Autoridade e Provas',
    showWhen: { field: 'possui_certificacoes', includes: 'Sim' },
    placeholder: 'Ex: MBA em Marketing Digital, Certificação Google Ads...',
  },
  {
    key: 'resultados_gerados',
    label: 'Quais resultados você já gerou para clientes/alunos?',
    type: 'textarea',
    block: 'bloco_6',
    blockLabel: 'Autoridade e Provas',
    placeholder: 'Descreva resultados concretos',
  },
  {
    key: 'provas_sociais',
    label: 'Quais provas sociais você tem disponíveis?',
    type: 'multi-select',
    block: 'bloco_6',
    blockLabel: 'Autoridade e Provas',
    options: [
      'Depoimentos em texto',
      'Prints de mensagens',
      'Cases/documentos',
      'Vídeos',
      'Não tenho ainda',
    ],
  },
  {
    key: 'diferencial',
    label: 'Qual é o seu diferencial em relação a outros do mercado?',
    type: 'textarea',
    block: 'bloco_6',
    blockLabel: 'Autoridade e Provas',
    placeholder: 'O que te torna único(a)?',
  },

  // Bloco 7 — Audiência e canais
  {
    key: 'canal_principal',
    label: 'Quais são seus canais de comunicação? (pode marcar vários)',
    type: 'multi-select',
    required: true,
    block: 'bloco_7',
    blockLabel: 'Audiência e Canais',
    options: ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Lista de e-mail', 'WhatsApp/Telegram', 'Não tenho audiência'],
  },
  {
    key: 'tamanho_audiencia',
    label: 'Qual o tamanho aproximado da sua audiência?',
    type: 'single-select',
    block: 'bloco_7',
    blockLabel: 'Audiência e Canais',
    options: ['0–1k', '1k–5k', '5k–20k', '20k–100k', '100k+'],
  },
  {
    key: 'aceita_aparecer',
    label: 'Você aceita aparecer em vídeos/conteúdo?',
    type: 'single-select',
    block: 'bloco_7',
    blockLabel: 'Audiência e Canais',
    options: ['Sim, tranquilo', 'Sim, com roteiro/direção', 'Prefiro só voz', 'Prefiro não aparecer'],
  },

  // Bloco 8 — Restrições
  {
    key: 'restricoes_legais',
    label: 'Seu tema tem restrições legais ou regulatórias?',
    type: 'single-select',
    block: 'bloco_8',
    blockLabel: 'Restrições',
    options: ['Sim (abordagem conservadora)', 'Sim (posso ser mais direto)', 'Não', 'Não sei'],
  },
  {
    key: 'limites_promessas',
    label: 'Há algo que você NÃO pode prometer ou falar publicamente?',
    type: 'textarea',
    block: 'bloco_8',
    blockLabel: 'Restrições',
    placeholder: 'Descreva limitações, se houver',
  },

  // Bloco 9 — Operação e execução
  {
    key: 'ativos_existentes',
    label: 'Quais ativos você já possui?',
    type: 'multi-select',
    block: 'bloco_9',
    blockLabel: 'Operação e Execução',
    options: [
      'Logo/identidade',
      'Site/landing page',
      'Apresentação/PDF',
      'Roteiros/ementa',
      'Materiais (docs, aulas, slides)',
      'Equipe (designer/editor)',
      'Nada disso',
    ],
  },
  {
    key: 'prazo_lancamento',
    label: 'Qual o prazo ideal de lançamento?',
    type: 'single-select',
    block: 'bloco_9',
    blockLabel: 'Operação e Execução',
    options: ['15 dias', '30 dias', '45 dias', '60 dias', '90 dias'],
  },
  {
    key: 'orcamento_trafego',
    label: 'Qual o orçamento mensal para tráfego pago?',
    type: 'single-select',
    block: 'bloco_9',
    blockLabel: 'Operação e Execução',
    options: ['R$ 0', 'R$ 500–1.500', 'R$ 1.500–5.000', 'R$ 5.000–15.000', 'R$ 15.000+'],
  },

  // Bloco 10 — Confirmação e escopo
  {
    key: 'escopo_desejado',
    label: 'O que você espera que entreguemos? (pode marcar vários)',
    type: 'multi-select',
    required: true,
    block: 'bloco_10',
    blockLabel: 'Confirmação e Escopo',
    options: [
      'Estratégia + oferta + posicionamento',
      'Estrutura do produto (módulos/aulas/materiais)',
      'Página + copy/VSL',
      'Configuração de plataforma + checkout',
      'Conteúdo + criativos',
      'Tráfego pago',
      'Tudo (pacote 360)',
    ],
  },
  {
    key: 'razao_agora',
    label: 'Qual a principal razão de fazer isso agora?',
    type: 'textarea',
    required: true,
    block: 'bloco_10',
    blockLabel: 'Confirmação e Escopo',
    placeholder: 'O que te motivou a buscar ajuda neste momento?',
  },
];

export function getVisibleQuestions(answers: Record<string, string>): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter((q) => {
    if (!q.showWhen) return true;
    const parentValue = answers[q.showWhen.field] || '';
    return parentValue.toLowerCase().includes(q.showWhen.includes.toLowerCase());
  });
}
