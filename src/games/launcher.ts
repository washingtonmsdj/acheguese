import { GAMES } from "./index";

export type LauncherItem = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  /** Route to run inside the app */
  playRoute: string;
  /** If true, item can be loaded into Studio (has buildSpec) */
  studioCapable: boolean;
  /** Optional: relative doc path in repo */
  docPath?: string;
};

export const LAUNCHER_ITEMS: LauncherItem[] = [
  ...GAMES.map((g) => ({
    id: g.id,
    title: g.title,
    tagline: g.tagline,
    description: g.description,
    playRoute: g.play?.route ?? `/games/play/${g.id}`,
    studioCapable: true,
    docPath: g.docPath,
  })),
  {
    id: "flood-test",
    title: "Sistema de Dilúvio - Teste AAA",
    tagline: "Ondas + chuva torrencial + névoa (Three.js runtime)",
    description:
      "Cenário de validação de água/empuxo/estabilidade em passo fixo. Ideal para calibrar substeps e tuning físico antes de migrar outros jogos.",
    playRoute: "/games/play/flood-test",
    studioCapable: false,
    docPath: "docs/diluvio.txt",
  },
];

export function getLauncherItemById(id: string | null | undefined): LauncherItem | undefined {
  if (!id) return undefined;
  return LAUNCHER_ITEMS.find((i) => i.id === id);
}
