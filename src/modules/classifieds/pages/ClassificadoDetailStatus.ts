export function getClassifiedStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    active: "ativo",
    inactive: "pausado",
    sold: "vendido",
    pending: "em análise",
    rejected: "rejeitado",
    expired: "expirado",
    deleted: "removido",
  };

  return labels[status || ""] || "não informado";
}
