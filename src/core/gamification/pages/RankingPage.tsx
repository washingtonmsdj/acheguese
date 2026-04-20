import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Users, Car, Building2, Star } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { NeighborRankingPanel } from '@/core/mobility/components/NeighborRankingPanel';

export default function RankingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mobilidade");

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-xl border-border">
        <div className="max-w-5xl mx-auto h-14 md:h-16 px-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Trophy className="h-5 w-5 text-warning" />
          <h1 className="text-base font-bold text-foreground">Rankings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-5 md:py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Rankings da Comunidade
          </h2>
          <p className="text-sm text-muted-foreground">
            Veja os melhores usuários, motoristas e empresas do bairro
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-card border border-border rounded-xl h-11 p-1 mb-5">
            <TabsTrigger
              value="mobilidade"
              className="flex-1 rounded-lg data-[state=active]:bg-warning/15 data-[state=active]:text-warning text-muted-foreground text-xs font-semibold h-9"
            >
              <Car className="h-3.5 w-3.5 mr-1.5" />
              Mobilidade
            </TabsTrigger>
            <TabsTrigger
              value="usuarios"
              className="flex-1 rounded-lg data-[state=active]:bg-primary/15 data-[state=active]:text-primary text-muted-foreground text-xs font-semibold h-9"
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Usuários
            </TabsTrigger>
            <TabsTrigger
              value="empresas"
              className="flex-1 rounded-lg data-[state=active]:bg-success/15 data-[state=active]:text-success text-muted-foreground text-xs font-semibold h-9"
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              Empresas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mobilidade" className="mt-0">
            <NeighborRankingPanel />
          </TabsContent>

          <TabsContent value="usuarios" className="mt-0">
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">
                Ranking de Usuários
              </h3>
              <p className="text-sm text-muted-foreground">
                Em breve: Ranking dos usuários mais ativos e bem avaliados da
                comunidade
              </p>
            </div>
          </TabsContent>

          <TabsContent value="empresas" className="mt-0">
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">
                Ranking de Empresas
              </h3>
              <p className="text-sm text-muted-foreground">
                Em breve: Ranking das empresas mais bem avaliadas do bairro
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
