/**
 * SSOT: Sugestões de especialidades por categoria
 * 
 * Este é o ÚNICO lugar onde sugestões de especialidades são definidas.
 * Usado em:
 * - SpecialtiesEditor (componente de edição)
 * - Qualquer outro lugar que precise sugerir especialidades
 * 
 * REGRA: Nunca duplicar estas definições em outro arquivo!
 */

export const SPECIALTY_SUGGESTIONS: Readonly<Record<string, readonly string[]>> = {
  restaurante: [
    "Moqueca", "Acarajé", "Vatapá", "Caruru", "Bobó de Camarão",
    "Feijoada", "Churrasco", "Pizza", "Sushi", "Massas",
    "Comida Caseira", "Frutos do Mar", "Carnes", "Vegetariano", "Vegano",
    "Comida Baiana", "Comida Nordestina", "Comida Italiana", "Comida Japonesa",
    "Hambúrguer", "Tapioca", "Crepe", "Saladas", "Sopas"
  ],
  padaria: [
    "Pão Francês", "Pão de Forma", "Bolo", "Torta", "Salgados",
    "Doces", "Café", "Sanduíches", "Croissant", "Pão de Queijo",
    "Pão Integral", "Pão de Fermentação Natural", "Broa", "Biscoitos",
    "Empadas", "Quiches", "Folhados", "Sonho", "Coxinha"
  ],
  farmacia: [
    "Manipulação", "Dermocosméticos", "Homeopatia", "Perfumaria",
    "Medicamentos Genéricos", "Suplementos", "Ortopedia", "Vacinas",
    "Fitoterapia", "Produtos Naturais", "Fraldas", "Nutrição",
    "Medição de Pressão", "Aplicação de Injeções", "Testes Rápidos"
  ],
  salao: [
    "Corte Feminino", "Corte Masculino", "Coloração", "Mechas",
    "Escova", "Manicure", "Pedicure", "Depilação", "Maquiagem",
    "Penteados", "Tratamentos Capilares", "Alisamento", "Progressiva",
    "Design de Sobrancelhas", "Alongamento de Cílios", "Massagem"
  ],
  academia: [
    "Musculação", "Crossfit", "Pilates", "Yoga", "Spinning",
    "Funcional", "Boxe", "Natação", "Dança", "Personal Trainer",
    "Zumba", "Jump", "Muay Thai", "Jiu-Jitsu", "Alongamento",
    "Avaliação Física", "Nutrição Esportiva", "Hidroginástica"
  ],
  petshop: [
    "Banho e Tosa", "Veterinário", "Ração", "Acessórios",
    "Vacinas", "Hospedagem", "Adestramento", "Grooming",
    "Consultas", "Cirurgias", "Exames", "Medicamentos",
    "Brinquedos", "Camas", "Coleiras", "Transporte"
  ],
  mercado: [
    "Hortifruti", "Açougue", "Padaria", "Frios e Laticínios",
    "Bebidas", "Limpeza", "Higiene", "Congelados",
    "Mercearia", "Produtos Orgânicos", "Produtos Naturais"
  ],
  loja: [
    "Roupas Femininas", "Roupas Masculinas", "Roupas Infantis",
    "Calçados", "Acessórios", "Bolsas", "Joias", "Relógios",
    "Óculos", "Perfumes", "Cosméticos", "Eletrônicos"
  ],
  clinica: [
    "Clínica Geral", "Pediatria", "Ginecologia", "Cardiologia",
    "Dermatologia", "Ortopedia", "Oftalmologia", "Odontologia",
    "Psicologia", "Fisioterapia", "Nutrição", "Exames"
  ],
  automovel: [
    "Mecânica", "Elétrica", "Funilaria", "Pintura",
    "Alinhamento", "Balanceamento", "Troca de Óleo", "Revisão",
    "Ar Condicionado", "Som Automotivo", "Insulfilm", "Lavagem"
  ],
} as const;

// Helper functions
export const getSpecialtySuggestions = (category: string): readonly string[] => {
  const entry = Object.entries(SPECIALTY_SUGGESTIONS).find(([key]) => key === category);
  return entry?.[1] ?? [];
};

export const hasSpecialtySuggestions = (category: string): boolean => {
  return category in SPECIALTY_SUGGESTIONS;
};

export const getAllCategories = (): string[] => {
  return Object.keys(SPECIALTY_SUGGESTIONS);
};

// Type helper para categorias válidas
export type SpecialtyCategory = keyof typeof SPECIALTY_SUGGESTIONS;
