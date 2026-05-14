/**
 * HomePage — Home institucional do Achegue-se
 */

import { useNavigate } from 'react-router-dom';
import { MapPin, Users, ArrowRight, Store, Wrench, Tag, Bus, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { LAUNCH_URLS, TERRITORY_CONFIG } from '@/config/territory';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useOtherTerritories } from '@/core/territorial/useOtherTerritories';
import {
  TERRITORY_STATUS_LABEL,
  TERRITORY_STATUS_STYLE,
} from '@/core/territorial/territoryStatus';
import type { TerritoryCard } from '@/core/territorial/territoryStatus';

// ── Configuração dos módulos ──────────────────────────────────────────
const MODULES = [
  { icon: Users,  label: 'Comunidade',    path: LAUNCH_URLS.community },
  { icon: Store,  label: 'Empresas',      path: LAUNCH_URLS.business },
  { icon: Wrench, label: 'Serviços',      path: LAUNCH_URLS.services },
  { icon: Tag,    label: 'Classificados', path: LAUNCH_URLS.classifieds },
  { icon: Bus,    label: 'Mobilidade',    path: '/mobilidade' },
];

// ── Componente: Grid de módulos ───────────────────────────────────────
function ModuleGrid({ className = '' }: { className?: string }) {
  const navigate = useNavigate();
  
  return (
    <div className={className}>
      <p className="text-white/40 text-xs uppercase tracking-widest mb-3 text-center">
        O que você encontra aqui
      </p>
      <div className="grid grid-cols-5 gap-2 max-w-xs sm:max-w-xl mx-auto">
        {MODULES.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-teal-400/50 backdrop-blur-sm transition-all group"
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white/60 group-hover:text-teal-400 transition-colors" />
            <span className="text-[8px] sm:text-xs text-white/50 group-hover:text-white transition-colors leading-tight text-center">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Componente: Card de território ────────────────────────────────────
function TerritoryCardItem({ t, onNavigate }: { t: TerritoryCard; onNavigate: (url: string) => void }) {
  const isClickable = t.status === 'available' || (t.status === 'expanding' && !!t.url);
  const badge = TERRITORY_STATUS_LABEL[t.status];
  const badgeStyle = TERRITORY_STATUS_STYLE[t.status];

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={() => isClickable && t.url && onNavigate(t.url)}
      onKeyDown={(e) => e.key === 'Enter' && isClickable && t.url && onNavigate(t.url)}
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
        isClickable
          ? 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-teal-500/30 cursor-pointer'
          : 'bg-white/3 border-white/8 opacity-60 cursor-default'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
          <MapPin className="h-3.5 w-3.5 text-white/40" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80 truncate">{t.name}</p>
          <p className="text-[10px] text-white/40 truncate mt-0.5">{t.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badgeStyle}`}>
          {badge}
        </span>
        {isClickable && <ChevronRight className="h-3.5 w-3.5 text-white/30" />}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const otherTerritories = useOtherTerritories();

  return (
    <div className="min-h-screen w-full bg-[#0f1419] text-white flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="w-full">
        <div className="relative w-full overflow-hidden">

          {/* Imagem base */}
          <img
            src="/images/banner-ladingpage.png"
            alt=""
            aria-hidden="true"
            className="w-full h-auto block"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/80" />

          {/* Header */}
          <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 pt-0.5 sm:pt-2">
            <span className="text-base sm:text-xl font-bold tracking-tight text-white">
              Achegue<span className="text-teal-400">-se</span>
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white text-xs sm:text-sm h-6 sm:h-8 px-2 sm:px-3"
                onClick={() => navigate('/sobre')}
              >
                Sobre
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white text-xs sm:text-sm h-6 sm:h-8 px-2 sm:px-3"
                onClick={() => navigate('/contato')}
              >
                Contato
              </Button>
              <Button
                size="sm"
                className="bg-teal-500 hover:bg-teal-400 text-black font-semibold text-xs sm:text-sm !h-auto !py-1.5 px-1 sm:px-1.5 rounded-sm !leading-tight !min-h-0"
                onClick={() => navigate(user ? '/conta' : '/login')}
              >
                {user ? 'Minha conta' : 'Entrar'}
              </Button>
            </div>
          </header>

          {/* Conteúdo central */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 pt-4 sm:pt-0">
            <div className="hidden sm:flex items-center gap-2 bg-teal-400/20 border border-teal-400/40 rounded-full px-3 py-1.5 text-xs text-teal-300 mb-3 sm:mb-4 max-w-[90%]">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Lançamento — Complexo do Nordeste de Amaralina</span>
            </div>

            <h1 className="text-xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-3 sm:mb-3 drop-shadow-lg">
              A sua vizinhança mais <br className="sm:hidden" />
              <span className="text-teal-400">conectada</span>
            </h1>

            <p className="text-xs sm:text-lg text-white/75 sm:mb-6 drop-shadow mb-3">
              Descubra o que está rolando <br className="sm:hidden" />
              no seu bairro.
            </p>

            {/* CTA — desktop */}
            <Button
              className="hidden sm:flex bg-teal-500 hover:bg-teal-400 text-black font-semibold px-6 h-10 text-base gap-2 shadow-xl"
              onClick={() => navigate(`/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`)}
            >
              Entrar no Complexo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* CTA — mobile: canto inferior da imagem */}
          <div className="sm:hidden absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10">
            <Button
              className="bg-teal-500 hover:bg-teal-400 text-black font-semibold h-6 text-xs gap-1.5 shadow-xl px-3 rounded-lg"
              onClick={() => navigate(`/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`)}
            >
              Entrar no Complexo
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Módulos — desktop only */}
          <div className="hidden sm:block absolute bottom-0 left-0 right-0 z-10 px-6 pb-6">
            <ModuleGrid />
          </div>
        </div>

        {/* Módulos — mobile only */}
        <div className="sm:hidden px-4 pt-4 pb-3 bg-[#0f1419]">
          <ModuleGrid />
        </div>
      </section>

      {/* ── OUTROS LOCAIS ─────────────────────────────────────────────── */}
      {otherTerritories.length > 0 && (
        <section className="w-full px-4 sm:px-6 py-3 max-w-2xl mx-auto">
          <h2 className="hidden sm:block text-sm font-semibold text-white/70 mb-5">
            Outros locais no Achegue-se
          </h2>
          <div className="flex flex-col gap-2">
            {otherTerritories.map((t) => (
              <TerritoryCardItem key={t.id} t={t} onNavigate={navigate} />
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="w-full px-4 sm:px-6 py-4 text-center text-white/30 text-xs border-t border-white/10">
        Achegue-se Complexo · Salvador, BA (contexto)
      </footer>
    </div>
  );
}
