import { useCallback, useState } from "react";
import { AuthService } from "@/core/auth/services/AuthService";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import { checkPasswordCompromise } from "@/core/auth/utils/compromisedPassword";
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
        title: "Senha invalida",
        description: passwordError,
        variant: "destructive",
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas nao coincidem",
        description: "As senhas digitadas nao sao iguais",
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
      const compromise = await checkPasswordCompromise(newPassword);
      if (compromise.blocked) {
        toast({
          title: "Senha comprometida",
          description: compromise.message,
          variant: "destructive",
        });
        return false;
      }

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
        description: getAuthErrorMessage(err, "Nao foi possivel alterar a senha"),
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
