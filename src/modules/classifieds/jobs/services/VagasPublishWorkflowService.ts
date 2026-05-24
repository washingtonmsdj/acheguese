import { postService } from "@/core/posts/services";
import { workOpportunitiesService } from "@/core/work-opportunities/services/WorkOpportunitiesService";
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

    try {
      await postService.createPost({
        author_profile_id: context.activeProfileId,
        content: `Vaga aberta: ${form.titulo.trim()} • ${form.empresa.trim()}`,
        type: "favor",
        location_id: context.activeLocationId,
        reach: "city",
        tags: [
          "format:opportunity",
          "intent:vaga",
          `category:${form.categoria || "outro"}`,
          `contract:${form.contrato}`,
        ],
        content_intent: "vaga",
        display_format: "opportunity_card",
        distribution_channels: ["oportunidades", "empresas", "para_voce", "todos"],
        content_payload: {
          schema_version: "territorial-content.v3",
          intent: "vaga",
          structural_type: "favor",
          display_format: "opportunity_card",
          vaga: {
            id: createdVaga.id,
            slug: createdVaga.slug,
            title: createdVaga.titulo,
            company: createdVaga.empresaNome,
            category: createdVaga.categoria,
            location_id: createdVaga.locationId,
            target_url: `/vagas/detalhe/${createdVaga.id}`,
          },
        },
      });
    } catch (feedError) {
      console.warn("[VagasPublishWorkflowService] Não foi possível distribuir vaga no feed", feedError);
    }

    try {
      await workOpportunitiesService.notifyMatchingForStructuredVaga({
        vagaId: createdVaga.id,
        title: createdVaga.titulo,
        professionalCategory: createdVaga.categoria,
        territoryLocationId: createdVaga.locationId,
        sourceUrl: `/vagas/detalhe/${createdVaga.id}`,
        actorUserId: context.actorUserId ?? null,
      });
    } catch (matchingError) {
      console.warn("[VagasPublishWorkflowService] Não foi possível notificar matching da vaga", matchingError);
    }

    return createdVaga;
  }
}
