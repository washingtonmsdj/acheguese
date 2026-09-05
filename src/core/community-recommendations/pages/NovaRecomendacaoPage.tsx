import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useNovaRecomendacao } from "@/core/community/hooks/useNovaRecomendacao";
import { CommunityPortalGate, useCommunityAccess } from "@/core/community-experience/access";
import type { TerritorialLayoutContext } from "@/core/routing/components/TerritorialLayout";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import { resolveCommunityRouteDefaultLocationId } from "@/core/community-experience/utils/communityRouteTerritory";
import { RecomendacaoHeader } from "@/shared/components/recomendacoes/RecomendacaoHeader";
import { RecomendacaoTip } from "@/shared/components/recomendacoes/RecomendacaoTip";
import { CategorySelector } from "@/shared/components/recomendacoes/CategorySelector";
import { RecomendacaoForm } from "@/shared/components/recomendacoes/RecomendacaoForm";

export default function NovaRecomendacaoPage() {
  const territorialContext = useOutletContext<TerritorialLayoutContext | null>() ?? null;
  const { homeDistrict, homeCity } = useUserTerritory();
  const resolved = useMemo(
    () =>
      territorialContext?.resolved ??
      (homeDistrict
        ? ({ kind: "location", location: homeDistrict } as const)
        : homeCity
          ? ({ kind: "location", location: homeCity } as const)
          : null),
    [homeCity, homeDistrict, territorialContext?.resolved],
  );
  const activeMemberIds = useMemo(
    () => territorialContext?.activeMemberIds ?? [],
    [territorialContext?.activeMemberIds],
  );
  const communityAccess = useCommunityAccess({
    resolved,
    activeMemberIds,
  });
  const locationId = useMemo(
    () =>
      resolveCommunityRouteDefaultLocationId(
        resolved,
        activeMemberIds,
      ),
    [activeMemberIds, resolved],
  );
  const {
    // Data
    formData,
    loading,

    // Computed
    isFormValid,

    // Actions
    updateField,
    submitRecomendacao,
    handleGoBack,
  } = useNovaRecomendacao({
    locationId,
    canCreate: communityAccess.can.create_post,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitRecomendacao();
  };

  const handleCategoryChange = (categoryId: string) => {
    updateField("category", categoryId);
  };

  if (communityAccess.isLoading) {
    return (
      <div className="min-h-screen bg-[#12181B] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!communityAccess.can.create_post) {
    return (
      <div className="min-h-screen bg-[#12181B] text-white">
        <CommunityPortalGate
          resolved={resolved}
          activeMemberIds={activeMemberIds}
          action="create_post"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-24">
      <RecomendacaoHeader onGoBack={handleGoBack} />

      <div className="px-4 py-4 space-y-5">
        <RecomendacaoTip />

        <CategorySelector
          selectedCategory={formData.category}
          onCategoryChange={handleCategoryChange}
        />

        <RecomendacaoForm
          formData={formData}
          loading={loading}
          isFormValid={isFormValid}
          onFieldChange={updateField}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

