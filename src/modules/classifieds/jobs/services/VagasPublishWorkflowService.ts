import { VagasService } from "./VagasService";
import type {
  VagaContrato,
  VagaHighlightType,
  VagaModalidade,
  VagaNivel,
  VagaSalaryMode,
} from "../types/vagas.types";
import type { VagaPublishPermission } from "./VagasPublishPermissionService";

interface ActiveLocationInput {
  id: string;
  name: string;
  type: string;
}

interface PublishFormInput {
  titulo: string;
  empresa: string;
  descricao: string;
  categoria: string;
  contrato: VagaContrato;
  modalidade: VagaModalidade;
  nivel: VagaNivel;
  tags: string[];
  beneficios: string[];
  requisitos: string[];
  contatoEmail: string;
  contatoWhatsapp: string;
  contatoTelefone: string;
  linkExterno: string;
  vagasQtd: string;
  ocultarSalario: boolean;
  salarioMinCents: number | null;
  salarioMaxCents: number | null;
  salaryMode: VagaSalaryMode;
  salaryText: string | null;
  urgente: boolean;
  destaque: boolean;
}

interface PublishContextInput {
  activeProfileId: string;
  activeLocationId: string;
  activeLocation?: ActiveLocationInput | null;
  permission: VagaPublishPermission;
  actorUserId?: string | null;
}

export interface PublishWorkflowInput {
  form: PublishFormInput;
  context: PublishContextInput;
}

export class VagasPublishWorkflowService {
  static async publish(input: PublishWorkflowInput) {
    const { form, context } = input;

    let applicationChannel: "email" | "whatsapp" | "external_url" | "phone" = "email";
    if (form.linkExterno.trim()) applicationChannel = "external_url";
    else if (form.contatoWhatsapp.trim()) applicationChannel = "whatsapp";
    else if (form.contatoTelefone.trim()) applicationChannel = "phone";
    else if (form.contatoEmail.trim()) applicationChannel = "email";

    let highlightType: VagaHighlightType = "none";
    if (form.destaque) highlightType = "premium";
    else if (form.urgente) highlightType = "featured";

    const createdVaga = await VagasService.createVaga({
      slug: VagasService.generateSlug(form.titulo.trim(), form.empresa.trim()),
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      resumo: form.descricao.trim().slice(0, 180),
      empresaNome: form.empresa.trim(),
      empresaLogoUrl: undefined,
      empresaId: context.permission.businessId,
      ownerProfileId: context.activeProfileId,
      locationId: context.activeLocationId,
      bairroId: context.activeLocation?.type === "district" ? context.activeLocation.id : undefined,
      bairroNome: context.activeLocation?.type === "district" ? context.activeLocation.name : undefined,
      categoria: form.categoria || "outro",
      subcategoria: undefined,
      contrato: form.contrato,
      modalidade: form.modalidade,
      nivel: form.nivel,
      tags: form.tags,
      salaryMode: form.salaryMode,
      salarioMin: form.salarioMinCents,
      salarioMax: form.salarioMaxCents,
      salarioTexto: form.salaryText,
      beneficios: form.beneficios,
      requisitos: form.requisitos,
      diferenciais: [],
      responsabilidades: [],
      jornadaDescricao: undefined,
      applicationChannel,
      applicationUrl: form.linkExterno.trim() || undefined,
      applicationWhatsapp: form.contatoWhatsapp.trim() || undefined,
      applicationEmail: form.contatoEmail.trim() || undefined,
      applicationPhone: form.contatoTelefone.trim() || undefined,
      applicationInstructions: undefined,
      status: "pending_review",
      urgencia: form.urgente ? "urgente" : "normal",
      highlightType,
      vagasQuantidade: Number(form.vagasQtd) > 0 ? Number(form.vagasQtd) : 1,
      publishedAt: undefined,
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      closedAt: undefined,
      metaTitle: `${form.titulo.trim()} | ${form.empresa.trim()}`,
      metaDescription: form.descricao.trim().slice(0, 160),
      ogImageUrl: undefined,
    });

    return createdVaga;
  }
}
