import type { BusinessCategory } from "@/core/business/types";
import { getRecordValue } from "@/shared/utils/recordLookup";

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
  namePlaceholder: "Ex: Solução Local",
  legalNamePlaceholder: "Ex: Solução Local LTDA",
  subcategoryPlaceholder: "Ex: Atendimento especializado",
  industryPlaceholder: "Ex: Comércio local e serviços regionais",
  industryOptions: [
    "Comércio local",
    "Prestação de serviços",
    "Atendimento especializado",
    "Atividade comunitária",
  ],
  descriptionPlaceholder:
    "Explique o que seu negócio oferece, para quem atende e qual é o seu diferencial.",
  phonePlaceholder: "(71) 3333-3333",
  whatsappPlaceholder: "(71) 99999-9999",
  emailPlaceholder: "contato@suaempresa.com.br",
  streetPlaceholder: "Ex: Rua das Acácias",
  complementPlaceholder: "Sala, loja, bloco ou referência",
  websitePlaceholder: "https://www.suaempresa.com.br",
  instagramPlaceholder: "@suaempresa",
  facebookPlaceholder: "facebook.com/suaempresa",
  specialtiesPlaceholder: "Ex: atendimento rápido, consultoria local, suporte dedicado",
  facilitiesPlaceholder: "Ex: acessibilidade, estacionamento, wi-fi, atendimento agendado",
  identityLabel: "Escolha o final do seu link público",
  identityHelper:
    "Você escolhe apenas o final do link. Estado, cidade e bairro são definidos automaticamente pelo território selecionado.",
};

const CATEGORY_COPY: Partial<Record<BusinessCategory, Partial<BusinessCreateFieldCopy>>> = {
  restaurante: {
    entityNoun: "restaurante",
    namePlaceholder: "Ex: Cantinho da Bahia",
    legalNamePlaceholder: "Ex: Cantinho da Bahia Alimentos LTDA",
    subcategoryPlaceholder: "Ex: Comida baiana artesanal",
    industryPlaceholder: "Ex: Alimentação, refeições e delivery",
    industryOptions: [
      "Restaurante tradicional",
      "Comida regional",
      "Lanchonete",
      "Padaria e confeitaria",
      "Delivery",
      "Cafeteria",
    ],
    descriptionPlaceholder:
      "Descreva seu cardápio, horário principal e a experiência que você entrega ao cliente.",
    emailPlaceholder: "contato@cantinhodabahia.com.br",
    websitePlaceholder: "https://www.cantinhodabahia.com.br",
    instagramPlaceholder: "@cantinhodabahia",
    facebookPlaceholder: "facebook.com/cantinhodabahia",
    specialtiesPlaceholder: "Ex: moqueca, prato executivo, sobremesas regionais",
    facilitiesPlaceholder: "Ex: entrega, retirada no balcão, acessibilidade, mesa ao ar livre",
    identityLabel: "Escolha o final do link do seu restaurante",
  },
  mercado: {
    entityNoun: "mercado",
    namePlaceholder: "Ex: Mercado Bom Preço",
    legalNamePlaceholder: "Ex: Mercado Bom Preço LTDA",
    subcategoryPlaceholder: "Ex: Mercado de bairro",
    industryPlaceholder: "Ex: Varejo alimentar e conveniência",
    industryOptions: [
      "Supermercado",
      "Mercado de bairro",
      "Mercearia",
      "Hortifruti",
      "Conveniência",
    ],
    descriptionPlaceholder:
      "Explique os principais produtos, horários e diferenciais de atendimento do seu mercado.",
    emailPlaceholder: "contato@mercadobompreco.com.br",
    websitePlaceholder: "https://www.mercadobompreco.com.br",
    instagramPlaceholder: "@mercadobompreco",
    facebookPlaceholder: "facebook.com/mercadobompreco",
    specialtiesPlaceholder: "Ex: hortifruti fresco, açougue, mercearia completa",
    facilitiesPlaceholder: "Ex: entrega no bairro, estacionamento, pagamento por Pix",
    identityLabel: "Escolha o final do link do seu mercado",
  },
  farmacia: {
    entityNoun: "farmácia",
    namePlaceholder: "Ex: Farmácia Vida Mais",
    legalNamePlaceholder: "Ex: Farmácia Vida Mais LTDA",
    subcategoryPlaceholder: "Ex: Drogaria e perfumaria",
    industryPlaceholder: "Ex: Saúde, medicamentos e bem-estar",
    industryOptions: [
      "Drogaria",
      "Farmácia de manipulação",
      "Perfumaria",
      "Cuidados pessoais",
      "Entrega de medicamentos",
    ],
    descriptionPlaceholder:
      "Informe os tipos de produtos, horários e serviços que sua farmácia oferece.",
    emailPlaceholder: "contato@farmaciavidamais.com.br",
    websitePlaceholder: "https://www.farmaciavidamais.com.br",
    instagramPlaceholder: "@farmaciavidamais",
    facebookPlaceholder: "facebook.com/farmaciavidamais",
    specialtiesPlaceholder: "Ex: medicamentos genéricos, dermocosméticos, testes rápidos",
    facilitiesPlaceholder: "Ex: entrega, atendimento por WhatsApp, acessibilidade",
    identityLabel: "Escolha o final do link da sua farmácia",
  },
  saude: {
    entityNoun: "clínica",
    namePlaceholder: "Ex: Clínica Cuidar",
    legalNamePlaceholder: "Ex: Clínica Cuidar Serviços Médicos LTDA",
    subcategoryPlaceholder: "Ex: Clínica geral",
    industryPlaceholder: "Ex: Assistência médica e exames",
    industryOptions: [
      "Clínica geral",
      "Clínica especializada",
      "Laboratório",
      "Odontologia",
      "Fisioterapia",
      "Atendimento domiciliar",
    ],
    descriptionPlaceholder:
      "Descreva especialidades, público atendido e principais serviços da clínica.",
    emailPlaceholder: "contato@clinicacuidar.com.br",
    websitePlaceholder: "https://www.clinicacuidar.com.br",
    instagramPlaceholder: "@clinicacuidar",
    facebookPlaceholder: "facebook.com/clinicacuidar",
    specialtiesPlaceholder: "Ex: pediatria, clínica geral, exames laboratoriais",
    facilitiesPlaceholder: "Ex: acessibilidade, atendimento por convênio, estacionamento",
    identityLabel: "Escolha o final do link da sua clínica",
  },
  educacao: {
    entityNoun: "instituição de ensino",
    namePlaceholder: "Ex: Escola Horizonte",
    legalNamePlaceholder: "Ex: Escola Horizonte Educação LTDA",
    subcategoryPlaceholder: "Ex: Ensino fundamental",
    industryPlaceholder: "Ex: Educação básica e formação complementar",
    industryOptions: [
      "Educação infantil",
      "Ensino fundamental",
      "Ensino médio",
      "Curso técnico",
      "Curso preparatório",
      "Curso de idiomas",
      "Reforço escolar",
    ],
    descriptionPlaceholder:
      "Explique níveis de ensino, metodologia e diferenciais pedagógicos da sua instituição.",
    emailPlaceholder: "secretaria@escolahorizonte.com.br",
    websitePlaceholder: "https://www.escolahorizonte.com.br",
    instagramPlaceholder: "@escolahorizonte",
    facebookPlaceholder: "facebook.com/escolahorizonte",
    specialtiesPlaceholder: "Ex: reforço escolar, preparatório ENEM, ensino bilíngue",
    facilitiesPlaceholder: "Ex: biblioteca, laboratório, acessibilidade, pátio coberto",
    identityLabel: "Escolha o final do link da sua instituição",
  },
  servicos: {
    entityNoun: "prestador de serviços",
    namePlaceholder: "Ex: Soluções Elétricas Brasil",
    legalNamePlaceholder: "Ex: Soluções Elétricas Brasil LTDA",
    subcategoryPlaceholder: "Ex: Manutenção residencial",
    industryPlaceholder: "Ex: Serviços técnicos e manutenção",
    industryOptions: [
      "Manutenção residencial",
      "Assistência técnica",
      "Serviços automotivos",
      "Consultoria",
      "Limpeza e conservação",
      "Tecnologia e suporte",
    ],
    descriptionPlaceholder:
      "Descreva tipos de serviço, área de atendimento e diferenciais operacionais.",
    emailPlaceholder: "contato@solucoeseletricas.com.br",
    websitePlaceholder: "https://www.solucoeseletricas.com.br",
    instagramPlaceholder: "@solucoeseletricas",
    facebookPlaceholder: "facebook.com/solucoeseletricas",
    specialtiesPlaceholder: "Ex: instalação elétrica, manutenção preventiva, emergência 24h",
    facilitiesPlaceholder: "Ex: atendimento a domicílio, orçamento rápido, suporte online",
    identityLabel: "Escolha o final do link do seu serviço",
  },
  lazer: {
    entityNoun: "espaço de lazer",
    namePlaceholder: "Ex: Arena Viva Bem",
    legalNamePlaceholder: "Ex: Arena Viva Bem Esportes LTDA",
    subcategoryPlaceholder: "Ex: Centro esportivo",
    industryPlaceholder: "Ex: Lazer, esporte e entretenimento",
    industryOptions: [
      "Academia",
      "Centro esportivo",
      "Espaço cultural",
      "Entretenimento infantil",
      "Eventos e recreação",
    ],
    descriptionPlaceholder:
      "Descreva atividades, estrutura e público principal do seu espaço de lazer.",
    emailPlaceholder: "contato@arenavivabem.com.br",
    websitePlaceholder: "https://www.arenavivabem.com.br",
    instagramPlaceholder: "@arenavivabem",
    facebookPlaceholder: "facebook.com/arenavivabem",
    specialtiesPlaceholder: "Ex: aulas coletivas, quadras esportivas, eventos infantis",
    facilitiesPlaceholder: "Ex: vestiário, lanchonete, estacionamento, acessibilidade",
    identityLabel: "Escolha o final do link do seu espaço",
  },
  outros: {
    entityNoun: "negócio",
  },
};

export function getBusinessCreateFieldCopy(category?: string): BusinessCreateFieldCopy {
  const normalizedCategory = (category || "outros") as BusinessCategory;
  const overrides = getRecordValue(CATEGORY_COPY, normalizedCategory) ?? CATEGORY_COPY.outros ?? {};
  return { ...DEFAULT_COPY, ...overrides };
}
