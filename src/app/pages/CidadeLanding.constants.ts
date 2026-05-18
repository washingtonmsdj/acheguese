import { AlertTriangle, Ambulance, Flame, Shield } from "lucide-react";

import bairroNordeste from "@/assets/bairro-nordeste.jpg";
import bairroOndina from "@/assets/bairro-ondina.jpg";
import bairroPituba from "@/assets/bairro-pituba.jpg";
import bairroRioVermelho from "@/assets/bairro-riovermelho.jpg";

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k+`;
  return num.toString();
}

export function formatCategory(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
}

export function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export const EMPRESAS_MOCK = [
  {
    id: "mock-1",
    name: "Padaria São Jorge",
    category: "alimentacao",
    rating: 4.8,
    is_verified: true,
    is_premium: false,
    logo_url: null,
    slug: null,
    geographic_path: null,
  },
  {
    id: "mock-2",
    name: "Farmácia Vida",
    category: "saude",
    rating: 4.5,
    is_verified: true,
    is_premium: true,
    logo_url: null,
    slug: null,
    geographic_path: null,
  },
];

export const SERVICOS_MOCK = [
  {
    id: "mock-s1",
    name: "João Eletricista",
    category: "eletrica",
    price_range: "R$ 80-150/h",
    is_verified: true,
    logo_url: null,
  },
  {
    id: "mock-s2",
    name: "Maria Diarista",
    category: "limpeza",
    price_range: "R$ 120/dia",
    is_verified: true,
    logo_url: null,
  },
];

export const CLASSIFICADOS_MOCK = [
  {
    id: "mock-c1",
    titulo: "Sofá 3 Lugares Novo",
    category: "moveis",
    price: 1200,
    photos: null,
    public_id: "mock001",
    geographic_path: null,
    category_slug: null,
    subcategory_slug: null,
    slug: null,
  },
  {
    id: "mock-c2",
    titulo: "iPhone 12 Pro 128GB",
    category: "eletronicos",
    price: 2800,
    photos: null,
    public_id: "mock002",
    geographic_path: null,
    category_slug: null,
    subcategory_slug: null,
    slug: null,
  },
];

export const VAGAS_EMPREGO = [
  { titulo: "Desenvolvedor Full Stack", empresa: "TechBa Solutions", tipo: "CLT", salario: "R$ 6.000 - R$ 9.000", bairro: "Pituba", tags: ["React", "Node.js"] },
  { titulo: "Auxiliar Administrativo", empresa: "Grupo Salvador", tipo: "CLT", salario: "R$ 1.800 - R$ 2.200", bairro: "Comércio", tags: ["Excel", "Organização"] },
  { titulo: "Vendedor(a) Externo", empresa: "Distribuidora Bahia", tipo: "Comissão", salario: "R$ 2.500 + comissão", bairro: "Brotas", tags: ["Vendas", "Comunicação"] },
  { titulo: "Garçom/Garçonete", empresa: "Restaurante Mar Azul", tipo: "CLT", salario: "R$ 1.500 + gorjetas", bairro: "Rio Vermelho", tags: ["Atendimento", "Gastronomia"] },
  { titulo: "Professor(a) de Inglês", empresa: "Instituto Cultural BA", tipo: "PJ", salario: "R$ 45/hora", bairro: "Barra", tags: ["Educação", "Idiomas"] },
  { titulo: "Motorista de App", empresa: "Cooperativa Mobilidade", tipo: "Autônomo", salario: "Livre", bairro: "Toda cidade", tags: ["CNH B", "Disponibilidade"] },
];

export const BAIRROS_DESTAQUE = [
  { nome: "Pituba", resumo: "Polo residencial e comercial com serviços, escolas e vida local ativa.", imagem: bairroPituba },
  { nome: "Rio Vermelho", resumo: "Bairro cultural com gastronomia, turismo e comércio de rua.", imagem: bairroRioVermelho },
  { nome: "Ondina", resumo: "Orla urbana com mobilidade estratégica e acesso rápido ao centro.", imagem: bairroOndina },
  { nome: "Nordeste de Amaralina", resumo: "Território com forte identidade comunitária e comércio local.", imagem: bairroNordeste },
];

export const FALLBACK_CANAIS_CIVICOS = [
  { titulo: "Fala Salvador (Ouvidoria Geral)", detalhe: "Canal central da Prefeitura para demandas e serviços", acao: "Ligar 156", href: "tel:156" },
  { titulo: "Defesa Civil (Codesal)", detalhe: "Risco de deslizamento, alagamento e ocorrência emergencial", acao: "Ligar 199", href: "tel:199" },
  { titulo: "Transparência Municipal", detalhe: "Acompanhe gastos, contratos e indicadores oficiais", acao: "Abrir portal", href: "https://transparencia.salvador.ba.gov.br/" },
  { titulo: "Participação e solicitações", detalhe: "Abertura e acompanhamento digital de demandas", acao: "Acessar Fala Salvador", href: "https://falasalvador.ba.gov.br/" },
];

export const POLITICOS = [
  { nome: "Bruno Reis", cargo: "Prefeito", partido: "União Brasil", mandato: "2025-2028", foto: null },
  { nome: "Ana Paula Matos", cargo: "Vice-Prefeita", partido: "PDT", mandato: "2025-2028", foto: null },
  { nome: "Carlos Muniz", cargo: "Presidente da Câmara", partido: "PSDB", mandato: "2025-2026", foto: null },
];

export const CONTATOS_EMERGENCIA = [
  { nome: "SAMU", telefone: "192", icone: Ambulance, cor: "text-destructive" },
  { nome: "Bombeiros", telefone: "193", icone: Flame, cor: "text-warning" },
  { nome: "Polícia Militar", telefone: "190", icone: Shield, cor: "text-blue-500" },
  { nome: "Defesa Civil", telefone: "199", icone: AlertTriangle, cor: "text-accent" },
];

export const CONTATOS_UTILIDADE = [
  { nome: "Ouvidoria Municipal", telefone: "156", tipo: "telefone" },
  { nome: "Iluminação Pública", telefone: "0800 071 5454", tipo: "telefone" },
  { nome: "Cagece (Água)", telefone: "0800 071 0115", tipo: "telefone" },
  { nome: "Coelba (Energia)", telefone: "0800 071 0300", tipo: "telefone" },
];

export const PREFEITURA = {
  nome: "Prefeitura Municipal de Salvador",
  endereco: "Praça Municipal, s/n - Centro, Salvador - BA, 40020-010",
  telefone: "(71) 3202-6100",
  email: "ouvidoria@salvador.ba.gov.br",
  site: "https://www.salvador.ba.gov.br",
  instagram: "@preikiatura_ssa",
  facebook: "PrefeituraDeSalvador",
  twitter: "@prefikitura_ssa",
  youtube: "PrefeituraDeSalvador",
  horario: "Seg a Sex, 8h às 17h",
};
