/**
 * Página de Histórico de Corridas
 * Mostra todas as corridas passadas do usuário
 */

import { RideHistoryList } from "../components/RideHistoryList";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function HistoricoPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Histórico de Corridas</h1>
            <p className="text-muted-foreground">
              Veja todas as suas corridas passadas
            </p>
          </div>
        </div>

        {/* Lista de Histórico */}
        <RideHistoryList />
      </div>
    </div>
  );
}
