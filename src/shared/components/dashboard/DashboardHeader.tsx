import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { BusinessData } from "@/shared/types/dashboard";

interface DashboardHeaderProps {
  business: BusinessData;
  onBack: () => void;
  onViewPublic: () => void;
}

export function DashboardHeader({
  business,
  onBack,
  onViewPublic,
}: DashboardHeaderProps) {
  return (
    <Card className="mb-6 border-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {business.logo ? (
              <img
                src={business.logo}
                alt={business.name}
                className="h-16 w-16 rounded-xl object-cover border-2"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl border-2">
                {business.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold font-display">
                {business.name}
              </h1>
              <p className="text-sm text-muted-foreground capitalize">
                {business.category}
              </p>
            </div>
          </div>

          <Button variant="outline" onClick={onViewPublic} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Ver Página Pública
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
