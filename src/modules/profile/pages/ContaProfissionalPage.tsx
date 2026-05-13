import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Briefcase } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export default function ContaProfissionalPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Central profissional</title>
      </Helmet>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/conta")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Central profissional</h1>
            <p className="text-xs text-muted-foreground">
              Hub operacional para empresas, profissionais e mobilidade.
            </p>
          </div>
        </div>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              Abrir Central
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/central")}>Ir para /central</Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
