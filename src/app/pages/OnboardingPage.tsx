import React from "react";
import { useOnboarding } from "@/app/features/onboarding/hooks/useOnboarding";
import { OnboardingHeader } from "@/shared/components/onboarding/OnboardingHeader";
import { PopulationBanner } from "@/shared/components/onboarding/PopulationBanner";
import { NeighborhoodSelector } from "@/shared/components/onboarding/NeighborhoodSelector";
import { OnboardingFooter } from "@/shared/components/onboarding/OnboardingFooter";

export default function OnboardingPage() {
  const {
    neighborhoods,
    populationTotal,
    selectedNeighborhood,
    onNeighborhoodSelect,
    onConfirm,
    canConfirm,
  } = useOnboarding();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <OnboardingHeader />

      <PopulationBanner populationTotal={populationTotal} />

      <NeighborhoodSelector
        neighborhoods={neighborhoods}
        selectedNeighborhood={selectedNeighborhood}
        onNeighborhoodSelect={onNeighborhoodSelect}
      />

      <OnboardingFooter onConfirm={onConfirm} canConfirm={canConfirm} />
    </div>
  );
}
