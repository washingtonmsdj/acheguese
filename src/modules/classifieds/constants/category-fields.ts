/**
 * 📋 SSOT: CAMPOS DINÂMICOS POR CATEGORIA
 *
 * Define os campos específicos que cada categoria de anúncio exige.
 * Usado pelo formulário de criação/edição para renderizar campos dinâmicos.
 */

export interface CategoryField {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  suffix?: string;
}

export const CATEGORY_SPECIFIC_FIELDS: Record<string, CategoryField[]> = {
  veículos: [
    { key: "brand", label: "Marca", type: "text", placeholder: "Ex: Honda", required: true },
    { key: "model", label: "Modelo", type: "text", placeholder: "Ex: Civic", required: true },
    {
      key: "year", label: "Ano", type: "number", placeholder: "Ex: 2022",
    },
    { key: "mileage", label: "Quilometragem", type: "number", placeholder: "Ex: 45000", suffix: "km" },
    {
      key: "fuel", label: "Combustível", type: "select",
      options: [
        { value: "flex", label: "Flex" },
        { value: "gasolina", label: "Gasolina" },
        { value: "etanol", label: "Etanol" },
        { value: "diesel", label: "Diesel" },
        { value: "eletrico", label: "Elétrico" },
        { value: "hibrido", label: "Híbrido" },
      ],
    },
    {
      key: "transmission", label: "Câmbio", type: "select",
      options: [
        { value: "manual", label: "Manual" },
        { value: "automatico", label: "Automático" },
        { value: "cvt", label: "CVT" },
      ],
    },
  ],
  imóveis: [
    {
      key: "property_type", label: "Tipo de Imóvel", type: "select", required: true,
      options: [
        { value: "apartamento", label: "Apartamento" },
        { value: "casa", label: "Casa" },
        { value: "kitnet", label: "Kitnet/Studio" },
        { value: "terreno", label: "Terreno" },
        { value: "comercial", label: "Comercial" },
        { value: "cobertura", label: "Cobertura" },
      ],
    },
    { key: "bedrooms", label: "Quartos", type: "number", placeholder: "Ex: 2" },
    { key: "bathrooms", label: "Banheiros", type: "number", placeholder: "Ex: 1" },
    { key: "area", label: "Área (m²)", type: "number", placeholder: "Ex: 65", suffix: "m²" },
    {
      key: "listing_type", label: "Tipo de Anúncio", type: "select",
      options: [
        { value: "venda", label: "Venda" },
        { value: "aluguel", label: "Aluguel" },
        { value: "temporada", label: "Temporada" },
      ],
    },
    { key: "parking", label: "Vagas Garagem", type: "number", placeholder: "Ex: 1" },
  ],
  serviços: [
    { key: "service_type", label: "Tipo de Serviço", type: "text", placeholder: "Ex: Encanador", required: true },
    {
      key: "availability", label: "Disponibilidade", type: "select",
      options: [
        { value: "imediata", label: "Imediata" },
        { value: "agendar", label: "Sob agendamento" },
        { value: "seg-sex", label: "Seg a Sex" },
        { value: "fins-de-semana", label: "Fins de semana" },
      ],
    },
    {
      key: "experience", label: "Experiência", type: "select",
      options: [
        { value: "1-2", label: "1-2 anos" },
        { value: "3-5", label: "3-5 anos" },
        { value: "5-10", label: "5-10 anos" },
        { value: "10+", label: "10+ anos" },
      ],
    },
  ],
  vagas: [
    { key: "company", label: "Empresa", type: "text", placeholder: "Ex: Tech Corp" },
    {
      key: "contract_type", label: "Tipo de Contrato", type: "select", required: true,
      options: [
        { value: "clt", label: "CLT" },
        { value: "pj", label: "PJ" },
        { value: "freelancer", label: "Freelancer" },
        { value: "estagio", label: "Estágio" },
        { value: "temporario", label: "Temporário" },
      ],
    },
    {
      key: "work_mode", label: "Modelo de Trabalho", type: "select",
      options: [
        { value: "presencial", label: "Presencial" },
        { value: "remoto", label: "Remoto" },
        { value: "hibrido", label: "Híbrido" },
      ],
    },
    { key: "salary_range", label: "Faixa Salarial", type: "text", placeholder: "Ex: R$ 3.000 - R$ 5.000" },
  ],
  eletrônicos: [
    { key: "brand", label: "Marca", type: "text", placeholder: "Ex: Samsung" },
    { key: "model", label: "Modelo", type: "text", placeholder: "Ex: Galaxy S24" },
    { key: "storage", label: "Armazenamento", type: "text", placeholder: "Ex: 256GB" },
    {
      key: "warranty", label: "Garantia", type: "select",
      options: [
        { value: "sim", label: "Com garantia" },
        { value: "nao", label: "Sem garantia" },
      ],
    },
  ],
  games: [
    {
      key: "platform", label: "Plataforma", type: "select",
      options: [
        { value: "ps5", label: "PlayStation 5" },
        { value: "ps4", label: "PlayStation 4" },
        { value: "xbox-series", label: "Xbox Series" },
        { value: "xbox-one", label: "Xbox One" },
        { value: "switch", label: "Nintendo Switch" },
        { value: "pc", label: "PC" },
      ],
    },
    {
      key: "item_type", label: "Tipo", type: "select",
      options: [
        { value: "console", label: "Console" },
        { value: "jogo", label: "Jogo" },
        { value: "acessorio", label: "Acessório" },
      ],
    },
  ],
} as const;

/**
 * Retorna campos específicos para uma categoria.
 */
export function getCategoryFields(categoryId: string): CategoryField[] {
  return (CATEGORY_SPECIFIC_FIELDS as Record<string, CategoryField[]>)[categoryId] || [];
}

/**
 * Verifica se uma categoria possui campos específicos.
 */
export function hasCategoryFields(categoryId: string): boolean {
  return categoryId in CATEGORY_SPECIFIC_FIELDS;
}
