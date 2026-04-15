 
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import {
  Trophy,
  Award,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  getNivel,
  getProgresso,
  badges,
} from "@/core/gamification/data/gamification";
import { cn } from "@/shared/utils/cn";
import type { Profile } from "@/modules/profile/types";

interface ProgressSectionProps {
  profile: Profile;
}

export function ProgressSection({ profile }: ProgressSectionProps) {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const nivel = getNivel(profile?.pontos || 0);
  const progresso = getProgresso(profile?.pontos || 0);
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).getFullYear()
    : new Date().getFullYear();

  return (
    <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Progresso & Conquistas
        </CardTitle>
        <CardDescription>
          Nível {nivel.nivel} - {nivel.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progresso para o próximo nível</span>
            <span className="text-muted-foreground">
              {profile?.pontos || 0} / {nivel.maxPontos} pts
            </span>
          </div>
          <Progress value={progresso} className="h-3" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border">
            <Award className="h-5 w-5 text-amber-500" />
            <div>
              <div className="text-xs text-muted-foreground">Nível</div>
              <div className="font-bold">{nivel.nivel}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border">
            <Target className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">Meta</div>
              <div className="font-bold">{nivel.maxPontos}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-xs text-muted-foreground">Progresso</div>
              <div className="font-bold">{progresso}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border">
            <Calendar className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-xs text-muted-foreground">Membro desde</div>
              <div className="font-bold">{memberSince}</div>
            </div>
          </div>
        </div>

        {profile?.badges && profile.badges.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Conquistas</h4>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map((bId: string) => {
                const b = badges.find((x) => x.id === bId);
                if (!b) return null;
                return (
                  <span
                    key={b.id}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border",
                      b.cor,
                    )}
                  >
                    {b.icone} {b.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(appUrls.ranking)} // ✅ SSOT
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Ranking Completo
        </Button>
      </CardContent>
    </Card>
  );
}
