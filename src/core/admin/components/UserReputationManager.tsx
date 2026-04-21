import React from "react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Award, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { profileService } from "@/core/profiles/services";
import { logger } from "@/shared/utils/logger";
interface UserReputationManagerProps {
  userId: string;
  currentReputation: number;
  userName: string;
  onUpdate?: () => void;
}

export function UserReputationManager({
  userId,
  currentReputation,
  userName,
  onUpdate,
}: UserReputationManagerProps) {
  const [reputation, setReputation] = useState(currentReputation.toString());
  const [quickAction, setQuickAction] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const getCurrentLevel = (rep: number) => {
    if (rep >= 100) return { name: "Ouro", emoji: "🥇", color: "#FFD700" };
    if (rep >= 50) return { name: "Prata", emoji: "🥈", color: "#C0C0C0" };
    return { name: "Bronze", emoji: "🥉", color: "#CD7F32" };
  };

  const currentLevel = getCurrentLevel(currentReputation);
  const newLevel = getCurrentLevel(parseInt(reputation) || 0);

  const handleQuickAction = (action: string) => {
    setQuickAction(action);
    switch (action) {
      case "bronze":
        setReputation("0");
        break;
      case "prata":
        setReputation("50");
        break;
      case "ouro":
        setReputation("100");
        break;
      case "add10":
        setReputation((parseInt(reputation) + 10).toString());
        break;
      case "add50":
        setReputation((parseInt(reputation) + 50).toString());
        break;
      case "remove10":
        setReputation(Math.max(0, parseInt(reputation) - 10).toString());
        break;
    }
  };

  const handleUpdate = async () => {
    const newRep = parseInt(reputation);

    if (isNaN(newRep) || newRep < 0) {
      toast.error("Reputação deve ser um número positivo");
      return;
    }

    setIsUpdating(true);

    try {
      // ✅ MIGRADO - Atualizar reputação usando ProfileService
      await profileService.updateProfile(userId, { reputation: newRep });

      toast.success(
        `Reputação de ${userName} atualizada para ${newRep} pontos`,
      );
      onUpdate?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      logger.error("Error updating reputation:", error);
      toast.error(`Error update: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg" style={{ backgroundColor: "#1E2529" }}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" style={{ color: "#4FD1C5" }} />
          <CardTitle className="text-base" style={{ color: "#FFFFFF" }}>
            Gerenciar Reputação
          </CardTitle>
        </div>
        <CardDescription className="text-xs" style={{ color: "#9CA3AF" }}>
          Ajuste manual da reputação de {userName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Nível Atual */}
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Nível Atual
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{currentLevel.emoji}</span>
                <span
                  className="font-bold"
                  style={{ color: currentLevel.color }}
                >
                  {currentLevel.name}
                </span>
                <span className="text-sm" style={{ color: "#9CA3AF" }}>
                  ({currentReputation} pts)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="space-y-2">
          <Label className="text-xs" style={{ color: "#FFFFFF" }}>
            Ações Rápidas
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("bronze")}
              className="text-xs"
              style={{ borderColor: "#CD7F32", color: "#CD7F32" }}
            >
              🥉 Bronze (0)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("prata")}
              className="text-xs"
              style={{ borderColor: "#C0C0C0", color: "#C0C0C0" }}
            >
              🥈 Prata (50)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("ouro")}
              className="text-xs"
              style={{ borderColor: "#FFD700", color: "#FFD700" }}
            >
              🥇 Ouro (100)
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("add10")}
              className="text-xs"
              style={{ borderColor: "#4FD1C5", color: "#4FD1C5" }}
            >
              +10 pts
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("add50")}
              className="text-xs"
              style={{ borderColor: "#4FD1C5", color: "#4FD1C5" }}
            >
              +50 pts
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction("remove10")}
              className="text-xs"
              style={{ borderColor: "#EF4444", color: "#EF4444" }}
            >
              -10 pts
            </Button>
          </div>
        </div>

        {/* Input Manual */}
        <div className="space-y-2">
          <Label
            htmlFor="reputation"
            className="text-xs"
            style={{ color: "#FFFFFF" }}
          >
            Valor Personalizado
          </Label>
          <Input
            id="reputation"
            type="number"
            min="0"
            value={reputation}
            onChange={(e) => setReputation(e.target.value)}
            className="text-sm"
            style={{
              backgroundColor: "#12181B",
              color: "#FFFFFF",
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          />
        </div>

        {/* Preview do Novo Nível */}
        {parseInt(reputation) !== currentReputation && (
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: "rgba(79, 209, 197, 0.1)",
              borderColor: "rgba(79, 209, 197, 0.3)",
            }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className="h-4 w-4 mt-0.5 flex-shrink-0"
                style={{ color: "#4FD1C5" }}
              />
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: "#4FD1C5" }}
                >
                  Novo Nível
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base">{newLevel.emoji}</span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: newLevel.color }}
                  >
                    {newLevel.name}
                  </span>
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>
                    ({reputation} pts)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão Salvar */}
        <Button
          onClick={handleUpdate}
          disabled={isUpdating || parseInt(reputation) === currentReputation}
          className="w-full"
          style={{
            background: "linear-gradient(135deg, #4FD1C5 0%, #06B6D4 100%)",
            color: "#FFFFFF",
          }}
        >
          <Save className="h-4 w-4 mr-2" />
          {isUpdating ? "Saving..." : "Salvar Alterações"}
        </Button>
      </CardContent>
    </Card>
  );
}
