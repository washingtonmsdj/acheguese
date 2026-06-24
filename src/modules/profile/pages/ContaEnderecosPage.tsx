import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ResidenceManager } from "@/core/residence/components/ResidenceManager";

export default function ContaEnderecosPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  return (
    <>
      <Helmet>
        <title>Meus endereços</title>
      </Helmet>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(appUrls.profile.home)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Meus endereços</h1>
            <p className="text-xs text-muted-foreground">
              Endereço operacional privado (entregas/corridas) e território pessoal.
            </p>
          </div>
        </div>

        <Card className="rounded-2xl border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Privacidade de endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              O perfil público exibe somente contexto territorial (bairro/comunidade), nunca rua,
              número, complemento ou referência detalhada.
            </p>
            <p>
              Se você atua profissionalmente, gerencie cobertura operacional na{" "}
              <button
                type="button"
                className="font-medium text-primary underline underline-offset-2"
                onClick={() => navigate("/central")}
              >
                Central profissional
              </button>
              .
            </p>
          </CardContent>
        </Card>

        <ResidenceManager />

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              Cobertura profissional
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Areas de atuacao de empresas e servicos ficam em{" "}
            <button
              type="button"
              className="font-medium text-primary underline underline-offset-2"
              onClick={() => navigate("/central")}
            >
              /central
            </button>
            .
          </CardContent>
        </Card>
      </div>
    </>
  );
}
