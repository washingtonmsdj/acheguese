// Patterns that indicate accusations against people or places
const ACCUSATION_PATTERNS = [
  /\b\w+\s+(é|eh|e)\s+(ladr[aã]o|traficante|bandido|criminoso|assassino|pedófilo|estuprador|golpista)/gi,
  /\b(casa|loja|bar|ponto|local|lugar)\s+(tal|do|da|de)\s+(é|eh)\s+(ponto\s+de\s+tráfico|boca\s+de\s+fumo|esconderijo)/gi,
  /\bponto\s+de\s+tráfico/gi,
  /\bboca\s+de\s+fumo/gi,
  /\b(fulano|ciclano|beltrano)\s+(é|eh)\s+(ladr[aã]o|bandido)/gi,
];

// Patterns for police/blitz operations
const POLICE_PATTERNS = [
  /\bblitz\s+(na|no|em|aqui|ali|lá)/gi,
  /\b(operação|operacao)\s+(policial|da\s+pm|da\s+polícia)/gi,
  /\bpolícia\s+(está|tá|ta)\s+(aqui|ali|lá|na|no)/gi,
];

export interface ContentFilterResult {
  blocked: boolean;
  reason: string | null;
}

export function checkContent(text: string): ContentFilterResult {
  for (const pattern of ACCUSATION_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason:
          "Não é permitido acusar pessoas ou locais de atividades criminosas. Denúncias devem ser feitas às autoridades competentes.",
      };
    }
  }

  for (const pattern of POLICE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason:
          "Não é permitido divulgar localização de operações policiais ou blitz.",
      };
    }
  }

  return { blocked: false, reason: null };
}
