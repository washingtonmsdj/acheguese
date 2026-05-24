import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { TERRITORY_CONFIG } from "@/config/territory";
import { buildMailtoUrl } from "@/shared/utils/contactLinks";

const contactEmail = import.meta.env.VITE_CONTACT_EMAIL ?? "";

export default function ContactPage() {
  const navigate = useNavigate();
  const launchPlace = `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`;

  return (
    <div className="min-h-screen w-full bg-[#0f1419] text-white">
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0f1419]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white/70 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <span className="text-lg font-bold tracking-tight text-white">
            Achegue<span className="text-teal-400">-se</span>
          </span>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-4xl px-4 py-12 focus:outline-none sm:px-6">
        <div className="space-y-8">
          <div className="text-center">
            <h1 className="mb-4 text-3xl font-bold sm:text-4xl">
              Entre em <span className="text-teal-400">contato</span>
            </h1>
            <p className="text-lg text-white/60">Canais para suporte, parcerias e expansão territorial</p>
          </div>

          <section className="grid gap-4 sm:grid-cols-2">
            {contactEmail ? (
              <a
                href={buildMailtoUrl(contactEmail) ?? undefined}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-teal-400/30 hover:bg-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500/20 transition-colors group-hover:bg-teal-500/30">
                    <Mail className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <h2 className="mb-1 text-lg font-semibold">E-mail</h2>
                    <p className="mb-2 text-sm text-white/60">Envie sua mensagem para</p>
                    <p className="break-all text-sm text-teal-400">{contactEmail}</p>
                  </div>
                </div>
              </a>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500/20">
                    <Mail className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <h2 className="mb-1 text-lg font-semibold">E-mail</h2>
                    <p className="text-sm text-white/60">E-mail público ainda não configurado.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500/20">
                  <MessageSquare className="h-6 w-6 text-teal-400" />
                </div>
                <div>
                  <h2 className="mb-1 text-lg font-semibold">Atendimento</h2>
                  <p className="mb-2 text-sm text-white/60">Central de suporte e solicitações</p>
                  <p className="text-sm text-white/40">Em implantação</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold">Como podemos ajudar?</h2>
            <div className="space-y-3 text-white/70">
              <p>• Dúvidas sobre funcionamento da plataforma</p>
              <p>• Sugestões de melhorias</p>
              <p>• Reportar problemas técnicos</p>
              <p>• Parcerias comerciais e institucionais</p>
              <p>• Expansão para novos territórios</p>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500/20">
                <Phone className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h2 className="mb-2 text-xl font-semibold">Território de referência</h2>
                <p className="text-white/70">{launchPlace}</p>
              </div>
            </div>
          </section>

          <div className="text-center text-sm text-white/50">Respondemos em até 48 horas úteis.</div>
        </div>
      </main>

      <footer className="mt-12 w-full border-t border-white/10 px-4 py-6 text-center text-xs text-white/30 sm:px-6">
        Achegue-se · {launchPlace}
      </footer>
    </div>
  );
}
