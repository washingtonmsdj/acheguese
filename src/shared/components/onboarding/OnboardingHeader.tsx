import React from "react";
import { MapPin } from "lucide-react";

interface OnboardingHeaderProps {
  cityName: string;
  stateName: string;
}

export function OnboardingHeader({ cityName, stateName }: OnboardingHeaderProps) {
  return (
    <div className="px-4 pb-6 pt-12 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <h1 className="font-display text-2xl font-bold">{cityName}</h1>
      <p className="mt-2 text-xs text-muted-foreground">{stateName}</p>
    </div>
  );
}
