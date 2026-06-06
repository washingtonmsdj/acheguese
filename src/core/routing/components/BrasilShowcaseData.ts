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
import { formatCompactMetricNumber } from "@/shared/utils/formatters";

export const BRASIL_INFO = {
  populacao: 203000000,
  estados: 26,
  municipios: 5570,
  area_km2: 8515767,
  idioma: "Portugues",
  capital: "Brasilia",
  moeda: "Real (BRL)",
  fuso_horario: "UTC-2 a UTC-5",
  fundacao: "7 de setembro de 1822",
};

export const BRASIL_STATS = [
  { icon: Users, value: formatCompactMetricNumber(BRASIL_INFO.populacao), label: "Habitantes", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  { icon: Map, value: `${BRASIL_INFO.estados}+1`, label: "UFs", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  { icon: Building2, value: formatCompactMetricNumber(BRASIL_INFO.municipios), label: "Municipios", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20" },
  { icon: MapPinned, value: `${(BRASIL_INFO.area_km2 / 1000000).toFixed(1)}M km2`, label: "Area", color: "text-success", bg: "bg-success/10", border: "border-success/20" },
  { icon: Globe, value: BRASIL_INFO.idioma, label: "Idioma oficial", color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { icon: Landmark, value: BRASIL_INFO.capital, label: "Capital", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
];

export const CONTATOS_EMERGENCIA = [
  { nome: "SAMU", telefone: "192", icone: Ambulance, cor: "text-destructive" },
  { nome: "Bombeiros", telefone: "193", icone: Flame, cor: "text-warning" },
  { nome: "Policia Militar", telefone: "190", icone: Shield, cor: "text-blue-500" },
  { nome: "Defesa Civil", telefone: "199", icone: AlertTriangle, cor: "text-accent" },
  { nome: "Policia Federal", telefone: "194", icone: Shield, cor: "text-violet-500" },
  { nome: "CVV (Apoio)", telefone: "188", icone: Heart, cor: "text-pink-500" },
];

export const CONTATOS_UTILIDADE = [
  { nome: "Disque Direitos Humanos", telefone: "100" },
  { nome: "Disque Denuncia", telefone: "181" },
  { nome: "Receita Federal", telefone: "146" },
  { nome: "Anatel (Telecomunicacoes)", telefone: "1331" },
];

export const GOV_FEDERAL = {
  nome: "Governo Federal do Brasil",
  site: "https://www.gov.br",
  telefone: "(61) 3411-1200",
  email: "ouvidoria@presidencia.gov.br",
  instagram: "@govbr",
  facebook: "govbr",
  twitter: "@govbrasil",
  youtube: "CanalGov",
};

export const NAV_LINKS = [
  { label: "Inicio", path: "home" },
  { label: "Numeros", path: "#numeros" },
  { label: "Sobre", path: "#sobre" },
  { label: "Empresas", path: "#empresas" },
  { label: "Estados", path: "#estados" },
  { label: "Territorios", path: "#territorios" },
  { label: "Contatos", path: "#contatos" },
];
