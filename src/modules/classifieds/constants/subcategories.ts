/**
 * 📋 SSOT: SUBCATEGORIAS DE CLASSIFICADOS
 *
 * Define subcategorias dinâmicas para cada categoria principal.
 * Usado no formulário de criação para refinar a classificação do anúncio.
 */

export interface ClassifiedSubcategory {
  id: string;
  label: string;
}

/**
 * Mapa de subcategorias por categoria principal.
 */
export const CLASSIFIED_SUBCATEGORIES: Record<string, readonly ClassifiedSubcategory[]> = {
  veiculos: [
    { id: "carros", label: "Carros" },
    { id: "motos", label: "Motos" },
    { id: "caminhoes", label: "Caminhões" },
    { id: "onibus", label: "Ônibus" },
    { id: "barcos", label: "Barcos" },
    { id: "pecas", label: "Peças e Acessórios" },
  ],
  imoveis: [
    { id: "apartamento", label: "Apartamento" },
    { id: "casa", label: "Casa" },
    { id: "kitnet", label: "Kitnet/Studio" },
    { id: "terreno", label: "Terreno" },
    { id: "comercial", label: "Comercial" },
    { id: "cobertura", label: "Cobertura" },
    { id: "sitio", label: "Sítio/Chácara" },
  ],
  eletronicos: [
    { id: "celulares", label: "Celulares" },
    { id: "computadores", label: "Computadores" },
    { id: "tablets", label: "Tablets" },
    { id: "tvs", label: "TVs" },
    { id: "audio", label: "Áudio" },
    { id: "cameras", label: "Câmeras" },
    { id: "acessorios", label: "Acessórios" },
  ],
  moveis: [
    { id: "sala", label: "Sala" },
    { id: "quarto", label: "Quarto" },
    { id: "cozinha", label: "Cozinha" },
    { id: "escritorio", label: "Escritório" },
    { id: "decoracao", label: "Decoração" },
    { id: "jardim", label: "Jardim" },
  ],
  vestuario: [
    { id: "masculino", label: "Masculino" },
    { id: "feminino", label: "Feminino" },
    { id: "infantil", label: "Infantil" },
    { id: "calcados", label: "Calçados" },
    { id: "acessorios", label: "Acessórios" },
    { id: "esportivo", label: "Esportivo" },
  ],
  servicos: [
    { id: "reformas", label: "Reformas" },
    { id: "limpeza", label: "Limpeza" },
    { id: "beleza", label: "Beleza" },
    { id: "eventos", label: "Eventos" },
    { id: "tecnologia", label: "Tecnologia" },
    { id: "educacao", label: "Educação" },
    { id: "saude", label: "Saúde" },
    { id: "transporte", label: "Transporte" },
  ],
  vagas: [
    { id: "tecnologia", label: "Tecnologia" },
    { id: "vendas", label: "Vendas" },
    { id: "administracao", label: "Administração" },
    { id: "saude", label: "Saúde" },
    { id: "educacao", label: "Educação" },
    { id: "servicos-gerais", label: "Serviços Gerais" },
    { id: "gastronomia", label: "Gastronomia" },
  ],
  esportes: [
    { id: "equipamentos", label: "Equipamentos" },
    { id: "bicicletas", label: "Bicicletas" },
    { id: "fitness", label: "Fitness" },
    { id: "uniformes", label: "Uniformes" },
  ],
  livros: [
    { id: "didaticos", label: "Didáticos" },
    { id: "literatura", label: "Literatura" },
    { id: "infantis", label: "Infantis" },
    { id: "tecnicos", label: "Técnicos" },
  ],
  animais: [
    { id: "pets", label: "Pets" },
    { id: "acessorios", label: "Acessórios" },
    { id: "racao", label: "Ração" },
    { id: "servicos-pet", label: "Serviços pet" },
  ],
  outro: [
    { id: "instrumentos", label: "Instrumentos" },
    { id: "brinquedos", label: "Brinquedos" },
    { id: "ferramentas", label: "Ferramentas" },
  ],
} as const;

/**
 * Retorna subcategorias para uma categoria específica.
 */
export function getSubcategories(categoryId: string): readonly ClassifiedSubcategory[] {
  return (
    Object.entries(CLASSIFIED_SUBCATEGORIES).find(
      ([currentCategoryId]) => currentCategoryId === categoryId,
    )?.[1] ?? []
  );
}

/**
 * Verifica se uma categoria possui subcategorias.
 */
export function hasSubcategories(categoryId: string): boolean {
  return getSubcategories(categoryId).length > 0;
}

/**
 * Retorna o label de uma subcategoria.
 */
export function getSubcategoryLabel(categoryId: string, subcategoryId: string): string {
  const subcategories = getSubcategories(categoryId);
  return subcategories.find((s) => s.id === subcategoryId)?.label || subcategoryId;
}


/**
 * Valida se uma subcategoria é válida para uma categoria.
 */
export function isValidSubcategory(categoryId: string, subcategoryId: string): boolean {
  const subcategories = getSubcategories(categoryId);
  return subcategories.some((s) => s.id === subcategoryId);
}
