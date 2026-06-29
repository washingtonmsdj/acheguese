import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Key,
  Loader2,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  getAuthPasswordRequirementStatus,
  getAuthPasswordStrength,
} from "@/core/auth/utils/passwordPolicy";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  UpdatePasswordSchema,
  type UpdatePasswordInput,
} from "@/shared/validation/schemas/user.schema";

interface ChangePasswordFormProps {
  onSave: (data: UpdatePasswordInput) => Promise<void>;
  onCancel: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function ChangePasswordForm({
  onSave,
  onCancel,
}: ChangePasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(UpdatePasswordSchema),
    mode: "onBlur",
  });

  const newPasswordValue = watch("newPassword") ?? "";
  const confirmPasswordValue = watch("confirmNewPassword") ?? "";
  const passwordStrength = getAuthPasswordStrength(newPasswordValue);
  const passwordRequirements = useMemo(
    () => getAuthPasswordRequirementStatus(newPasswordValue),
    [newPasswordValue],
  );
  const passwordsMatch =
    newPasswordValue === confirmPasswordValue && confirmPasswordValue.length > 0;

  const onValid = async (data: UpdatePasswordInput) => {
    try {
      await onSave(data);
      reset();
    } catch {
      // Erro ja tratado na pagina de seguranca.
    }
  };

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
          <Key className="h-5 w-5 text-primary" />
          Alterar senha
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina uma nova senha forte para sua conta.
        </p>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="overflow-hidden rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center gap-2.5 border-b border-border p-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Nova senha</h3>
        </div>

        <form
          onSubmit={handleSubmit(onValid)}
          className="space-y-5 p-5"
          noValidate
        >
          <div className="space-y-2">
            <Label
              htmlFor="current-password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Senha atual
            </Label>
            <Input
              id="current-password"
              type="password"
              placeholder="Digite sua senha atual"
              className="h-11"
              autoComplete="current-password"
              disabled={isSubmitting}
              aria-describedby={
                errors.currentPassword ? "current-password-error" : undefined
              }
              {...register("currentPassword")}
            />
            <InlineFieldError
              id="current-password-error"
              message={errors.currentPassword?.message}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="new-password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Nova senha
            </Label>

            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimo 8 caracteres"
                className="h-11 pr-10"
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-describedby={
                  errors.newPassword ? "new-password-error" : undefined
                }
                {...register("newPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <InlineFieldError
              id="new-password-error"
              message={errors.newPassword?.message}
            />

            {newPasswordValue.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.level
                          ? passwordStrength.level <= 1
                            ? "bg-destructive"
                            : passwordStrength.level <= 2
                              ? "bg-warning"
                              : "bg-success"
                          : "bg-secondary"
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-[10px] font-medium ${
                    passwordStrength.level <= 1
                      ? "text-destructive"
                      : passwordStrength.level <= 2
                        ? "text-warning"
                        : "text-success"
                  }`}
                >
                  {passwordStrength.label}
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="confirm-password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Confirmar nova senha
            </Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Repita a nova senha"
              className="h-11"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-describedby={
                errors.confirmNewPassword ? "confirm-password-error" : undefined
              }
              {...register("confirmNewPassword")}
            />
            <InlineFieldError
              id="confirm-password-error"
              message={errors.confirmNewPassword?.message}
            />
            {confirmPasswordValue.length > 0 ? (
              <p
                className={`text-[10px] font-medium ${
                  passwordsMatch ? "text-success" : "text-destructive"
                }`}
              >
                {passwordsMatch
                  ? "OK As senhas coincidem"
                  : "As senhas nao coincidem"}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-border/50 bg-secondary/40 p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Requisitos da senha
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {passwordRequirements.map((requirement) => (
                <li
                  key={requirement.id}
                  className={requirement.satisfied ? "text-success" : undefined}
                >
                  {requirement.satisfied ? "OK" : "-"} {requirement.label}
                </li>
              ))}
            </ul>
          </div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end"
          >
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full gap-2 sm:w-auto"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-2 sm:min-w-32 sm:w-auto"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Alterar senha
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
