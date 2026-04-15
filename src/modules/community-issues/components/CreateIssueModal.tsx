/**
 * CreateIssueModal — Modal de criação de problema urbano
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
}

export function CreateIssueModal({ open, onClose, city, neighborhood }: CreateIssueModalProps) {
  const { mutate: createIssue, isPending } = useCreateIssue();

  const form = useForm<CreateIssueFormData>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: {
      city,
      neighborhood: neighborhood ?? "",
      priority: "media",
    },
  });

  function onSubmit(data: CreateIssueFormData) {
    createIssue(
      {
        category: data.category,
        title: data.title,
        description: data.description,
        neighborhood: data.neighborhood,
        city: data.city,
        address_reference: data.address_reference,
        priority: data.priority,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success("Problema registrado com sucesso.");
            form.reset();
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar problema urbano</DialogTitle>
          <DialogDescription>
            Use este recurso para problemas persistentes que requerem ação da prefeitura ou concessionária.
            Para situações de risco imediato, use Alertas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Categoria */}
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

            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Buraco na Rua das Flores próximo ao nº 120" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o problema com detalhes observáveis."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Referência de endereço */}
            <FormField
              control={form.control}
              name="address_reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referência de localização (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Em frente ao mercado, próximo à praça..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Registrando..." : "Registrar problema"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
