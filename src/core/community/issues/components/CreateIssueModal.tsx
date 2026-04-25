/**
 * CreateIssueModal - Modal de criacao de problema urbano
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { createIssueSchema, type CreateIssueFormData } from "../schemas/issueSchema";
import { useCreateIssue, ISSUE_RPC_ERROR_MESSAGES } from "../hooks/useCreateIssue";
import { ISSUE_CATEGORY_LABELS } from "../config/issueConfig";
import type { IssueCategory } from "../domain/types";

interface CreateIssueModalProps {
  open: boolean;
  onClose: () => void;
  city: string;
  neighborhood?: string;
  locationId?: string;
  onIssueCreated?: () => void;
}

export function CreateIssueModal({
  open,
  onClose,
  city,
  neighborhood,
  locationId,
  onIssueCreated,
}: CreateIssueModalProps) {
  const { mutate: createIssue, isPending } = useCreateIssue();

  const form = useForm<CreateIssueFormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      location_id: locationId ?? "",
      priority: "media",
    },
  });

  useEffect(() => {
    form.reset({
      location_id: locationId ?? "",
      category: undefined,
      title: "",
      description: "",
      address_reference: "",
      priority: "media",
    });
  }, [form, locationId, open]);

  function onSubmit(data: CreateIssueFormData) {
    createIssue(
      {
        category: data.category,
        title: data.title,
        description: data.description,
        location_id: data.location_id,
        address_reference: data.address_reference,
        priority: data.priority,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success("Problema registrado com sucesso.");
            form.reset();
            onIssueCreated?.();
            onClose();
          } else if (result.error) {
            toast.error(ISSUE_RPC_ERROR_MESSAGES[result.error] ?? "Erro ao registrar problema.");
          }
        },
        onError: () => {
          toast.error("Erro inesperado. Tente novamente.");
        },
      }
    );
  }

  const canSubmit = Boolean(locationId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar problema urbano</DialogTitle>
          <DialogDescription>
            Use para problemas persistentes que requerem acao da prefeitura ou concessionaria.
          </DialogDescription>
          <p className="text-xs text-muted-foreground">
            Local: <strong>{neighborhood ? `${neighborhood}, ${city}` : city || "Nao definido"}</strong>
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(ISSUE_CATEGORY_LABELS) as [IssueCategory, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Buraco proximo ao mercado central" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descricao</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o problema com detalhes observaveis."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia de localizacao (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Em frente ao mercado, perto da praca..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!canSubmit && (
              <p className="text-xs text-amber-600">
                Selecione um bairro valido para registrar o problema.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !canSubmit}>
                {isPending ? "Registrando..." : "Registrar problema"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
