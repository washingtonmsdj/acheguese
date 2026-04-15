import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Users } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import { useRecomendacoes } from "@/modules/community/hooks/useRecomendacoes";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { useProfile } from "@/core/profiles/hooks/useProfile";
import { CategoryFilters } from "@/shared/components/recomendacoes/CategoryFilters";
import { QuestionsList } from "@/shared/components/recomendacoes/QuestionsList";

export default function RecomendacoesPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");

  // ✅ Verificação de autenticação
  const { profile } = useProfile();
  const { hasHome, loading: territoryLoading } = useUserTerritory();

  const { questions, loading, initialLoading, sentinelRef } = useRecomendacoes({
    filter,
    search,
  });

  // Bloquear se não estiver logado
  if (!profile) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-teal-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Faça login para acessar recomendações
            </h2>
            <p className="text-gray-400 mb-6">
              As recomendações são exclusivas para moradores cadastrados do bairro.
            </p>
            <Button onClick={() => window.location.href = appUrls.auth.login} className="bg-teal-500 hover:bg-teal-400">
              Fazer Login
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  // Aguardar resolução do território
  if (territoryLoading) {
    return (
      <div className="min-h-screen bg-[#12181B] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Bloquear se não tiver bairro cadastrado
  if (!hasHome) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-[#12181B] flex items-center justify-center" role="main">
          <div className="text-center p-8 max-w-md">
            <Users className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-4">
              Complete seu cadastro
            </h2>
            <p className="text-gray-400 mb-6">
              Para acessar as recomendações, você precisa cadastrar seu bairro no perfil.
            </p>
            <Button onClick={() => window.location.href = appUrls.profile.central} className="bg-teal-500 hover:bg-teal-400">
              Completar Perfil
            </Button>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold font-display">
              Perguntar ao Bairro
            </h1>
            <p className="text-sm text-muted-foreground">
              Peça recomendações da comunidade
            </p>
          </div>
          <Button size="sm" onClick={() => navigate(appUrls.community.newRecommendation)}> {/* ✅ SSOT */}
            <Plus className="h-4 w-4 mr-1" /> Perguntar
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar perguntas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Category Filters */}
      <CategoryFilters filter={filter} onFilterChange={setFilter} />

      {/* Questions List */}
      <QuestionsList
        questions={questions}
        loading={loading}
        initialLoading={initialLoading}
        sentinelRef={sentinelRef}
      />
    </div>
  );
}
