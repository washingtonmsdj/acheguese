/**
 * ActionButton
 * 
 * Botão de ação com ícone e label.
 * Suporta link externo ou onClick handler.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { cn } from '@/shared/utils/cn';
import type { ActionButtonProps } from '../../sections/types';

export function ActionButton({
  icon: Icon,
  label,
  onClick,
  href,
  color = "primary",
  isActive = false,
}: ActionButtonProps) {
  const baseClasses = "flex flex-col items-center gap-1.5 bg-card border rounded-xl p-3 sm:p-4 transition-all group";
  const hoverClasses = isActive
    ? `border-${color}/40 bg-${color}/5`
    : `border-border hover:border-${color}/40 hover:shadow-lg`;

  const content = (
    <>
      <div className={cn(
        "p-2 sm:p-2.5 rounded-lg",
        isActive ? `bg-${color}/20` : `bg-${color}/10`
      )}>
        <Icon className={cn("h-5 w-5", `text-${color}`)} />
      </div>
      <span className={cn(
        "text-[11px] sm:text-xs font-medium transition-colors",
        isActive ? `text-${color}` : `text-muted-foreground group-hover:text-${color}`
      )}>
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseClasses, hoverClasses)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(baseClasses, hoverClasses)}
    >
      {content}
    </button>
  );
}
