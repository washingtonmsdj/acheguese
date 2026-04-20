/**
 * Time utilities para Classificados
 * 
 * SSOT: Funções utilitárias centralizadas
 * Sem gambiarras: Código limpo e testável
 */

/**
 * Converte uma data em string relativa (ex: "5min", "2h", "3d")
 */
export function getRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    
    if (mins < 60) return `${mins}min`;
    
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    
    return `${Math.floor(days / 30)}m`;
  } catch {
    return "";
  }
}
