/**
 * 🏆 JOB HELPERS - Funções auxiliares para vagas
 */

import type { Job } from "../types/job.types";

/**
 * Formata o salário da vaga
 */
export function formatSalary(job: Job): string {
  if (job.ocultar_salario) return "A combinar";
  if (job.salario_texto) return job.salario_texto;
  
  if (job.salario_min && job.salario_max) {
    return `R$ ${job.salario_min.toLocaleString("pt-BR")} – R$ ${job.salario_max.toLocaleString("pt-BR")}`;
  }
  
  if (job.salario_min) {
    return `A partir de R$ ${job.salario_min.toLocaleString("pt-BR")}`;
  }
  
  return "A combinar";
}

/**
 * Formata o tempo decorrido desde a criação
 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `${days} dias atrás`;
  if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
  
  return `${Math.floor(days / 30)} mês(es) atrás`;
}
