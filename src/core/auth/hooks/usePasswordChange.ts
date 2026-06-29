import { useState, useCallback } from "react";
import { AuthService } from "@/core/auth/services/AuthService";
import { HibpService } from "@/core/auth/services/HibpService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { validateAuthPassword } from "@/core/auth/utils/passwordPolicy";
import { useToast } from "@/shared/hooks/use-toast";
import { logger } from "@/shared/utils/logger";

export function usePasswordChange(onSuccess?: () => void) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePasswords = useCallback((): boolean => {
    const passwordError = validateAuthPassword(newPassword);
    if (passwordError) {
      toast({
        title: "Senha inválida",
        description: passwordError,
        variant: "destructive",
      });
      return false;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais",
        variant: "destructive",
      });
      return false;
    }
    return true;
  }, [newPassword, confirmPassword, toast]);

  const changePassword = useCallback(async (): Promise<boolean> => {
    if (!validatePasswords()) return false;

    setLoading(true);

    try {
      // 🔒 Verificar se a senha foi exposta em vazamentos (HIBP)
      try {
        const hibp = await HibpService.checkPassword(newPassword);
        if (hibp.isPwned) {
          toast({
            title: "Senha comprometida",
            description: `Esta senha apareceu ${hibp.count.toLocaleString("pt-BR")} vez(es) em vazamentos de dados conhecidos. Escolha uma senha diferente.`,
            variant: "destructive",
          });
          return false;
        }
      } catch (hibpErr) {
        // Falha na API HIBP não bloqueia o usuário — apenas loga o aviso
        logger.warn("HIBP check failed, skipping:", hibpErr);
      }

      // ✅ SSOT - Usar AuthService para atualizar senha
      await AuthService.updatePassword(newPassword);

      toast({ title: "Senha alterada com sucesso!" });
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
      return true;
    } catch (err: unknown) {
      logger.error("Error changing password:", err);
      toast({
        title: "Erro ao alterar senha",
        description: getAuthErrorMessage(err, "Não foi possível alterar a senha"),
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [newPassword, validatePasswords, toast, onSuccess]);

  const reset = useCallback(() => {
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  }, []);

  return {
    newPassword,
    confirmPassword,
    showPassword,
    loading,
    setNewPassword,
    setConfirmPassword,
    setShowPassword,
    changePassword,
    reset,
  };
}

