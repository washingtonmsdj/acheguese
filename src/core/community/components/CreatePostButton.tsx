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

  // Não mostrar botão para empresas
  if (!canPost) {
    return null;
  }

  return (
    <Button
      onClick={onOpenModal}
      className="gap-2 min-h-[44px] min-w-[44px]"
      size="default"
      aria-label="Publicar no bairro"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Publicar no bairro</span>
      <span className="sm:hidden">Publicar</span>
    </Button>
  );
}
