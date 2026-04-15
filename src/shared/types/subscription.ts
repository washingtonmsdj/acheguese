// Tipos para o sistema de assinaturas SaaS

export type PlanType = "basico" | "profissional" | "premium_20";

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  price: number;
  description: string;
  recursos: string[];
  limites: {
    photos: number;
    products: number;
    services: number;
    agendamentos_mes: number;
    cupons_actives: number;
  };
  destaque?: boolean;
}

export interface BusinessSubscription {
  id: string;
  business_id: string;
  plan_type: PlanType;
  status: "active" | "cancelado" | "trial" | "vencido";
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessAnalytics {
  business_id: string;
  periodo: string; // 'hoje' | 'semana' | 'mes'
  visualizacoes: number;
  cliques_whatsapp: number;
  cliques_phone: number;
  cliques_rota: number;
  agendamentos: number;
  favoritos: number;
  compartilhamentos: number;
  taxa_conversao: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basico",
    name: "Básico",
    price: 29,
    description: "Ideal para começar sua presença digital",
    recursos: [
      "Página profissional",
      "Até 5 photos na galeria",
      "Informações de contato",
      "Horário de funcionamento",
      "Localização no mapa",
    ],
    limites: {
      photos: 5,
      products: 10,
      services: 10,
      agendamentos_mes: 50,
      cupons_actives: 1,
    },
  },
  {
    id: "profissional",
    name: "Profissional",
    price: 79,
    description: "Para businesss que querem crescer",
    recursos: [
      "Tudo do plano Básico",
      "Até 20 photos na galeria",
      "Sistema de agendamentos",
      "Analytics básico",
      "Cupons e promoções (até 3)",
      "Destaque nas buscas",
    ],
    limites: {
      photos: 20,
      products: 100,
      services: 100,
      agendamentos_mes: 200,
      cupons_actives: 3,
    },
    destaque: true,
  },
  {
    id: "premium_20",
    name: "Premium",
    price: 149,
    description: "Solução completa para seu negócio",
    recursos: [
      "Tudo do plano Profissional",
      "Página no portal",
      "Mini webwebsite profissional",
      "Link curto para divulgação",
      "Fotos ilimitadas",
      "Analytics avançado",
      "Cupons ilimitados",
      "Integração com pagamentos",
      "Suporte prioritário",
      "Selo de verificado",
      "Posição premium nas buscas",
    ],
    limites: {
      photos: -1, // ilimitado
      products: -1,
      services: -1,
      agendamentos_mes: -1,
      cupons_actives: -1,
    },
  },
];
