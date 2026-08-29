/**
 * EmpresaDetailLayout
 * 
 * Layout wrapper para EmpresaDetailLandingPage.
 * Fornece estrutura de espaçamento e footer consistente.
 * 
 * SSOT: Layout reutilizável
 * Sem gambiarras: Componente focado apenas em layout
 */

import type { ReactNode } from 'react';
import { ArrowLeft, Bell, Building2, Compass, Heart, Home, MapPin, Search, UserCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LAUNCH_URLS } from '@/core/routing/config/territory';

interface EmpresaDetailLayoutProps {
  readonly children: ReactNode;
}

export function EmpresaDetailLayout({ children }: EmpresaDetailLayoutProps) {
  const navigate = useNavigate();
  const shellGutterClass = 'w-full px-4 sm:px-6 xl:px-[clamp(32px,2.4vw,52px)] 2xl:px-[clamp(40px,2.8vw,72px)]';

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#071017] text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#071017]/94 backdrop-blur">
        <div className={`${shellGutterClass} flex min-h-[3.25rem] items-center justify-between gap-3 py-2 sm:min-h-16 sm:py-0`}>
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.05] sm:h-10 sm:w-10"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
            </button>
            <Link to={LAUNCH_URLS.business} className="flex min-w-0 items-center gap-2 text-white">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-2xl bg-teal-500/14 text-teal-300 sm:h-10 sm:w-10">
                <MapPin className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[1.08rem] font-semibold leading-none sm:text-[1.25rem]">Achegue-se</span>
                <span className="block pt-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-teal-200/72 sm:text-[0.62rem]">
                  Seu bairro, mais perto.
                </span>
              </span>
            </Link>
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-3 lg:flex">
            <Link
              to={LAUNCH_URLS.business}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
            >
              <MapPin className="h-4 w-4 text-teal-300" />
              Empresas locais
            </Link>
            <Link
              to="/buscar"
              className="inline-flex min-h-11 min-w-0 max-w-[34rem] flex-1 items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 text-sm text-white/48 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white/72"
            >
              <Search className="h-4 w-4 shrink-0 text-white/46" />
              <span className="truncate">Buscar empresas, servicos, eventos...</span>
              <span className="ml-auto hidden rounded-lg border border-white/10 bg-black/18 px-2 py-1 text-[11px] font-semibold text-white/42 xl:inline-flex">
                Ctrl K
              </span>
            </Link>
          </div>

          <Link
            to={LAUNCH_URLS.business}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/74 transition-colors hover:border-white/20 hover:bg-white/[0.05] sm:hidden"
            aria-label="Ir para empresas"
          >
            <Building2 className="h-4 w-4" />
          </Link>

          <div className="hidden items-center gap-2.5 lg:flex">
            <Link
              to="/explorar"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              aria-label="Explorar"
            >
              <Compass className="h-[18px] w-[18px]" />
            </Link>
            <Link
              to="/favoritos"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              aria-label="Favoritos"
            >
              <Heart className="h-[18px] w-[18px]" />
            </Link>
            <Link
              to="/notificacoes"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              aria-label="Notificacoes"
            >
              <Bell className="h-[18px] w-[18px]" />
            </Link>
            <button
              type="button"
              onClick={() => navigate('/perfil')}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
              aria-label="Perfil"
            >
              <UserCircle2 className="h-6 w-6 text-teal-200" />
              <span className="hidden text-sm font-semibold xl:inline">Perfil</span>
            </button>
          </div>

          <Link
            to={LAUNCH_URLS.business}
            className="hidden min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.05] sm:inline-flex lg:hidden"
          >
            Ver empresas
          </Link>
        </div>
      </header>

      {children}

      <footer className="mt-auto hidden border-t border-white/8 bg-[#071017]">
        <div className={`${shellGutterClass} py-6`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-white/78">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/14">
                <Home className="h-4 w-4 text-teal-300" />
              </div>
              <span className="text-sm font-semibold">Empresas locais</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/48">
              <button
                onClick={() => navigate(LAUNCH_URLS.business)}
                className="transition-colors hover:text-teal-200"
              >
                Todas as empresas
              </button>
              <button
                onClick={() => navigate('/termos')}
                className="transition-colors hover:text-teal-200"
              >
                Termos
              </button>
              <button
                onClick={() => navigate('/privacidade')}
                className="transition-colors hover:text-teal-200"
              >
                Privacidade
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
