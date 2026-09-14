import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Building2,
  ChevronRight,
  Home,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { ResidenceManager } from "@/core/residence/components/ResidenceManager";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
import { Button } from "@/shared/components/ui/button";

export default function ContaEnderecosPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Endereços e território | Achegue-se</title>
      </Helmet>

      <AccountSettingsShell
        title="Endereços e território"
        description="Gerencie sua residência privada e o contexto territorial mostrado no Achegue-se."
      >
        <section className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-territory-brand/10 text-territory-brand">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-territory-brand">Privacidade territorial</p>
              <h2 className="mt-1 font-heading text-lg font-bold tracking-[-0.025em] text-territory-ink sm:text-xl">
                Seu endereço detalhado permanece privado
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-5 text-territory-muted">
                Rua, número, complemento e referências não aparecem no perfil público. Para outras pessoas, mostramos apenas o contexto territorial permitido, como cidade, bairro ou comunidade.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-territory-border bg-territory-raised p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-territory-ink">
                <Home className="h-4 w-4 text-territory-brand" aria-hidden="true" />
                Residência privada
              </div>
              <p className="mt-1 text-xs leading-4 text-territory-muted">
                Usada para confirmar seu território principal e recursos que dependem dessa relação.
              </p>
            </div>
            <div className="rounded-xl border border-territory-border bg-territory-raised p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-territory-ink">
                <MapPin className="h-4 w-4 text-territory-brand" aria-hidden="true" />
                Contexto público
              </div>
              <p className="mt-1 text-xs leading-4 text-territory-muted">
                Exibe somente o nível territorial apropriado, sem revelar o endereço residencial.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3 border-b border-territory-border pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-territory-sun/30 text-territory-ink">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-base font-bold text-territory-ink">Minha residência</h2>
              <p className="mt-1 text-sm leading-5 text-territory-muted">
                Adicione, confirme ou atualize os dados usados para o seu território pessoal.
              </p>
            </div>
          </div>
          <ResidenceManager />
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Home className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
              <div>
                <h2 className="font-heading text-base font-bold text-territory-ink">Como a residência é usada</h2>
                <p className="mt-2 text-sm leading-5 text-territory-muted">
                  Sua residência ajuda a confirmar o território principal. Publicações, grupos e outros recursos locais podem depender dessa verificação.
                </p>
                <p className="mt-2 text-sm leading-5 text-territory-muted">
                  Ao mudar de endereço, atualize esta informação para que o contexto territorial continue correto.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-territory-border bg-territory-surface p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-base font-bold text-territory-ink">Cobertura profissional</h2>
                <p className="mt-2 text-sm leading-5 text-territory-muted">
                  Áreas de atuação de empresas e profissionais são configuradas separadamente. Elas não alteram sua residência pessoal.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 min-h-11 w-full justify-between border-territory-border text-territory-ink"
                  onClick={() => navigate("/central")}
                >
                  Abrir Central profissional
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </AccountSettingsShell>
    </>
  );
}
