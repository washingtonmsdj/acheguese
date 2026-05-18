import {
  Users,
  Map,
  Building2,
  MapPinned,
  Globe,
  Landmark,
  Ambulance,
  Flame,
  Shield,
  AlertTriangle,
  Heart,
} from "lucide-react";

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k+`;
  return num.toString();
}

export const BRASIL_INFO = {
  populacao: 203000000,
  estados: 26,
  municipios: 5570,
  area_km2: 8515767,
  idioma: "Português",
  capital: "Brasília",
  moeda: "Real (BRL)",
  fuso_horario: "UTC-2 a UTC-5",
  fundacao: "7 de setembro de 1822",
};

export const BRASIL_STATS = [
  { icon: Users, value: formatNumber(BRASIL_INFO.populacao), label: "Habitantes", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  { icon: Map, value: `${BRASIL_INFO.estados}+1`, label: "UFs", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  { icon: Building2, value: formatNumber(BRASIL_INFO.municipios), label: "Municípios", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  { icon: MapPinned, value: `${(BRASIL_INFO.area_km2 / 1000000).toFixed(1)}M km²`, label: "Área", color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  { icon: Globe, value: BRASIL_INFO.idioma, label: "Idioma oficial", color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { icon: Landmark, value: BRASIL_INFO.capital, label: "Capital", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
];

export const PONTOS_TURISTICOS = [
  { nome: "Cristo Redentor", cidade: "Rio de Janeiro, RJ", emoji: "🗽", descricao: "Uma das Sete Maravilhas do Mundo Moderno, no topo do Corcovado.", destaque: true },
  { nome: "Pelourinho", cidade: "Salvador, BA", emoji: "🏛️", descricao: "Centro histórico tombado pela UNESCO, berço da cultura afro-brasileira.", destaque: true },
  { nome: "Cataratas do Iguaçu", cidade: "Foz do Iguaçu, PR", emoji: "💧", descricao: "Conjunto de 275 quedas d'água, patrimônio natural da humanidade.", destaque: true },
  { nome: "Chapada Diamantina", cidade: "Bahia", emoji: "⛰️", descricao: "Parque nacional com cachoeiras, grutas e trilhas espetaculares." },
  { nome: "Fernando de Noronha", cidade: "Pernambuco", emoji: "🏝️", descricao: "Arquipélago paradisíaco com as praias mais bonitas do Brasil." },
  { nome: "Lençóis Maranhenses", cidade: "Maranhão", emoji: "🏜️", descricao: "Dunas de areia branca com lagoas cristalinas de água doce." },
  { nome: "Amazônia", cidade: "Região Norte", emoji: "🌳", descricao: "A maior floresta tropical do mundo, pulmão do planeta." },
  { nome: "Pantanal", cidade: "MT / MS", emoji: "🐊", descricao: "Maior planície alagável do mundo, santuário da biodiversidade." },
  { nome: "Ouro Preto", cidade: "Minas Gerais", emoji: "⛪", descricao: "Cidade histórica barroca, patrimônio mundial da UNESCO." },
];

export const PRESIDENCIA = {
  presidente: { nome: "Luiz Inácio Lula da Silva", cargo: "Presidente da República", partido: "PT", mandato: "2023–2026" },
  vice: { nome: "Geraldo Alckmin", cargo: "Vice-Presidente", partido: "PSB", mandato: "2023–2026" },
  camara: { nome: "Hugo Motta", cargo: "Presidente da Câmara", partido: "Republicanos", mandato: "2025–2027" },
  senado: { nome: "Davi Alcolumbre", cargo: "Presidente do Senado", partido: "União Brasil", mandato: "2025–2027" },
};

export const CONTATOS_EMERGENCIA = [
  { nome: "SAMU", telefone: "192", icone: Ambulance, cor: "text-destructive" },
  { nome: "Bombeiros", telefone: "193", icone: Flame, cor: "text-warning" },
  { nome: "Polícia Militar", telefone: "190", icone: Shield, cor: "text-blue-500" },
  { nome: "Defesa Civil", telefone: "199", icone: AlertTriangle, cor: "text-accent" },
  { nome: "Polícia Federal", telefone: "194", icone: Shield, cor: "text-violet-500" },
  { nome: "CVV (Apoio)", telefone: "188", icone: Heart, cor: "text-pink-500" },
];

export const CONTATOS_UTILIDADE = [
  { nome: "Disque Direitos Humanos", telefone: "100" },
  { nome: "Disque Denúncia", telefone: "181" },
  { nome: "Receita Federal", telefone: "146" },
  { nome: "Anatel (Telecomunicações)", telefone: "1331" },
];

export const GOV_FEDERAL = {
  nome: "Governo Federal do Brasil",
  site: "https://www.gov.br",
  telefone: "(61) 3411-1200",
  email: "ouvidoria@presidencia.gov.br",
  instagram: "@govbr",
  facebook: "govbr",
  twitter: "@govaborasil",
  youtube: "CanalGov",
};

export const NAV_LINKS = [
  { label: "Início", path: "home" },
  { label: "Números", path: "#numeros" },
  { label: "Sobre", path: "#sobre" },
  { label: "Turismo", path: "#turismo" },
  { label: "Empresas", path: "#empresas" },
  { label: "Estados", path: "#estados" },
  { label: "Territórios", path: "#territorios" },
  { label: "Contatos", path: "#contatos" },
];
