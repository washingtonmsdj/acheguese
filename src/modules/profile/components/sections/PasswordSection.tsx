import React from "react";
import { Eye, EyeOff, Key, Loader2 } from "lucide-react";
import {
  getAuthPasswordRequirementStatus,
} from "@/core/auth/utils/passwordPolicy";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

interface PasswordSectionProps {
  newPw: string;
  confirmPw: string;
  showNew: boolean;
  loading: boolean;
  onNewPwChange: (value: string) => void;
  onConfirmPwChange: (value: string) => void;
  onToggleShow: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PasswordSection({
  newPw,
  confirmPw,
  showNew,
  loading,
  onNewPwChange,
  onConfirmPwChange,
  onToggleShow,
  onSave,
  onCancel,
}: PasswordSectionProps) {
  const passwordRequirements = getAuthPasswordRequirementStatus(newPw);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Alterar Senha
        </CardTitle>
        <CardDescription>
          Defina uma senha forte com no minimo 8 caracteres.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nova senha</label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(event) => onNewPwChange(event.target.value)}
                placeholder="Minimo 8 caracteres"
              />
              <button
                type="button"
                onClick={onToggleShow}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
            <ul className="text-xs text-muted-foreground space-y-1">
              {passwordRequirements.map((requirement) => (
                <li
                  key={requirement.id}
                  className={requirement.satisfied ? "text-success" : undefined}
                >
                  {requirement.satisfied ? "OK" : "•"} {requirement.label}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Confirmar nova senha
            </label>
            <Input
              type="password"
              value={confirmPw}
              onChange={(event) => onConfirmPwChange(event.target.value)}
              placeholder="Repita a nova senha"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={onSave} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Alterar Senha
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
