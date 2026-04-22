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
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmpresaDetailLayoutProps {
  readonly children: ReactNode;
}

export function EmpresaDetailLayout({ children }: EmpresaDetailLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {children}

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Home className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">
                Empresas <span className="text-primary">Locais</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button
                onClick={() => navigate('/empresas-landing')}
                className="hover:text-primary transition-colors"
              >
                Todas as empresas
              </button>
              <button
                onClick={() => navigate('/termos')}
                className="hover:text-primary transition-colors"
              >
                Termos
              </button>
              <button
                onClick={() => navigate('/privacidade')}
                className="hover:text-primary transition-colors"
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
