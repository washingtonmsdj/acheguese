import type { BusinessCategory } from "@/modules/business/types";

export interface BusinessCreateFieldCopy {
  entityNoun: string;
  namePlaceholder: string;
  legalNamePlaceholder: string;
  subcategoryPlaceholder: string;
  industryPlaceholder: string;
  industryOptions: string[];
  descriptionPlaceholder: string;
  phonePlaceholder: string;
  whatsappPlaceholder: string;
  emailPlaceholder: string;
  streetPlaceholder: string;
  complementPlaceholder: string;
  websitePlaceholder: string;
  instagramPlaceholder: string;
  facebookPlaceholder: string;
  specialtiesPlaceholder: string;
  facilitiesPlaceholder: string;
  identityLabel: string;
  identityHelper: string;
}

const DEFAULT_COPY: BusinessCreateFieldCopy = {
  entityNoun: "empresa",
  namePlaceholder: "Ex: Solucao Local",
  legalNamePlaceholder: "Ex: Solucao Local LTDA",
  subcategoryPlaceholder: "Ex: Atendimento especializado",
  industryPlaceholder: "Ex: Comercio local e servicos regionais",
  industryOptions: [
    "Comercio local",
    "Prestacao de servicos",
    "Atendimento especializado",
    "Atividade comunitaria",
  ],
  descriptionPlaceholder:
    "Explique o que seu negocio oferece, para quem atende e qual e o seu diferencial.",
  phonePlaceholder: "(71) 3333-3333",
  whatsappPlaceholder: "(71) 99999-9999",
  emailPlaceholder: "contato@suaempresa.com.br",
  streetPlaceholder: "Ex: Rua das Acacias",
  complementPlaceholder: "Sala, loja, bloco ou referencia",
  websitePlaceholder: "https://www.suaempresa.com.br",
  instagramPlaceholder: "@suaempresa",
  facebookPlaceholder: "facebook.com/suaempresa",
  specialtiesPlaceholder: "Ex: atendimento rapido, consultoria local, suporte dedicado",
  facilitiesPlaceholder: "Ex: acessibilidade, estacionamento, wifi, atendimento agendado",
  identityLabel: "Escolha o final do seu link publico",
  identityHelper:
    "Voce escolhe apenas o final. O estado, cidade e bairro sao preenchidos automaticamente.",
};

const CATEGORY_COPY: Partial<Record<BusinessCategory, Partial<BusinessCreateFieldCopy>>> = {
  restaurante: {
    entityNoun: "restaurante",
    namePlaceholder: "Ex: Cantinho da Bahia",
    legalNamePlaceholder: "Ex: Cantinho da Bahia Alimentos LTDA",
    subcategoryPlaceholder: "Ex: Comida baiana artesanal",
    industryPlaceholder: "Ex: Alimentacao, refeicoes e delivery",
    industryOptions: [
      "Restaurante tradicional",
      "Comida regional",
      "Lanchonete",
      "Padaria e confeitaria",
      "Delivery",
      "Cafeteria",
    ],
    descriptionPlaceholder:
      "Descreva seu cardapio, horario principal e experiencia que voce entrega ao cliente.",
    emailPlaceholder: "contato@cantinhodabahia.com.br",
    websitePlaceholder: "https://www.cantinhodabahia.com.br",
    instagramPlaceholder: "@cantinhodabahia",
    facebookPlaceholder: "facebook.com/cantinhodabahia",
    specialtiesPlaceholder: "Ex: moqueca, prato executivo, sobremesas regionais",
    facilitiesPlaceholder: "Ex: entrega, retirada no balcao, acessibilidade, mesa ao ar livre",
    identityLabel: "Escolha o final do link do seu restaurante",
  },
  mercado: {
    entityNoun: "mercado",
    namePlaceholder: "Ex: Mercado Bom Preco",
    legalNamePlaceholder: "Ex: Mercado Bom Preco LTDA",
    subcategoryPlaceholder: "Ex: Mercado de bairro",
    industryPlaceholder: "Ex: Varejo alimentar e conveniencia",
    industryOptions: [
      "Supermercado",
      "Mercado de bairro",
      "Mercearia",
      "Hortifruti",
      "Conveniencia",
    ],
    descriptionPlaceholder:
      "Explique os principais produtos, horarios e diferenciais de atendimento do seu mercado.",
    emailPlaceholder: "contato@mercadobompreco.com.br",
    websitePlaceholder: "https://www.mercadobompreco.com.br",
    instagramPlaceholder: "@mercadobompreco",
    facebookPlaceholder: "facebook.com/mercadobompreco",
    specialtiesPlaceholder: "Ex: hortifruti fresco, acougue, mercearia completa",
    facilitiesPlaceholder: "Ex: entrega no bairro, estacionamento, pagamento por pix",
    identityLabel: "Escolha o final do link do seu mercado",
  },
  farmacia: {
    entityNoun: "farmacia",
    namePlaceholder: "Ex: Farmacia Vida Mais",
    legalNamePlaceholder: "Ex: Farmacia Vida Mais LTDA",
    subcategoryPlaceholder: "Ex: Drogaria e perfumaria",
    industryPlaceholder: "Ex: Saude, medicamentos e bem-estar",
    industryOptions: [
      "Drogaria",
      "Farmacia de manipulacao",
      "Perfumaria",
      "Cuidados pessoais",
      "Entrega de medicamentos",
    ],
    descriptionPlaceholder:
      "Informe os tipos de produtos, horarios e servicos que sua farmacia oferece.",
    emailPlaceholder: "contato@farmaciavidamais.com.br",
    websitePlaceholder: "https://www.farmaciavidamais.com.br",
    instagramPlaceholder: "@farmaciavidamais",
    facebookPlaceholder: "facebook.com/farmaciavidamais",
    specialtiesPlaceholder: "Ex: medicamentos genericos, dermocosmeticos, testes rapidos",
    facilitiesPlaceholder: "Ex: entrega, atendimento por whatsapp, acessibilidade",
    identityLabel: "Escolha o final do link da sua farmacia",
  },
  saude: {
    entityNoun: "clinica",
    namePlaceholder: "Ex: Clinica Cuidar",
    legalNamePlaceholder: "Ex: Clinica Cuidar Servicos Medicos LTDA",
    subcategoryPlaceholder: "Ex: Clinica geral",
    industryPlaceholder: "Ex: Assistencia medica e exames",
    industryOptions: [
      "Clinica geral",
      "Clinica especializada",
      "Laboratorio",
      "Odontologia",
      "Fisioterapia",
      "Atendimento domiciliar",
    ],
    descriptionPlaceholder:
      "Descreva especialidades, publico atendido e principais servicos da clinica.",
    emailPlaceholder: "contato@clinicacuidar.com.br",
    websitePlaceholder: "https://www.clinicacuidar.com.br",
    instagramPlaceholder: "@clinicacuidar",
    facebookPlaceholder: "facebook.com/clinicacuidar",
    specialtiesPlaceholder: "Ex: pediatria, clinica geral, exames laboratoriais",
    facilitiesPlaceholder: "Ex: acessibilidade, atendimento por convenio, estacionamento",
    identityLabel: "Escolha o final do link da sua clinica",
  },
  educacao: {
    entityNoun: "instituicao de ensino",
    namePlaceholder: "Ex: Escola Horizonte",
    legalNamePlaceholder: "Ex: Escola Horizonte Educacao LTDA",
    subcategoryPlaceholder: "Ex: Ensino fundamental",
    industryPlaceholder: "Ex: Educacao basica e formacao complementar",
    industryOptions: [
      "Educacao infantil",
      "Ensino fundamental",
      "Ensino medio",
      "Curso tecnico",
      "Curso preparatorio",
      "Curso de idiomas",
      "Reforco escolar",
    ],
    descriptionPlaceholder:
      "Explique niveis de ensino, metodologia e diferenciais pedagogicos da sua instituicao.",
    emailPlaceholder: "secretaria@escolahorizonte.com.br",
    websitePlaceholder: "https://www.escolahorizonte.com.br",
    instagramPlaceholder: "@escolahorizonte",
    facebookPlaceholder: "facebook.com/escolahorizonte",
    specialtiesPlaceholder: "Ex: reforco escolar, preparatorio enem, ensino bilingue",
    facilitiesPlaceholder: "Ex: biblioteca, laboratorio, acessibilidade, patio coberto",
    identityLabel: "Escolha o final do link da sua instituicao",
  },
  servicos: {
    entityNoun: "prestador de servicos",
    namePlaceholder: "Ex: Solucoes Eletricas Brasil",
    legalNamePlaceholder: "Ex: Solucoes Eletricas Brasil LTDA",
    subcategoryPlaceholder: "Ex: Manutencao residencial",
    industryPlaceholder: "Ex: Servicos tecnicos e manutencao",
    industryOptions: [
      "Manutencao residencial",
      "Assistencia tecnica",
      "Servicos automotivos",
      "Consultoria",
      "Limpeza e conservacao",
      "Tecnologia e suporte",
    ],
    descriptionPlaceholder:
      "Descreva tipos de servico, area de atendimento e diferenciais operacionais.",
    emailPlaceholder: "contato@solucoeseletricas.com.br",
    websitePlaceholder: "https://www.solucoeseletricas.com.br",
    instagramPlaceholder: "@solucoeseletricas",
    facebookPlaceholder: "facebook.com/solucoeseletricas",
    specialtiesPlaceholder: "Ex: instalacao eletrica, manutencao preventiva, emergencia 24h",
    facilitiesPlaceholder: "Ex: atendimento a domicilio, orcamento rapido, suporte online",
    identityLabel: "Escolha o final do link do seu servico",
  },
  lazer: {
    entityNoun: "espaco de lazer",
    namePlaceholder: "Ex: Arena Viva Bem",
    legalNamePlaceholder: "Ex: Arena Viva Bem Esportes LTDA",
    subcategoryPlaceholder: "Ex: Centro esportivo",
    industryPlaceholder: "Ex: Lazer, esporte e entretenimento",
    industryOptions: [
      "Academia",
      "Centro esportivo",
      "Espaco cultural",
      "Entretenimento infantil",
      "Eventos e recreacao",
    ],
    descriptionPlaceholder:
      "Descreva atividades, estrutura e publico principal do seu espaco de lazer.",
    emailPlaceholder: "contato@arenavivabem.com.br",
    websitePlaceholder: "https://www.arenavivabem.com.br",
    instagramPlaceholder: "@arenavivabem",
    facebookPlaceholder: "facebook.com/arenavivabem",
    specialtiesPlaceholder: "Ex: aulas coletivas, quadras esportivas, eventos infantis",
    facilitiesPlaceholder: "Ex: vestiario, lanchonete, estacionamento, acessibilidade",
    identityLabel: "Escolha o final do link do seu espaco",
  },
  outros: {
    entityNoun: "negocio",
  },
};

export function getBusinessCreateFieldCopy(category?: string): BusinessCreateFieldCopy {
  const normalizedCategory = (category || "outros") as BusinessCategory;
  const overrides = CATEGORY_COPY[normalizedCategory] ?? CATEGORY_COPY.outros ?? {};
  return { ...DEFAULT_COPY, ...overrides };
}
