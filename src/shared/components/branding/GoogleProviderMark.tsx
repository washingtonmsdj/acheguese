import type { CSSProperties } from "react";

import "./google-provider-mark.css";

interface GoogleProviderMarkProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Marca visual compartilhada do provedor Google.
 * Desenhada em CSS/HTML para evitar SVGs duplicados e ícones genéricos que não
 * representam o provedor corretamente.
 */
export function GoogleProviderMark({ className = "", style }: GoogleProviderMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`google-provider-mark ${className}`.trim()}
      style={style}
    >
      <span className="google-provider-mark__inner" />
      <span className="google-provider-mark__cutout" />
      <span className="google-provider-mark__bar" />
    </span>
  );
}