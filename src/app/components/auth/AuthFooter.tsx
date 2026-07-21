import { Link } from "react-router-dom";

import {
  PRIVACY_POLICY_PATH,
  SUPPORT_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/shared/constants/legal";

/**
 * AuthFooter
 * Rodapé legal padrão das páginas de autenticação (login, cadastro, reset, confirmação).
 * Requisito LGPD / App Store: acesso claro a Termos, Privacidade e Suporte.
 */
export function AuthFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-8 border-t border-border/60 bg-background/60 py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between sm:px-6">
        <p className="text-center sm:text-left">
          © {year} Achegue-se. Todos os direitos reservados.
        </p>
        <nav
          aria-label="Links legais"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
        >
          <Link
            to={TERMS_OF_SERVICE_PATH}
            className="rounded-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Termos de uso
          </Link>
          <Link
            to={PRIVACY_POLICY_PATH}
            className="rounded-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Política de privacidade
          </Link>
          <Link
            to={SUPPORT_PATH}
            className="rounded-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Suporte
          </Link>
        </nav>
      </div>
    </footer>
  );
}
