import type { CSSProperties } from "react";

import "./auth-concept-icons.css";

type AuthConceptIconName =
  | "back"
  | "eye"
  | "google"
  | "shield"
  | "store"
  | "info";

interface AuthConceptIconProps {
  name: AuthConceptIconName;
  className?: string;
  style?: CSSProperties;
}

/**
 * Ícones próprios do fluxo de autenticação.
 * São desenhados em CSS/HTML para não depender de SVG, icon fonts ou arte genérica.
 */
export function AuthConceptIcon({ name, className = "", style }: AuthConceptIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`auth-concept-icon auth-concept-icon--${name} ${className}`.trim()}
      style={style}
    >
      <span className="auth-concept-icon__a" />
      <span className="auth-concept-icon__b" />
      <span className="auth-concept-icon__c" />
    </span>
  );
}
