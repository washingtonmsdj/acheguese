import {
  Calendar,
  Heart,
  Handshake,
  Map,
  MessageCircle,
  PenLine,
  Star,
  Tag,
  Ticket,
  Trophy,
  Flame,
  type LucideIcon,
} from "lucide-react";

export interface GamBadge {
  id: string;
  name: string;
  icone: LucideIcon;
  description: string;
  criterio: string;
  cor: string;
}

export const badges: GamBadge[] = [
  {
    id: "primeiro_post",
    name: "Primeiro Post",
    icone: PenLine,
    description: "Publicou seu primeiro post no feed",
    criterio: "1 post",
    cor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  {
    id: "comunicador",
    name: "Comunicador",
    icone: MessageCircle,
    description: "Fez 10 comentários em posts",
    criterio: "10 comentários",
    cor: "bg-primary/10 text-primary border-primary/20",
  },
  {
    id: "avaliador",
    name: "Avaliador",
    icone: Star,
    description: "Avaliou 5 comércios do bairro",
    criterio: "5 avaliações",
    cor: "bg-warning/10 text-warning border-warning/20",
  },
  {
    id: "explorador",
    name: "Explorador",
    icone: Map,
    description: "Visitou páginas de 10 comércios",
    criterio: "10 visitas",
    cor: "bg-success/10 text-success border-success/20",
  },
  {
    id: "solidario",
    name: "Solidário",
    icone: Handshake,
    description: "Confirmou presença em 3 eventos",
    criterio: "3 eventos",
    cor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  {
    id: "influencer",
    name: "Influencer Local",
    icone: Flame,
    description: "Recebeu 50 curtidas em posts",
    criterio: "50 curtidas",
    cor: "bg-destructive/10 text-destructive border-destructive/20",
  },
  {
    id: "veterano",
    name: "Veterano",
    icone: Trophy,
    description: "Está no app há mais de 30 dias",
    criterio: "30 dias ativo",
    cor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  {
    id: "vendedor",
    name: "Vendedor",
    icone: Tag,
    description: "Publicou 3 classificados",
    criterio: "3 anúncios",
    cor: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  },
];

export const niveis = [
  { nivel: 1, name: "Vizinho Novo", minPontos: 0, maxPontos: 100 },
  { nivel: 2, name: "Morador Ativo", minPontos: 100, maxPontos: 250 },
  { nivel: 3, name: "Referência do Bairro", minPontos: 250, maxPontos: 500 },
  { nivel: 4, name: "Líder Comunitário", minPontos: 500, maxPontos: 1000 },
  { nivel: 5, name: "Lenda da Comunidade", minPontos: 1000, maxPontos: 9999 },
];

export const pontosRegras = [
  { acao: "Publicar post", pontos: 10, icone: PenLine },
  { acao: "Comentar em post", pontos: 5, icone: MessageCircle },
  { acao: "Avaliar comércio", pontos: 15, icone: Star },
  { acao: "Confirmar presença em evento", pontos: 10, icone: Calendar },
  { acao: "Publicar classificado", pontos: 10, icone: Tag },
  { acao: "Receber curtida", pontos: 2, icone: Heart },
  { acao: "Copiar cupom", pontos: 3, icone: Ticket },
];

export function getNivel(pontos: number) {
  const n =
    [...niveis].reverse().find((n) => pontos >= n.minPontos) || niveis[0];
  return n;
}

export function getProgresso(pontos: number) {
  const nivel = getNivel(pontos);
  const range = nivel.maxPontos - nivel.minPontos;
  return Math.min(((pontos - nivel.minPontos) / range) * 100, 100);
}
