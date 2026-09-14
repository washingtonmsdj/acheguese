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

  return (
    <header
      className="bg-[#fffdfa] text-[#0b3b3f]"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-30 focus:rounded-md focus:bg-[#0b3b3f] focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <div className="relative mx-auto flex h-[68px] w-full max-w-[430px] items-center justify-center px-5 lg:h-[72px] lg:max-w-none lg:justify-start lg:px-10 xl:px-12">
        {showBack ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`absolute left-4 flex h-10 items-center justify-center rounded-full text-[#0b3b3f] transition-colors hover:bg-[#0b3b3f]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3b3f]/35 lg:hidden ${showRecoveryBackLabel ? "gap-1.5 px-1.5" : "w-10"}`}
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
          className="inline-flex items-baseline gap-[2px] rounded-md px-2 py-1 font-heading text-[1.36rem] font-extrabold tracking-[-0.045em] text-[#0b3b3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3b3f]/35 lg:px-0 lg:text-[1.7rem]"
        >
          achegue-se
          <span aria-hidden="true" className="relative -top-[1px] h-[6px] w-[6px] rounded-full bg-[#f3bd18] lg:h-[7px] lg:w-[7px]" />
        </Link>

        <nav aria-label="Ações públicas" className="ml-auto hidden items-center gap-7 text-[12px] font-medium text-[#173d41] lg:flex">
          <Link to="/" className="rounded px-1 py-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
            Explorar sem conta
          </Link>
          <Link to={SUPPORT_PATH} className="rounded px-1 py-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
            Ajuda
          </Link>
          {hasSecondaryAction ? (
            <Link
              to={secondaryHref!}
              className="rounded-[9px] border border-[#31575a] bg-white px-3 py-2 font-bold text-[#173d41] transition-colors hover:bg-[#f7f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
