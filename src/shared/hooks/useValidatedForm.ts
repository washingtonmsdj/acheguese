/**
 * HOOK PROFISSIONAL PARA FORMULÁRIOS VALIDADOS
 *
 * Integra Zod + React Hook Form para validação consistente.
 * Fornece type safety completo e mensagens de erro padronizadas.
 */

import {
  useForm,
  UseFormProps,
  UseFormReturn,
  FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

interface UseValidatedFormOptions<
  TSchema extends z.ZodType<any, any>,
> extends Omit<UseFormProps<z.infer<TSchema>>, "resolver"> {
  schema: TSchema;
  onSubmit: (data: z.infer<TSchema>) => Promise<void> | void;
  onError?: (errors: any) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseValidatedFormReturn<
  TSchema extends z.ZodType<any, any>,
> extends UseFormReturn<z.infer<TSchema>> {
  handleSubmitWithToast: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Hook para formulários com validação Zod
 *
 * @example
 * ```tsx
 * const { register, handleSubmitWithToast, formState: { errors } } = useValidatedForm({
 *   schema: profileSchema,
 *   onSubmit: async (data) => {
 *     await updateProfile(data);
 *   },
 *   successMessage: 'Perfil atualizado com sucesso!',
 * });
 *
 * return (
 *   <form onSubmit={handleSubmitWithToast}>
 *     <input {...register('name')} />
 *     {errors.name && <span>{errors.name.message}</span>}
 *   </form>
 * );
 * ```
 */
export function useValidatedForm<TSchema extends z.ZodType<any, any>>({
  schema,
  onSubmit,
  onError,
  successMessage,
  errorMessage = "Erro ao enviar formulário",
  ...formOptions
}: UseValidatedFormOptions<TSchema>): UseValidatedFormReturn<TSchema> {
  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    ...formOptions,
  });

  const handleSubmitWithToast = form.handleSubmit(
    async (data) => {
      try {
        await onSubmit(data);
        if (successMessage) {
          toast.success(successMessage);
        }
      } catch (error) {
        logger.error("Form submission error:", error);
        toast.error(errorMessage);
        if (onError) {
          onError(error);
        }
      }
    },
    (errors) => {
      logger.error("Form validation errors:", errors);

      // Mostrar primeiro erro encontrado
      const firstError = Object.values(errors)[0];
      if (firstError?.message) {
        toast.error(firstError.message as string);
      } else {
        toast.error("Por favor, corrija os erros no formulário");
      }

      if (onError) {
        onError(errors);
      }
    },
  );

  return {
    ...form,
    handleSubmitWithToast,
    isSubmitting: form.formState.isSubmitting,
  };
}

/**
 * Hook para validação de campo único
 *
 * @example
 * ```tsx
 * const validateEmail = useFieldValidator(z.string().email());
 *
 * const handleBlur = (value: string) => {
 *   const result = validateEmail(value);
 *   if (!result.success) {
 *     setError(result.error);
 *   }
 * };
 * ```
 */
export function useFieldValidator<T>(schema: z.ZodType<T>) {
  return (value: unknown): { success: boolean; data?: T; error?: string } => {
    try {
      const data = schema.parse(value);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors[0]?.message || "Valor inválido",
        };
      }
      return { success: false, error: "Erro de validação" };
    }
  };
}

/**
 * Hook para validação assíncrona (ex: verificar se email já existe)
 *
 * @example
 * ```tsx
 * const { validate, isValidating, error } = useAsyncValidator(
 *   async (email: string) => {
 *     const exists = await checkEmailExists(email);
 *     if (exists) throw new Error('Email já cadastrado');
 *   }
 * );
 * ```
 */
export function useAsyncValidator<T>(validator: (value: T) => Promise<void>) {
  const [isValidating, setIsValidating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const validate = React.useCallback(
    async (value: T) => {
      setIsValidating(true);
      setError(null);

      try {
        await validator(value);
        return { success: true };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro de validação";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsValidating(false);
      }
    },
    [validator],
  );

  return { validate, isValidating, error };
}

// Import React para useCallback e useState
import React from "react";
import { logger } from "@/shared/utils/logger";
