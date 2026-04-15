import React from "react";
import { MapPin } from "lucide-react";

export function OnboardingHeader() {
  return (
    <div className="px-4 pt-12 pb-6 text-center">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold font-display">Complexo do Nordeste</h1>
      <h2 className="text-base font-medium text-muted-foreground mt-1">
        de Amaralina
      </h2>
      <p className="text-xs text-muted-foreground mt-2">Salvador, Bahia</p>
    </div>
  );
}
