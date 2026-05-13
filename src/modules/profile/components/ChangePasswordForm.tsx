import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Key, Loader2, Save, ShieldCheck, X } from 'lucide-react';
import {
  getAuthPasswordRequirementStatus,
  getAuthPasswordStrength,
} from '@/core/auth/utils/passwordPolicy';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { InlineFieldError } from '@/shared/components/ui/InlineFieldError';
import {
  UpdatePasswordSchema,
  type UpdatePasswordInput,
} from '@/shared/validation/schemas/user.schema';

interface ChangePasswordFormProps {
  onSave: (data: UpdatePasswordInput) => Promise<void>;
  onCancel: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function ChangePasswordForm({ onSave, onCancel }: ChangePasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(UpdatePasswordSchema),
    mode: 'onBlur',
  });

  // Derivado do watch para PasswordStrengthIndicator em tempo real
  const newPasswordValue = watch('newPassword') ?? '';
  const confirmPasswordValue = watch('confirmNewPassword') ?? '';
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
      // Erro ja tratado pelo onSave (toast na pagina de seguranca da conta)
    }
  };

  return (
    <div className="space-y-6">
      <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
        <h2 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          Alterar Senha
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crie uma nova senha segura para sua conta
        </p>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Nova senha</h3>
        </div>

        <form onSubmit={handleSubmit(onValid)} className="p-5 space-y-5" noValidate>
          {/* Senha atual */}
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
              className="h-10"
              autoComplete="current-password"
              disabled={isSubmitting}
              aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
              {...register('currentPassword')}
            />
            <InlineFieldError
              id="current-password-error"
              message={errors.currentPassword?.message}
            />
          </div>

          {/* Nova senha */}
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
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimo 8 caracteres"
                className="h-10 pr-10"
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <InlineFieldError id="new-password-error" message={errors.newPassword?.message} />

            {/* PasswordStrengthIndicator */}
            {newPasswordValue.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.level
                          ? passwordStrength.level <= 1
                            ? 'bg-destructive'
                            : passwordStrength.level <= 2
                              ? 'bg-warning'
                              : 'bg-success'
                          : 'bg-secondary'
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-[10px] font-medium ${
                    passwordStrength.level <= 1
                      ? 'text-destructive'
                      : passwordStrength.level <= 2
                        ? 'text-warning'
                        : 'text-success'
                  }`}
                >
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirmar nova senha */}
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
              className="h-10"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-describedby={errors.confirmNewPassword ? 'confirm-password-error' : undefined}
              {...register('confirmNewPassword')}
            />
            <InlineFieldError
              id="confirm-password-error"
              message={errors.confirmNewPassword?.message}
            />
            {confirmPasswordValue.length > 0 && (
              <p
                className={`text-[10px] font-medium ${passwordsMatch ? 'text-success' : 'text-destructive'}`}
              >
                {passwordsMatch ? 'OK As senhas coincidem' : 'As senhas nao coincidem'}
              </p>
            )}
          </div>

          {/* Requisitos da senha */}
          <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              Requisitos da senha
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {passwordRequirements.map((requirement) => (
                <li
                  key={requirement.id}
                  className={requirement.satisfied ? 'text-success' : undefined}
                >
                  {requirement.satisfied ? 'OK' : '•'} {requirement.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Botões */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex justify-end gap-3 pt-2"
          >
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-32">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Alterar Senha
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
