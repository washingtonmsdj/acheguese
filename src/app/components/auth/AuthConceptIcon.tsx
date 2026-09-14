import type { CSSProperties } from "react";

import "./auth-concept-icons.css";

type AuthConceptIconName =
  | "back"
  | "eye"
  | "eye-off"
  | "google"
  | "shield"
  | "store"
  | "info"
  | "mail"
  | "warning"
  | "check"
  | "clock"
  | "help"
  | "person"
  | "chat"
  | "pin"
  | "users"
  | "lightbulb";

interface AuthConceptIconProps {
  name: AuthConceptIconName;
  className?: string;
  style?: CSSProperties;
}

/**
 * Ícones próprios do fluxo de autenticação.
 * Desenhados em CSS/HTML: sem SVG, icon font ou pacote de ícones genérico.
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
