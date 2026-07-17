/**
 * BusinessLogo - Componente para exibir logo de negócio com fallback para iniciais
 * 
 * Exibe a logo da empresa ou, caso não exista, mostra as iniciais do nome
 * em um avatar estilizado.
 */

import { cn } from "@/shared/utils/cn";
import { SafeImage } from "@/shared/components/security/SafeImage";

interface BusinessLogoProps {
  name: string;
  logoUrl?: string | null;
  alt?: string;
  className?: string;
  initialsClassName?: string;
}

/**
 * Extrai as iniciais de um nome (até 2 letras)
 * Exemplos:
 * - "Pizza Hut" -> "PH"
 * - "McDonald's" -> "MC"
 * - "Restaurante" -> "RE"
 */
function getInitials(name: string): string {
  if (!name) return "?";
  
  const words = name.trim().split(/\s+/);
  
  if (words.length >= 2) {
    // Pega primeira letra de cada uma das duas primeiras palavras
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  // Se for uma palavra só, pega as duas primeiras letras
  return name.slice(0, 2).toUpperCase();
}

export function BusinessLogo({
  name,
  logoUrl,
  alt,
  className,
  initialsClassName,
}: BusinessLogoProps) {
  const initials = getInitials(name);
  const ariaLabel = alt || `Logo de ${name}`;

  if (logoUrl) {
    return (
      <SafeImage
        src={logoUrl}
        alt={ariaLabel}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }

  // Fallback: exibe iniciais
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold",
        initialsClassName,
        className
      )}
      aria-label={ariaLabel}
      role="img"
    >
      <span className="text-[0.6em] leading-none">{initials}</span>
    </div>
  );
}
