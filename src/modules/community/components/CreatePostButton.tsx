import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useUserType } from "../hooks/useUserType";
/**
 * Botão para create novo post na comunidade
 *
 * Requirement 2: Restrição de Postagem para Empresas
 * Requirement 3: Criar Post
 * - Mostrar apenas se canPost === true (usuário pessoa física)
 * - Abrir modal de criação ao clicar
 */

interface CreatePostButtonProps {
  onOpenModal: () => void;
}

export function CreatePostButton({ onOpenModal }: CreatePostButtonProps) {
  const { canPost, loading } = useUserType();

  // Não mostrar botão enquanto carrega
  if (loading) {
    return null;
  }

  // Não mostrar botão para businesss
  if (!canPost) {
    return null;
  }

  return (
    <Button
      onClick={onOpenModal}
      className="gap-2 min-h-[44px] min-w-[44px]"
      size="default"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">Criar Post</span>
      <span className="sm:hidden">Criar</span>
    </Button>
  );
}
