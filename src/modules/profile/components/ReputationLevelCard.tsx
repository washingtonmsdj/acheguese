import React from "react";
import { Award, TrendingUp, Lock, Unlock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Progress } from "@/shared/components/ui/progress";
interface ReputationLevelCardProps {
  reputation: number;
  isVerified: boolean;
}

export function ReputationLevelCard({
  reputation,
  isVerified,
}: ReputationLevelCardProps) {
  // Determinar nível
  const getLevel = () => {
    if (reputation >= 100)
      return { name: "Ouro", color: "#FFD700", emoji: "🥇", next: null };
    if (reputation >= 50)
      return { name: "Prata", color: "#C0C0C0", emoji: "🥈", next: 100 };
    return { name: "Bronze", color: "#CD7F32", emoji: "🥉", next: 50 };
  };

  const level = getLevel();
  const progress = level.next ? (reputation / level.next) * 100 : 100;
  const pointsToNext = level.next ? level.next - reputation : 0;

  // Permissões por nível
  const canPostToCity = reputation >= 100 || isVerified;

  return (
    <Card className="border-0 shadow-lg" style={{ backgroundColor: "#1E2529" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" style={{ color: level.color }} />
            <CardTitle className="text-base" style={{ color: "#FFFFFF" }}>
              Nível de Reputação
            </CardTitle>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full"
            style={{ backgroundColor: `${level.color}20` }}
          >
            <span className="text-lg">{level.emoji}</span>
            <span className="font-bold text-sm" style={{ color: level.color }}>
              {level.name}
            </span>
          </div>
        </div>
        <CardDescription className="text-xs" style={{ color: "#9CA3AF" }}>
          {reputation} pontos de reputação
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de Progresso */}
        {level.next && (
          <div className="space-y-2">
            <div
              className="flex justify-between text-xs"
              style={{ color: "#9CA3AF" }}
            >
              <span>Progresso para {level.next === 50 ? "Prata" : "Ouro"}</span>
              <span>{pointsToNext} pontos restantes</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Permissões */}
        <div className="space-y-2">
          <p className="text-xs font-semibold" style={{ color: "#FFFFFF" }}>
            Permissões de Postagem:
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <Unlock className="h-3.5 w-3.5 text-green-400" />
              <span style={{ color: "#9CA3AF" }}>Postar na sua Rua</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Unlock className="h-3.5 w-3.5 text-green-400" />
              <span style={{ color: "#9CA3AF" }}>Postar no seu Bairro</span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {canPostToCity ? (
                <>
                  <Unlock className="h-3.5 w-3.5 text-green-400" />
                  <span style={{ color: "#9CA3AF" }}>
                    Postar para toda Cidade
                  </span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-red-400" />
                  <span style={{ color: "#9CA3AF" }}>
                    Postar para toda Cidade
                    <span className="text-red-400 ml-1">
                      (requer {100 - reputation} pontos)
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dicas para aumentar reputação */}
        {!canPostToCity && (
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: "rgba(79, 209, 197, 0.1)" }}
          >
            <div className="flex items-start gap-2">
              <TrendingUp
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                style={{ color: "#4FD1C5" }}
              />
              <div className="space-y-1">
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#4FD1C5" }}
                >
                  Como aumentar sua reputação:
                </p>
                <ul
                  className="text-xs space-y-0.5"
                  style={{ color: "#9CA3AF" }}
                >
                  <li>• Crie posts úteis e receba curtidas</li>
                  <li>• Comente construtivamente</li>
                  <li>• Participe ativamente da comunidade</li>
                  <li>• Solicite verificação de morador</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Badge de Verificado */}
        {isVerified && (
          <div
            className="p-2 rounded-lg border"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderColor: "rgba(34, 197, 94, 0.3)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#22C55E" }}
              >
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-green-400">
                  Morador Verificado
                </p>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  Acesso total independente da reputação
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
