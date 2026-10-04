import { useState, type ReactNode } from "react";
import { ArrowLeft, Building2, Car, Star, Trophy, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export default function RankingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("mobilidade");

  return (
    <main className="min-h-screen bg-territory-canvas text-territory-ink">
      <header className="sticky top-0 z-40 border-b border-territory-border bg-territory-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => navigate(-1)} className="rounded-full p-2 text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink" aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Trophy className="h-5 w-5 text-territory-warning" aria-hidden="true" />
          <h1 className="font-heading text-base font-bold">Rankings</h1>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold">Rankings da comunidade</h2>
          <p className="mt-1 text-sm text-territory-muted">Reconhecimento e participação por contexto territorial.</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-5 grid w-full grid-cols-3 bg-territory-raised text-territory-muted">
            <TabsTrigger value="mobilidade" className="data-[state=active]:bg-territory-surface data-[state=active]:text-territory-ink"><Car className="mr-1.5 h-4 w-4" />Mobilidade</TabsTrigger>
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-territory-surface data-[state=active]:text-territory-ink"><Users className="mr-1.5 h-4 w-4" />Pessoas</TabsTrigger>
            <TabsTrigger value="empresas" className="data-[state=active]:bg-territory-surface data-[state=active]:text-territory-ink"><Building2 className="mr-1.5 h-4 w-4" />Empresas</TabsTrigger>
          </TabsList>
          <TabsContent value="mobilidade"><FutureRankingState icon={<Car className="h-8 w-8" />} title="Ranking de mobilidade" /></TabsContent>
          <TabsContent value="usuarios"><FutureRankingState icon={<Star className="h-8 w-8" />} title="Ranking de pessoas" /></TabsContent>
          <TabsContent value="empresas"><FutureRankingState icon={<Building2 className="h-8 w-8" />} title="Ranking de empresas" /></TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function FutureRankingState({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-territory-border bg-territory-surface p-8 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-territory-brand/10 text-territory-brand">{icon}</span>
      <h3 className="mt-4 font-heading text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-territory-muted">Esta projeção permanece pausada até que o módulo tenha critérios e dados certificados.</p>
    </section>
  );
}
