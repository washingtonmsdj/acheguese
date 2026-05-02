export type GroupCategoryId =
  | "geral"
  | "bairro"
  | "rua"
  | "seguranca"
  | "avisos"
  | "comercio"
  | "servicos"
  | "gastronomia"
  | "vagas"
  | "educacao"
  | "cultura"
  | "esportes"
  | "mobilidade"
  | "familia"
  | "saude"
  | "moradia"
  | "doacoes"
  | "eventos"
  | "outros";

export interface GroupCategory {
  id: GroupCategoryId;
  label: string;
  description: string;
  token: string;
  tone: string;
}

export const GROUP_CATEGORIES: GroupCategory[] = [
  { id: "geral", label: "Geral", description: "Conversas abertas da comunidade.", token: "#", tone: "text-slate-300" },
  { id: "bairro", label: "Bairro", description: "Assuntos de Nordeste, Santa Cruz, Vale ou Chapada.", token: "BA", tone: "text-teal-300" },
  { id: "rua", label: "Rua e predio", description: "Organizacao por rua, bloco, vila ou condominio.", token: "R", tone: "text-cyan-300" },
  { id: "seguranca", label: "Seguranca", description: "Alertas preventivos, cuidado e apoio local.", token: "S", tone: "text-red-300" },
  { id: "avisos", label: "Avisos", description: "Comunicados rapidos e informacoes importantes.", token: "!", tone: "text-amber-300" },
  { id: "comercio", label: "Comercio", description: "Lojas, vendas, promocoes e oportunidades locais.", token: "$", tone: "text-emerald-300" },
  { id: "servicos", label: "Servicos", description: "Profissionais, reparos, diaristas e indicacoes.", token: "SV", tone: "text-blue-300" },
  { id: "gastronomia", label: "Gastronomia", description: "Comida, delivery, lanches e restaurantes.", token: "G", tone: "text-orange-300" },
  { id: "vagas", label: "Vagas", description: "Trabalho, bicos, cursos e renda.", token: "V", tone: "text-lime-300" },
  { id: "educacao", label: "Educacao", description: "Escolas, reforco, cursos e estudo.", token: "E", tone: "text-indigo-300" },
  { id: "cultura", label: "Cultura", description: "Arte, musica, danca, memoria e producao local.", token: "C", tone: "text-fuchsia-300" },
  { id: "esportes", label: "Esportes", description: "Times, treinos, peladas e atividades fisicas.", token: "SP", tone: "text-green-300" },
  { id: "mobilidade", label: "Mobilidade", description: "Transporte, carona, motoboy e rotas.", token: "M", tone: "text-sky-300" },
  { id: "familia", label: "Familia", description: "Criancas, idosos, cuidado e rede de apoio.", token: "F", tone: "text-pink-300" },
  { id: "saude", label: "Saude", description: "Campanhas, orientacoes e apoio comunitario.", token: "+", tone: "text-rose-300" },
  { id: "moradia", label: "Moradia", description: "Aluguel, manutencao, obras e vizinhanca.", token: "H", tone: "text-yellow-300" },
  { id: "doacoes", label: "Doacoes", description: "Trocas, doacoes, vaquinhas e ajuda solidaria.", token: "D", tone: "text-purple-300" },
  { id: "eventos", label: "Eventos", description: "Agenda, reunioes, festas e encontros.", token: "EV", tone: "text-violet-300" },
  { id: "outros", label: "Outros", description: "Assuntos que ainda nao têm categoria propria.", token: "...", tone: "text-gray-300" },
];

export const GROUP_CAPABILITY_LABELS = {
  text: "Textos",
  images: "Imagens",
  audio: "Audio",
  polls: "Enquetes",
  chat: "Bate-papo",
  reactions: "Curtidas",
  reports: "Denuncias",
  share_link: "Link",
} as const;

export const GROUP_GOVERNANCE_PRESETS = [
  {
    id: "open",
    label: "Aberto",
    description: "Qualquer morador pode entrar e postar.",
    joinPolicy: "open",
    postingPolicy: "members",
  },
  {
    id: "moderated",
    label: "Moderado",
    description: "Entrada livre, com regras e moderacao ativa.",
    joinPolicy: "open",
    postingPolicy: "members",
  },
  {
    id: "restricted",
    label: "Restrito",
    description: "Entrada por aprovacao ou convite.",
    joinPolicy: "approval",
    postingPolicy: "members",
  },
  {
    id: "broadcast",
    label: "Somente admins",
    description: "Ideal para avisos, comunicados e canais oficiais.",
    joinPolicy: "open",
    postingPolicy: "admins",
  },
] as const;

export const DEFAULT_GROUP_RULES = [
  "Respeite moradores, comerciantes e liderancas locais.",
  "Nao publique dados pessoais de terceiros sem autorizacao.",
  "Denuncias e alertas devem trazer contexto verificavel.",
  "Publicidade repetitiva pode ser removida pela moderacao.",
  "Conteudo ilegal, discriminatorio ou ameacador resulta em remocao.",
];

export function getGroupCategory(categoryId?: string | null): GroupCategory {
  return GROUP_CATEGORIES.find((category) => category.id === categoryId) ?? GROUP_CATEGORIES[0];
}
