import { Link, useLocation } from "react-router-dom";

import {
  PRIVACY_POLICY_PATH,
  SUPPORT_PATH,
  TERMS_OF_SERVICE_PATH,
} from "@/shared/constants/legal";

export function AuthFooter() {
  const { pathname } = useLocation();

  // No concept, os links legais ficam visíveis no rodapé apenas da tela
  // mobile de entrada. As demais telas têm suas próprias ações contextuais.
  if (pathname !== "/login") return null;

  return (
    <footer
      className="bg-[#fffdfa] pt-2 text-[#25484b] lg:hidden"
      style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        aria-label="Links legais"
        className="mx-auto flex w-full max-w-[430px] items-center justify-center gap-3 px-6 text-[11px]"
      >
        <Link to={TERMS_OF_SERVICE_PATH} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
          Termos
        </Link>
        <span aria-hidden="true">·</span>
        <Link to={PRIVACY_POLICY_PATH} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
          Privacidade
        </Link>
        <span aria-hidden="true">·</span>
        <Link to={SUPPORT_PATH} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
          Ajuda
        </Link>
      </nav>
    </footer>
  );
}
