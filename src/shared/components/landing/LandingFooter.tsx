import { useNavigate } from "react-router-dom";
import { LAUNCH_URLS, TERRITORY_CONFIG } from "@/config/territory";

export function LandingFooter() {
  const navigate = useNavigate();
  const communityLabel = TERRITORY_CONFIG.launch.community.name;

  return (
    <footer className="w-full bg-card/50 backdrop-blur-sm border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <button
              onClick={() => navigate(LAUNCH_URLS.community)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Navegar por {communityLabel}
            </button>
            <button
              onClick={() => navigate("/sobre")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Sobre
            </button>
            <button
              onClick={() => navigate("/contato")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Contato
            </button>
            <button
              onClick={() => navigate("/termos")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Termos
            </button>
            <button
              onClick={() => navigate("/privacidade")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Privacidade
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Achegue-se. Todos os direitos reservados.
          </p>
          <span className="text-xs text-muted-foreground">
            Feito para as comunidades locais
          </span>
        </div>
      </div>
    </footer>
  );
}
