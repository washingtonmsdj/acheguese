/**
 * Formatters - Funções utilitárias para formatação
 * 
 * SSOT: Funções reutilizáveis para formatação de dados
 * Sem gambiarras: Funções puras e testáveis
 */

/**
 * Formata data para formato brasileiro
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Extrai iniciais de um nome
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Calcula anos de atividade
 */
export function getYearsActive(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const years = Math.floor(
    (now.getTime() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  
  if (years < 1) return "Menos de 1 ano";
  return `${years} ano${years > 1 ? "s" : ""}`;
}

/**
 * Formata preço para formato brasileiro
 */
export function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2).replace(".", ",")}`;
}
