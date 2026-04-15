import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Trophy, Star, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs

export function GamificationWidget() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-600" />
          Gamificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium">Ranking</span>
          </div>
          <TrendingUp className="h-4 w-4 text-yellow-600" />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Conquistas</span>
          </div>
        </div>

        <Button
          onClick={() => navigate(appUrls.gamification)} // ✅ SSOT
          variant="outline"
          size="sm"
          className="w-full"
        >
          Ver Sistema Completo
        </Button>
      </CardContent>
    </Card>
  );
}
