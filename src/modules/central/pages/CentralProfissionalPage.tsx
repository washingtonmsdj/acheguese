import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { GraduationCap, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * CentralProfissionalPage
 * 
 * Página placeholder funcional para área profissional (/central/profissional).
 * 
 * Nesta fase, não vamos criar o fluxo profissional completo.
 * Esta página mostra um placeholder funcional com CTA para o fluxo atual.
 */
export default function CentralProfissionalPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Área Profissional</h1>
        <p className="text-muted-foreground">
          Gerencie seus serviços, orçamentos, agenda e avaliações.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Área Profissional
          </CardTitle>
          <CardDescription>
            O fluxo completo de gestão profissional está em desenvolvimento.
            Enquanto isso, você pode cadastrar seus serviços usando o fluxo atual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/services/cadastrar")}
            >
              <Sparkles className="h-4 w-4" />
              Cadastrar Serviço
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/servicos")}
            >
              <GraduationCap className="h-4 w-4" />
              Ver Serviços
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
