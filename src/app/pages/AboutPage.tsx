import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MapPin, Target, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { TERRITORY_CONFIG } from "@/config/territory";

export default function AboutPage() {
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
              Sobre o <span className="text-teal-400">Achegue-se</span>
            </h1>
            <p className="text-lg text-white/60">Conectando territórios, serviços e comunidades</p>
          </div>

          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500/20">
                <Target className="h-6 w-6 text-teal-400" />
              </div>
              <div>
                <h2 className="mb-2 text-xl font-semibold">Nossa missão</h2>
                <p className="leading-relaxed text-white/70">
                  Criar uma plataforma territorial que aproxima moradores, empresas, profissionais,
                  classificados e serviços locais com dados organizados em uma fonte única.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">O que fazemos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <MapPin className="mb-3 h-8 w-8 text-teal-400" />
                <h3 className="mb-2 font-semibold">Navegação territorial</h3>
                <p className="text-sm text-white/60">Organizamos cidade, bairro e comunidade em rotas canônicas.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <Users className="mb-3 h-8 w-8 text-teal-400" />
                <h3 className="mb-2 font-semibold">Comércio e serviços</h3>
                <p className="text-sm text-white/60">Valorizamos empresas, profissionais e instituições locais.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <Heart className="mb-3 h-8 w-8 text-teal-400" />
                <h3 className="mb-2 font-semibold">Comunidade ativa</h3>
                <p className="text-sm text-white/60">Apoiamos feed, recomendações, mapa e descoberta local.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <Target className="mb-3 h-8 w-8 text-teal-400" />
                <h3 className="mb-2 font-semibold">Gestão escalável</h3>
                <p className="text-sm text-white/60">Cada módulo usa contratos e dados centrais para evitar duplicação.</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 text-xl font-semibold">Nossa história</h2>
            <p className="mb-4 leading-relaxed text-white/70">
              O Achegue-se nasceu da necessidade de criar conexões mais fortes entre vizinhos,
              serviços públicos, profissionais, classificados e comércio local.
            </p>
            <p className="leading-relaxed text-white/70">
              A plataforma foi desenhada para começar por uma cidade de referência e escalar para
              novos territórios sem duplicar dados por página.
            </p>
          </section>
        </div>
      </main>

      <footer className="mt-12 w-full border-t border-white/10 px-4 py-6 text-center text-xs text-white/30 sm:px-6">
        Achegue-se · {launchPlace}
      </footer>
    </div>
  );
}
