import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { trackError } from "@/shared/utils/errorTracking";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    trackError(
      new Error("404 Error: User attempted to access non-existent route"),
      {
        component: "NotFound",
        action: "pageAccess",
        metadata: { pathname: location.pathname },
      },
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-territory-canvas px-4 text-territory-ink">
      <main className="w-full max-w-md rounded-3xl border border-territory-border bg-territory-surface p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-territory-brand">
          Erro 404
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-territory-ink">
          Página não encontrada
        </h1>
        <p className="mt-3 text-base leading-6 text-territory-muted">
          O endereço que você tentou abrir não existe ou foi movido.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-territory-sun px-5 text-sm font-semibold text-territory-ink transition-colors hover:bg-territory-sun/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand/40"
        >
          Voltar para o início
        </Link>
      </main>
    </div>
  );
};

export default NotFound;
