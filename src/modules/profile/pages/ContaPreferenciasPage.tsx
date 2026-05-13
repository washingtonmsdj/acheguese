import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Bell, Link2, Shield, SlidersHorizontal } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export default function ContaPreferenciasPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Preferencias da conta</title>
      </Helmet>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/conta")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Preferencias da conta</h1>
            <p className="text-xs text-muted-foreground">
              Ajustes pessoais de notificacoes, privacidade e permissoes da identidade.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                Notificacoes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/conta/notificacoes")}>
                Abrir preferencias de notificacao
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                Privacidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/conta/privacidade")}>
                Abrir privacidade e LGPD
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4" />
                Vinculos e membros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/conta/preferencias?tab=links")}>
                Gerenciar vinculos
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4" />
                Identidade ativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/conta/preferencias?tab=privacy")}>
                Ajustar identidade ativa
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

