import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { SUPPORT_PATH } from "@/shared/constants/legal";

import "./auth-concept-layout.css";

interface AuthBrandHeaderProps {
  secondaryHref?: string;
  secondaryLabel?: string;
  showBack?: boolean;
}

export function AuthBrandHeader({
  secondaryHref,
  secondaryLabel,
  showBack = true,
}: AuthBrandHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const showRecoveryBackLabel = location.pathname === AUTH_PATHS.passwordReset;
  const hasSecondaryAction = Boolean(secondaryHref && secondaryLabel);

  const handleBack = () => {
    // Em uma entrada direta não existe histórico interno confiável para voltar.
    // Nesse caso usamos a ação secundária da própria tela (quando houver) ou a
    // página inicial, evitando mandar a pessoa para fora do Achegue-se.
    if (location.key === "default") {
      navigate(secondaryHref ?? "/");
      return;
    }

    navigate(-1);
  };

  return (
    <header
      className="bg-background text-foreground"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-30 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <div className="relative mx-auto flex h-[68px] w-full max-w-[430px] items-center justify-center px-5 lg:h-[72px] lg:max-w-none lg:justify-start lg:px-10 xl:px-12">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className={`absolute left-4 flex h-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 lg:hidden ${showRecoveryBackLabel ? "gap-1.5 px-1.5" : "w-10"}`}
            aria-label="Voltar"
          >
            <AuthConceptIcon name="back" />
            {showRecoveryBackLabel ? (
              <span className="pr-1 text-[13px] font-medium leading-none">Voltar</span>
            ) : null}
          </button>
        ) : null}

        <Link
          to="/"
          aria-label="Achegue-se — início"
          className="inline-flex items-baseline gap-[2px] rounded-md px-2 py-1 font-heading text-[1.36rem] font-extrabold tracking-[-0.045em] text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 lg:px-0 lg:text-[1.7rem]"
        >
          achegue-se
          <span aria-hidden="true" className="relative -top-[1px] h-[6px] w-[6px] rounded-full bg-accent lg:h-[7px] lg:w-[7px]" />
        </Link>

        <nav aria-label="Ações públicas" className="ml-auto hidden items-center gap-7 text-[12px] font-medium text-foreground lg:flex">
          <Link to="/" className="rounded px-1 py-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
            Explorar sem conta
          </Link>
          <Link to={SUPPORT_PATH} className="rounded px-1 py-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35">
            Ajuda
          </Link>
          {hasSecondaryAction ? (
            <Link
              to={secondaryHref!}
              className="rounded-lg border border-border bg-card px-3 py-2 font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
