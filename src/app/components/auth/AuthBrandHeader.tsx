import { Link, useNavigate } from "react-router-dom";

import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";

interface AuthBrandHeaderProps {
  secondaryHref?: string;
  secondaryLabel?: string;
  showBack?: boolean;
}

export function AuthBrandHeader({ showBack = true }: AuthBrandHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-[#fffdfa] text-[#0b3b3f]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-30 focus:rounded-md focus:bg-[#0b3b3f] focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-white"
      >
        Pular para o conteúdo
      </a>
      <div className="relative mx-auto flex h-[68px] w-full max-w-[430px] items-center justify-center px-5 sm:max-w-5xl">
        {showBack ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full text-[#0b3b3f] transition-colors hover:bg-[#0b3b3f]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3b3f]/35"
            aria-label="Voltar"
          >
            <AuthConceptIcon name="back" />
          </button>
        ) : null}

        <Link
          to="/"
          aria-label="Achegue-se — início"
          className="inline-flex items-baseline gap-[2px] rounded-md px-2 py-1 font-heading text-[1.36rem] font-extrabold tracking-[-0.045em] text-[#0b3b3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3b3f]/35"
        >
          achegue-se
          <span aria-hidden="true" className="relative -top-[1px] h-[6px] w-[6px] rounded-full bg-[#f3bd18]" />
        </Link>
      </div>
    </header>
  );
}
