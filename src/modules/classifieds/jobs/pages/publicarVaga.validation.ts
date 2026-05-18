import type { StepId } from "./publicarVaga.shared";

interface PrePublishInput {
  titulo: string;
  empresa: string;
  descricao: string;
  contatoEmail: string;
  contatoWhatsapp: string;
  contatoTelefone: string;
  linkExterno: string;
  isLoadingPermission: boolean;
  canPublish: boolean;
  permissionMessage: string;
  isAdmin: boolean;
  businessId?: string;
  activeProfileId?: string;
  activeLocationId?: string;
}

interface ValidationError {
  message: string;
  step: StepId;
}

export function validateBeforePublish(input: PrePublishInput): ValidationError | null {
  if (!input.titulo.trim() || !input.empresa.trim() || !input.descricao.trim()) {
    return { message: "Preencha todos os campos obrigatórios", step: "info" };
  }

  if (
    !input.contatoEmail.trim() &&
    !input.contatoWhatsapp.trim() &&
    !input.contatoTelefone.trim() &&
    !input.linkExterno.trim()
  ) {
    return { message: "Informe ao menos um canal de contato", step: "contact" };
  }

  if (input.isLoadingPermission) {
    return { message: "Aguarde a validação das permissões para publicar.", step: "location" };
  }

  if (!input.canPublish) {
    return { message: input.permissionMessage, step: "location" };
  }

  if (!input.isAdmin && !input.businessId) {
    return { message: "Empresa vinculada não encontrada para publicação.", step: "location" };
  }

  if (!input.activeProfileId) {
    return { message: "Selecione um perfil ativo para publicar.", step: "location" };
  }

  if (!input.activeLocationId) {
    return { message: "Selecione um território ativo para publicar.", step: "location" };
  }

  return null;
}
