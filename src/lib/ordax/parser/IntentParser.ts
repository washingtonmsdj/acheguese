/**
 * Intent Parser - Extrai intenção estruturada do prompt do usuário
 * 
 * Papel: Traduzir linguagem natural → estrutura determinística
 * NÃO cria lógica, NÃO decide gameplay, apenas IDENTIFICA e CLASSIFICA
 */

export type ParsedAction = "create" | "edit" | "add" | "remove" | "test";
export type ParsedTarget = "game" | "level" | "entity" | "feature";
export type ParsedGenre = "racing" | "shooter" | "platformer" | "puzzle" | "sports" | "topdown" | "unknown";
export type ParsedDimension = "2d" | "3d";
export type ParsedVehicle = "car" | "spaceship" | "character" | "tank" | "boat" | "plane" | null;

export interface ParsedIntent {
  // Ação principal
  action: ParsedAction;
  
  // Alvo da ação
  target: ParsedTarget;
  
  // Gêneros identificados (pode ter múltiplos)
  genres: ParsedGenre[];
  
  // Veículo/personagem mencionado
  vehicle: ParsedVehicle;
  
  // Mecânicas explícitas
  mechanics: string[];
  
  // Restrições
  constraints: {
    dimension: ParsedDimension;
    multiplayer?: boolean;
    mobile?: boolean;
    realistic?: boolean;
  };
  
  // Estilo/intensificadores
  style?: "arcade" | "realistic" | "simple" | "complex";
  
  // Confiança do parse (0-1)
  confidence: number;
  
  // Tokens não reconhecidos (para debug)
  unknownTokens: string[];
}

/**
 * Dicionário controlado - ÚNICA fonte de verdade
 * Qualquer palavra fora disso é ignorada ou vira sugestão
 */
const DICTIONARY = {
  // Ações
  actions: {
    "criar": "create",
    "cria": "create",
    "fazer": "create",
    "gerar": "create",
    "novo": "create",
    "editar": "edit",
    "modificar": "edit",
    "mudar": "edit",
    "adicionar": "add",
    "add": "add",
    "remover": "remove",
    "deletar": "remove",
    "testar": "test",
  },
  
  // Alvos
  targets: {
    "jogo": "game",
    "game": "game",
    "fase": "level",
    "level": "level",
    "nível": "level",
    "personagem": "entity",
    "entidade": "entity",
    "feature": "feature",
    "funcionalidade": "feature",
  },
  
  // Gêneros
  genres: {
    "corrida": "racing",
    "racing": "racing",
    "carro": "racing",
    "pista": "racing",
    "velocidade": "racing",
    "nave": "shooter",
    "space": "shooter",
    "shooter": "shooter",
    "tiro": "shooter",
    "atirar": "shooter",
    "plataforma": "platformer",
    "platformer": "platformer",
    "pulo": "platformer",
    "jump": "platformer",
    "puzzle": "puzzle",
    "quebra-cabeça": "puzzle",
    "lógica": "puzzle",
    "esporte": "sports",
    "sports": "sports",
    "topdown": "topdown",
    "top-down": "topdown",
  },
  
  // Veículos
  vehicles: {
    "carro": "car",
    "automóvel": "car",
    "veículo": "car",
    "car": "car",
    "nave": "spaceship",
    "espaçonave": "spaceship",
    "spaceship": "spaceship",
    "tanque": "tank",
    "tank": "tank",
    "barco": "boat",
    "boat": "boat",
    "avião": "plane",
    "plane": "plane",
    "personagem": "character",
    "character": "character",
  },
  
  // Mecânicas
  mechanics: {
    "arma": "shooting",
    "armas": "shooting",
    "tiro": "shooting",
    "atirar": "shooting",
    "shoot": "shooting",
    "inimigo": "enemies",
    "inimigos": "enemies",
    "enemy": "enemies",
    "enemies": "enemies",
    "obstaculo": "obstacles",
    "obstaculos": "obstacles",
    "obstáculo": "obstacles",
    "obstáculos": "obstacles",
    "obstacle": "obstacles",
    "tempo": "timer",
    "timer": "timer",
    "cronômetro": "timer",
    "cronometro": "timer",
    "pulo": "jumping",
    "jump": "jumping",
    "salto": "jumping",
    "coleta": "collecting",
    "coletar": "collecting",
    "collect": "collecting",
  },
  
  // Dimensão
  dimensions: {
    "2d": "2d",
    "2D": "2d",
    "bidimensional": "2d",
    "3d": "3d",
    "3D": "3d",
    "tridimensional": "3d",
  },
  
  // Estilo
  styles: {
    "arcade": "arcade",
    "simples": "simple",
    "simple": "simple",
    "realista": "realistic",
    "realistic": "realistic",
    "complexo": "complex",
    "complex": "complex",
  },
};

export class IntentParser {
  /**
   * Parse principal - entrada: string, saída: estrutura determinística
   */
  parse(input: string): ParsedIntent {
    // 1. Tokenização
    const tokens = this.tokenize(input);
    
    // 2. Classificação
    const action = this.extractAction(tokens);
    const target = this.extractTarget(tokens);
    const genres = this.extractGenres(tokens);
    const vehicle = this.extractVehicle(tokens);
    const mechanics = this.extractMechanics(tokens);
    const dimension = this.extractDimension(tokens);
    const style = this.extractStyle(tokens);
    
    // 3. Validação e defaults
    const validated = this.validate({
      action,
      target,
      genres,
      vehicle,
      mechanics,
      constraints: { dimension },
      style,
    });
    
    // 4. Calcular confiança
    const confidence = this.calculateConfidence(validated, tokens);
    
    // 5. Identificar tokens desconhecidos
    const unknownTokens = this.findUnknownTokens(tokens);
    
    return {
      ...validated,
      confidence,
      unknownTokens,
    };
  }
  
  /**
   * Tokenização - quebra em palavras normalizadas
   */
  private tokenize(input: string): string[] {
    return input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^\w\s-]/g, " ") // Remove pontuação
      .split(/\s+/)
      .filter(t => t.length > 1); // Remove tokens muito curtos
  }
  
  /**
   * Extração de ação
   */
  private extractAction(tokens: string[]): ParsedAction {
    for (const token of tokens) {
      const action = DICTIONARY.actions[token];
      if (action) return action as ParsedAction;
    }
    return "create"; // Default
  }
  
  /**
   * Extração de alvo
   */
  private extractTarget(tokens: string[]): ParsedTarget {
    for (const token of tokens) {
      const target = DICTIONARY.targets[token];
      if (target) return target as ParsedTarget;
    }
    return "game"; // Default
  }
  
  /**
   * Extração de gêneros (pode ter múltiplos)
   */
  private extractGenres(tokens: string[]): ParsedGenre[] {
    const genres = new Set<ParsedGenre>();
    
    for (const token of tokens) {
      const genre = DICTIONARY.genres[token];
      if (genre) genres.add(genre as ParsedGenre);
    }
    
    return genres.size > 0 ? Array.from(genres) : ["unknown"];
  }
  
  /**
   * Extração de veículo
   */
  private extractVehicle(tokens: string[]): ParsedVehicle {
    for (const token of tokens) {
      const vehicle = DICTIONARY.vehicles[token];
      if (vehicle) return vehicle as ParsedVehicle;
    }
    return null;
  }
  
  /**
   * Extração de mecânicas
   */
  private extractMechanics(tokens: string[]): string[] {
    const mechanics = new Set<string>();
    
    for (const token of tokens) {
      const mechanic = DICTIONARY.mechanics[token];
      if (mechanic) mechanics.add(mechanic);
    }
    
    return Array.from(mechanics);
  }
  
  /**
   * Extração de dimensão
   */
  private extractDimension(tokens: string[]): ParsedDimension {
    for (const token of tokens) {
      const dimension = DICTIONARY.dimensions[token];
      if (dimension) return dimension as ParsedDimension;
    }
    return "2d"; // Default
  }
  
  /**
   * Extração de estilo
   */
  private extractStyle(tokens: string[]): "arcade" | "realistic" | "simple" | "complex" | undefined {
    for (const token of tokens) {
      const style = DICTIONARY.styles[token];
      if (style) return style as "arcade" | "realistic" | "simple" | "complex";
    }
    return undefined;
  }
  
  /**
   * Validação e aplicação de regras
   */
  private validate(intent: Partial<ParsedIntent>): Omit<ParsedIntent, "confidence" | "unknownTokens"> {
    const genres = intent.genres || ["unknown"];
    const vehicle = intent.vehicle;
    const mechanics = intent.mechanics || [];
    
    // Regra: veículo define gênero primário
    if (vehicle === "car" && !genres.includes("racing")) {
      genres.unshift("racing");
    }
    if (vehicle === "spaceship" && !genres.includes("shooter")) {
      genres.unshift("shooter");
    }
    
    // Regra: mecânicas adicionam gêneros secundários
    if (mechanics.includes("shooting") && !genres.includes("shooter")) {
      genres.push("shooter");
    }
    
    return {
      action: intent.action || "create",
      target: intent.target || "game",
      genres: genres.filter((g, i, arr) => arr.indexOf(g) === i), // Remove duplicatas
      vehicle: vehicle || null,
      mechanics,
      constraints: intent.constraints || { dimension: "2d" },
      style: intent.style,
    };
  }
  
  /**
   * Cálculo de confiança (0-1)
   */
  private calculateConfidence(intent: Omit<ParsedIntent, "confidence" | "unknownTokens">, tokens: string[]): number {
    let score = 0;
    
    // Ação identificada (+0.15)
    if (intent.action !== "create") score += 0.15;
    else score += 0.1; // Default também conta
    
    // Alvo identificado (+0.15)
    if (intent.target !== "game") score += 0.15;
    else score += 0.1; // Default também conta
    
    // Gênero identificado (+0.3)
    if (intent.genres[0] !== "unknown") score += 0.3;
    
    // Veículo identificado (+0.2)
    if (intent.vehicle) score += 0.2;
    
    // Mecânicas identificadas (+0.15)
    if (intent.mechanics.length > 0) score += 0.15;
    
    // Múltiplos gêneros (+0.1)
    if (intent.genres.length > 1) score += 0.1;
    
    return Math.min(1.0, score);
  }
  
  /**
   * Identifica tokens não reconhecidos (para debug/melhoria)
   */
  private findUnknownTokens(tokens: string[]): string[] {
    const known = new Set<string>();
    
    // Adiciona todas as palavras conhecidas
    Object.values(DICTIONARY).forEach(dict => {
      Object.keys(dict).forEach(key => known.add(key));
    });
    
    // Filtra tokens desconhecidos
    return tokens.filter(t => !known.has(t));
  }
}
