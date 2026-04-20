/**
 * ðŸ“ PUBLICAR VAGA PAGE â€” FormulÃ¡rio completo multi-step
 *
 * âœ… 6 seÃ§Ãµes: InformaÃ§Ãµes â†’ Detalhes â†’ SalÃ¡rio â†’ LocalizaÃ§Ã£o â†’ Contato â†’ RevisÃ£o
 * âœ… SSOT â€” tipos de vagas.types.ts
 * âœ… PadrÃ£o visual consistente com NovoClassificadoPage
 * âœ… Mobile-first + desktop responsivo
 * âœ… Design system tokens
 */

import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, ChevronRight,
  Briefcase, Building2, MapPin, Tag, DollarSign,
  GraduationCap, Award, Phone, Mail, Globe,
  ExternalLink, Eye, Loader2, CheckCircle2,
  AlertCircle, Sparkles, Plus, X, Send,
  FileText, Users, Clock, Shield,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useSessionContext } from "@/core/session";
import { useVagasLocation } from "../hooks/useVagasLocation";
import { useVagaPublishPermission } from "../hooks/useVagaPublishPermission";
import { VagasService } from "../services/VagasService";
import {
  VAGA_CATEGORIAS,
  CONTRATO_LABELS,
  MODALIDADE_LABELS,
  NIVEL_LABELS,
  type VagaContrato,
  type VagaHighlightType,
  type VagaModalidade,
  type VagaNivel,
  type VagaSalaryMode,
} from "../types/vagas.types";

// â”€â”€â”€ Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STEPS = [
  { id: "info",      label: "InformaÃ§Ãµes",  icon: Briefcase, number: 1 },
  { id: "details",   label: "Detalhes",     icon: Tag,       number: 2 },
  { id: "salary",    label: "SalÃ¡rio",      icon: DollarSign, number: 3 },
  { id: "location",  label: "LocalizaÃ§Ã£o",  icon: MapPin,    number: 4 },
  { id: "contact",   label: "Contato",      icon: Phone,     number: 5 },
  { id: "preview",   label: "RevisÃ£o",      icon: Eye,       number: 6 },
] as const;

type StepId = typeof STEPS[number]["id"];

const MAX_TITLE = 120;
const MAX_DESCRIPTION = 3000;

// â”€â”€â”€ Suggested benefits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SUGGESTED_BENEFITS = [
  "Vale RefeiÃ§Ã£o", "Vale Transporte", "Plano de SaÃºde", "Plano OdontolÃ³gico",
  "Seguro de Vida", "Gympass", "Day Off AniversÃ¡rio", "PLR",
  "Home Office", "HorÃ¡rio FlexÃ­vel", "Estacionamento", "AuxÃ­lio Creche",
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function PublicarVagaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProfile } = useSessionContext();
  const {
    activeLocation,
    hasActiveLocation,
    activeLocationId,
    activeLocationName,
  } = useVagasLocation();
  const { permission, isLoading: isLoadingPermission } = useVagaPublishPermission();

  // Form state
  const [titulo, setTitulo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contrato, setContrato] = useState<VagaContrato>("CLT");
  const [modalidade, setModalidade] = useState<VagaModalidade>("presencial");
  const [nivel, setNivel] = useState<VagaNivel>("pleno");
  const [categoria, setCategoria] = useState("");
  const [vagasQtd, setVagasQtd] = useState("");

  // Salary
  const [salarioMin, setSalarioMin] = useState("");
  const [salarioMax, setSalarioMax] = useState("");
  const [ocultarSalario, setOcultarSalario] = useState(false);

  // Location (SSOT) - gerenciado pelo hook useVagasLocation
  // NÃ£o precisa de state local - usa activeLocationId diretamente

  // Arrays
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [requisitos, setRequisitos] = useState<string[]>([]);
  const [reqInput, setReqInput] = useState("");
  const [beneficios, setBeneficios] = useState<string[]>([]);
  const [benInput, setBenInput] = useState("");

  // Contact
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoWhatsapp, setContatoWhatsapp] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [linkExterno, setLinkExterno] = useState("");

  // Visibility
  const [destaque, setDestaque] = useState(false);
  const [urgente, setUrgente] = useState(false);

  // UI state
  const [currentStep, setCurrentStep] = useState<StepId>("info");
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const addToList = useCallback(
    (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
      const trimmed = input.trim();
      if (trimmed && !list.includes(trimmed)) {
        setList([...list, trimmed]);
        setInput("");
      }
    },
    []
  );

  const removeFromList = useCallback(
    (list: string[], setList: (v: string[]) => void, index: number) => {
      setList(list.filter((_, i) => i !== index));
    },
    []
  );

  const toggleBenefit = useCallback((benefit: string) => {
    setBeneficios((prev) =>
      prev.includes(benefit) ? prev.filter((b) => b !== benefit) : [...prev, benefit]
    );
  }, []);

  // â”€â”€â”€ Step validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const validateStep = useCallback(
    (step: StepId): boolean => {
      const newErrors: Record<string, string> = {};

      switch (step) {
        case "info":
          if (!titulo.trim()) newErrors.titulo = "TÃ­tulo obrigatÃ³rio";
          else if (titulo.trim().length < 5) newErrors.titulo = "MÃ­nimo 5 caracteres";
          if (!empresa.trim()) newErrors.empresa = "Nome da empresa obrigatÃ³rio";
          if (!descricao.trim()) newErrors.descricao = "DescriÃ§Ã£o obrigatÃ³ria";
          else if (descricao.trim().length < 20) newErrors.descricao = "MÃ­nimo 20 caracteres";
          break;
        case "location":
          if (!hasActiveLocation) {
            newErrors.location = "Selecione uma localização ativa no sistema";
          }
          if (isLoadingPermission) {
            newErrors.publishPermission = "Aguarde a validação das permissões.";
          } else if (!permission.canPublish) {
            newErrors.publishPermission = permission.message;
          }
          break;
        case "contact":
          if (!contatoEmail.trim() && !contatoWhatsapp.trim() && !contatoTelefone.trim() && !linkExterno.trim()) {
            newErrors.contact = "Informe ao menos um canal de contato";
          }
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [
      titulo,
      empresa,
      descricao,
      hasActiveLocation,
      isLoadingPermission,
      contatoEmail,
      contatoWhatsapp,
      contatoTelefone,
      linkExterno,
      permission.canPublish,
      permission.message,
    ]
  );

  // â”€â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const goNext = useCallback(() => {
    if (!validateStep(currentStep)) return;
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < STEPS.length) setCurrentStep(STEPS[nextIdx].id);
  }, [currentStep, currentStepIndex, validateStep]);

  const goPrev = useCallback(() => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) setCurrentStep(STEPS[prevIdx].id);
    else navigate(-1);
  }, [currentStepIndex, navigate]);

  const goToStep = useCallback(
    (step: StepId) => {
      const targetIdx = STEPS.findIndex((s) => s.id === step);
      if (targetIdx < currentStepIndex) {
        setCurrentStep(step);
      } else if (validateStep(currentStep)) {
        setCurrentStep(step);
      }
    },
    [currentStepIndex, currentStep, validateStep]
  );

  // â”€â”€â”€ Completeness â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const completeness = useMemo(() => {
    let filled = 0;
    const total = 8;
    if (titulo.trim()) filled++;
    if (empresa.trim()) filled++;
    if (descricao.trim()) filled++;
    if (categoria) filled++;
    if (salarioMin || salarioMax || ocultarSalario) filled++;
    if (activeLocationId) filled++;
    if (contatoEmail || contatoWhatsapp || contatoTelefone || linkExterno) filled++;
    if (requisitos.length > 0 || beneficios.length > 0) filled++;
    return Math.round((filled / total) * 100);
  }, [titulo, empresa, descricao, categoria, salarioMin, salarioMax, ocultarSalario, activeLocationId, contatoEmail, contatoWhatsapp, contatoTelefone, linkExterno, requisitos, beneficios]);

  const parseSalaryInputToCents = useCallback((value: string): number | undefined => {
    const sanitized = value.trim();
    if (!sanitized) return undefined;
    const numeric = Number(sanitized.replace(",", "."));
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    return Math.round(numeric * 100);
  }, []);

  const resolveSalaryMode = useCallback(
    (
      minValueInCents: number | undefined,
      maxValueInCents: number | undefined,
    ): {
      mode: VagaSalaryMode;
      min?: number;
      max?: number;
      text?: string;
    } => {
      if (ocultarSalario) {
        return {
          mode: "a_combinar",
          text: "A combinar",
        };
      }

      if (minValueInCents && maxValueInCents) {
        return {
          mode: "range",
          min: Math.min(minValueInCents, maxValueInCents),
          max: Math.max(minValueInCents, maxValueInCents),
        };
      }

      if (minValueInCents || maxValueInCents) {
        const fixedValue = minValueInCents ?? maxValueInCents;
        return {
          mode: "fixed",
          min: fixedValue,
          max: fixedValue,
        };
      }

      return {
        mode: "a_combinar",
        text: "A combinar",
      };
    },
    [ocultarSalario],
  );

  // â”€â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handlePublish = useCallback(async () => {
    if (!titulo.trim() || !empresa.trim() || !descricao.trim()) {
      toast.error("Preencha todos os campos obrigatÃ³rios");
      setCurrentStep("info");
      return;
    }

    if (!contatoEmail.trim() && !contatoWhatsapp.trim() && !contatoTelefone.trim() && !linkExterno.trim()) {
      toast.error("Informe ao menos um canal de contato");
      setCurrentStep("contact");
      return;
    }

    if (isLoadingPermission) {
      toast.error("Aguarde a validação das permissões para publicar.");
      setCurrentStep("location");
      return;
    }

    if (!permission.canPublish) {
      toast.error(permission.message);
      setCurrentStep("location");
      return;
    }

    if (!permission.isAdmin && !permission.businessId) {
      toast.error("Empresa vinculada não encontrada para publicação.");
      setCurrentStep("location");
      return;
    }

    if (!activeProfile?.id) {
      toast.error("Selecione um perfil ativo para publicar.");
      setCurrentStep("location");
      return;
    }

    if (!activeLocationId) {
      toast.error("Selecione um território ativo para publicar.");
      setCurrentStep("location");
      return;
    }

    setPublishing(true);
    try {
      const salarioMinCents = parseSalaryInputToCents(salarioMin);
      const salarioMaxCents = parseSalaryInputToCents(salarioMax);
      const salary = resolveSalaryMode(salarioMinCents, salarioMaxCents);

      let applicationChannel: "email" | "whatsapp" | "external_url" | "phone" = "email";
      if (linkExterno.trim()) applicationChannel = "external_url";
      else if (contatoWhatsapp.trim()) applicationChannel = "whatsapp";
      else if (contatoTelefone.trim()) applicationChannel = "phone";
      else if (contatoEmail.trim()) applicationChannel = "email";

      let highlightType: VagaHighlightType = "none";
      if (destaque) highlightType = "premium";
      else if (urgente) highlightType = "featured";

      await VagasService.createVaga({
        slug: VagasService.generateSlug(titulo.trim(), empresa.trim()),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        resumo: descricao.trim().slice(0, 180),
        empresaNome: empresa.trim(),
        empresaLogoUrl: undefined,
        empresaId: permission.businessId,
        ownerProfileId: activeProfile.id,
        locationId: activeLocationId,
        bairroId: activeLocation?.type === "district" ? activeLocation.id : undefined,
        bairroNome: activeLocation?.type === "district" ? activeLocation.name : undefined,
        categoria: categoria || "outro",
        subcategoria: undefined,
        contrato,
        modalidade,
        nivel,
        tags,
        salaryMode: salary.mode,
        salarioMin: salary.min,
        salarioMax: salary.max,
        salarioTexto: salary.text,
        beneficios,
        requisitos,
        diferenciais: [],
        responsabilidades: [],
        jornadaDescricao: undefined,
        applicationChannel,
        applicationUrl: linkExterno.trim() || undefined,
        applicationWhatsapp: contatoWhatsapp.trim() || undefined,
        applicationEmail: contatoEmail.trim() || undefined,
        applicationPhone: contatoTelefone.trim() || undefined,
        applicationInstructions: undefined,
        status: "pending_review",
        urgencia: urgente ? "urgente" : "normal",
        highlightType,
        vagasQuantidade: Number(vagasQtd) > 0 ? Number(vagasQtd) : 1,
        publishedAt: undefined,
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        closedAt: undefined,
        metaTitle: `${titulo.trim()} | ${empresa.trim()}`,
        metaDescription: descricao.trim().slice(0, 160),
        ogImageUrl: undefined,
      });

      toast.success("Vaga enviada para revisão com sucesso.");
      navigate("/vagas");
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao publicar vaga. Tente novamente.";
      toast.error(errorMessage);
    } finally {
      setPublishing(false);
    }
  }, [
    titulo,
    empresa,
    descricao,
    contatoEmail,
    contatoWhatsapp,
    contatoTelefone,
    linkExterno,
    isLoadingPermission,
    permission,
    activeProfile?.id,
    activeLocationId,
    activeLocation,
    salarioMin,
    salarioMax,
    resolveSalaryMode,
    parseSalaryInputToCents,
    destaque,
    urgente,
    categoria,
    contrato,
    modalidade,
    nivel,
    tags,
    beneficios,
    requisitos,
    vagasQtd,
    navigate,
  ]);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      toast.error("FaÃ§a login para publicar uma vaga");
      navigate("/login");
    }
  }, [user, navigate]);

  React.useEffect(() => {
    if (!permission.businessName) return;
    if (empresa.trim()) return;
    setEmpresa(permission.businessName);
  }, [permission.businessName, empresa]);

  if (!user) return null;

  // Categories without "todos"
  const formCategories = VAGA_CATEGORIAS.filter((c) => c.id !== "todos");

  // Salary display helper
  const salaryDisplay = ocultarSalario
    ? "A combinar"
    : salarioMin && salarioMax
    ? `R$ ${Number(salarioMin).toLocaleString("pt-BR")} â€“ R$ ${Number(salarioMax).toLocaleString("pt-BR")}`
    : salarioMin
    ? `A partir de R$ ${Number(salarioMin).toLocaleString("pt-BR")}`
    : salarioMax
    ? `AtÃ© R$ ${Number(salarioMax).toLocaleString("pt-BR")}`
    : "A combinar";

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* â”€â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={goPrev}
            className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-foreground shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary shrink-0" />
              {STEPS[currentStepIndex].label}
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Passo {currentStepIndex + 1} de {STEPS.length} Â· {completeness}% preenchido
            </p>
          </div>
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
            <motion.div
              className="h-full rounded-full bg-primary"
              animate={{ width: `${completeness}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1 px-4 pb-2 max-w-3xl mx-auto overflow-x-auto scrollbar-hide">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToStep(s.id)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all shrink-0",
                i === currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : i < currentStepIndex
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <s.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.number}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-4 pt-4">
        <div
          className={cn(
            "rounded-xl border p-3 flex items-start gap-3",
            permission.canPublish
              ? "bg-success/10 border-success/25"
              : "bg-warning/10 border-warning/25",
          )}
        >
          {permission.canPublish ? (
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
          ) : (
            <Shield className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {isLoadingPermission
                ? "Validando permissão para publicar..."
                : permission.canPublish
                  ? "Publicação liberada"
                  : "Publicação bloqueada"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isLoadingPermission
                ? "Aguarde a validação do perfil/empresa."
                : permission.message}
            </p>
            {!isLoadingPermission && permission.canPublish && (
              <p className="text-[11px] text-muted-foreground">
                Perfil ativo: <strong>{activeProfile?.profileType || "—"}</strong>
                {" · "}
                Empresa: <strong>{permission.businessName || empresa || "—"}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ Step Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 px-4 py-5 pb-28 max-w-3xl mx-auto w-full"
        >
          {/* â•â•â• STEP 1: InformaÃ§Ãµes â•â•â• */}
          {currentStep === "info" && (
            <div className="space-y-5">
              {/* TÃ­tulo */}
              <FormField label="TÃ­tulo da Vaga" error={errors.titulo} counter={`${titulo.length}/${MAX_TITLE}`} required>
                <Input
                  placeholder="Ex: Desenvolvedor Full Stack, Vendedor Externo..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={MAX_TITLE}
                  className={cn("h-12 text-sm rounded-xl", errors.titulo && "border-destructive")}
                />
              </FormField>

              {/* Empresa */}
              <FormField label="Nome da Empresa" error={errors.empresa} required>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ex: TechBa Solutions"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    maxLength={100}
                    className={cn("pl-10 h-12 text-sm rounded-xl", errors.empresa && "border-destructive")}
                  />
                </div>
              </FormField>

              {/* DescriÃ§Ã£o */}
              <FormField label="DescriÃ§Ã£o da Vaga" error={errors.descricao} counter={`${descricao.length}/${MAX_DESCRIPTION}`} required>
                <Textarea
                  placeholder="Descreva as responsabilidades, ambiente de trabalho, diferenciais..."
                  rows={5}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  maxLength={MAX_DESCRIPTION}
                  className={cn("text-sm rounded-xl resize-none", errors.descricao && "border-destructive")}
                />
              </FormField>

              {/* Contrato / Modalidade / NÃ­vel */}
              <div className="space-y-4">
                {/* Contrato */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Tipo de Contrato</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(CONTRATO_LABELS) as [VagaContrato, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setContrato(key)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                          contrato === key
                            ? "bg-primary/15 border-primary/50 text-primary"
                            : "bg-card border-border text-muted-foreground hover:border-primary/30"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modalidade */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Modalidade</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(MODALIDADE_LABELS) as [VagaModalidade, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setModalidade(key)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                          modalidade === key
                            ? "bg-accent/15 border-accent/50 text-accent"
                            : "bg-card border-border text-muted-foreground hover:border-accent/30"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* NÃ­vel */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">NÃ­vel</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(NIVEL_LABELS) as [VagaNivel, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setNivel(key)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                          nivel === key
                            ? "bg-success/15 border-success/50 text-success"
                            : "bg-card border-border text-muted-foreground hover:border-success/30"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Categoria</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {formCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoria(categoria === cat.id ? "" : cat.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all",
                        categoria === cat.id
                          ? "bg-primary/10 border-primary text-primary shadow-sm"
                          : "bg-card border-border text-foreground hover:border-primary/30"
                      )}
                    >
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-[10px] font-semibold leading-tight">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Qtd de vagas */}
              <FormField label="Quantidade de vagas" optional>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="Ex: 3"
                    value={vagasQtd}
                    onChange={(e) => setVagasQtd(e.target.value)}
                    className="pl-10 h-12 text-sm rounded-xl"
                    min={1}
                  />
                </div>
              </FormField>
            </div>
          )}

          {/* â•â•â• STEP 2: Detalhes â•â•â• */}
          {currentStep === "details" && (
            <div className="space-y-6">
              {/* Tags / Habilidades */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-primary" />
                  Habilidades / Tags
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: React, Excel, Atendimento..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(tags, setTags, tagInput, setTagInput))}
                    className="h-11 text-sm rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addToList(tags, setTags, tagInput, setTagInput)}
                    className="rounded-xl h-11 px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeFromList(tags, setTags, i)} aria-label={`Remover ${tag}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Requisitos */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-accent" />
                  Requisitos
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: 3+ anos de experiÃªncia, CNH B..."
                    value={reqInput}
                    onChange={(e) => setReqInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(requisitos, setRequisitos, reqInput, setReqInput))}
                    className="h-11 text-sm rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addToList(requisitos, setRequisitos, reqInput, setReqInput)}
                    className="rounded-xl h-11 px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {requisitos.length > 0 && (
                  <ul className="space-y-1.5 mt-2">
                    {requisitos.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
                        <span className="flex items-center gap-2">
                          <span className="text-accent">â€¢</span>{r}
                        </span>
                        <button onClick={() => removeFromList(requisitos, setRequisitos, i)} aria-label={`Remover ${r}`}>
                          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* BenefÃ­cios */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-success" />
                  BenefÃ­cios
                </label>

                {/* SugestÃµes rÃ¡pidas */}
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_BENEFITS.map((b) => (
                    <button
                      key={b}
                      onClick={() => toggleBenefit(b)}
                      className={cn(
                        "px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all",
                        beneficios.includes(b)
                          ? "bg-success/15 border-success/40 text-success"
                          : "bg-card border-border text-muted-foreground hover:border-success/30"
                      )}
                    >
                      {beneficios.includes(b) ? "âœ“ " : ""}{b}
                    </button>
                  ))}
                </div>

                {/* Input customizado */}
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Outro benefÃ­cio..."
                    value={benInput}
                    onChange={(e) => setBenInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(beneficios, setBeneficios, benInput, setBenInput))}
                    className="h-11 text-sm rounded-xl flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addToList(beneficios, setBeneficios, benInput, setBenInput)}
                    className="rounded-xl h-11 px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Custom benefits (not in suggestions) */}
                {beneficios.filter((b) => !SUGGESTED_BENEFITS.includes(b)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {beneficios.filter((b) => !SUGGESTED_BENEFITS.includes(b)).map((b, i) => (
                      <span key={i} className="text-xs bg-success/10 text-success border border-success/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                        {b}
                        <button onClick={() => setBeneficios((prev) => prev.filter((x) => x !== b))} aria-label={`Remover ${b}`}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* â•â•â• STEP 3: SalÃ¡rio â•â•â• */}
          {currentStep === "salary" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">Ocultar salÃ¡rio</p>
                  <p className="text-[10px] text-muted-foreground">
                    Exibir como "A combinar" para candidatos
                  </p>
                </div>
                <Switch checked={ocultarSalario} onCheckedChange={setOcultarSalario} />
              </div>

              {!ocultarSalario && (
                <div className="space-y-4">
                  <FormField label="Faixa Salarial (R$)">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="MÃ­nimo"
                          value={salarioMin}
                          onChange={(e) => setSalarioMin(e.target.value)}
                          className="pl-9 h-12 text-sm rounded-xl"
                          min={0}
                        />
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="MÃ¡ximo"
                          value={salarioMax}
                          onChange={(e) => setSalarioMax(e.target.value)}
                          className="pl-9 h-12 text-sm rounded-xl"
                          min={0}
                        />
                      </div>
                    </div>
                  </FormField>

                  <p className="text-xs text-muted-foreground px-1">
                    ðŸ’¡ Vagas com salÃ¡rio informado recebem atÃ© 3x mais candidaturas
                  </p>
                </div>
              )}

              {/* Preview */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">PrÃ©via do salÃ¡rio:</p>
                <p className="text-lg font-bold text-primary">{salaryDisplay}</p>
              </div>

              {/* Urgente */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-warning" />
                    Vaga Urgente
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Destaca com selo de urgÃªncia na listagem
                  </p>
                </div>
                <Switch checked={urgente} onCheckedChange={setUrgente} />
              </div>

              {/* Destaque */}
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Destaque Premium</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Coloque sua vaga no topo dos resultados por 7 dias.
                </p>
                <Button variant="outline" size="sm" className="rounded-xl text-xs" disabled>
                  Em breve
                </Button>
              </div>
            </div>
          )}

          {/* â•â•â• STEP 4: LocalizaÃ§Ã£o â•â•â• */}
          {currentStep === "location" && (
            <div className="space-y-5">
              {/* Location status - SSOT */}
              <div
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border",
                  hasActiveLocation
                    ? "bg-primary/5 border-primary/20"
                    : "bg-destructive/5 border-destructive/20"
                )}
              >
                <MapPin
                  className={cn(
                    "h-5 w-5 shrink-0",
                    hasActiveLocation ? "text-primary" : "text-destructive"
                  )}
                />
                <div className="flex-1">
                  {hasActiveLocation ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        ðŸ“ {activeLocationName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        LocalizaÃ§Ã£o ativa â€” sua vaga aparecerÃ¡ nesta regiÃ£o
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-destructive">
                        Nenhuma localizaÃ§Ã£o ativa
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Selecione uma comunidade/cidade para publicar sua vaga
                      </p>
                    </>
                  )}
                </div>
                {hasActiveLocation && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                )}
              </div>

              {errors.location && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{errors.location}</p>
                </div>
              )}

              {errors.publishPermission && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
                  <Shield className="h-4 w-4 text-warning shrink-0" />
                  <p className="text-xs text-warning">{errors.publishPermission}</p>
                </div>
              )}

              {modalidade === "remoto" && (
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                  <p className="text-xs text-muted-foreground">
                    ðŸ  Vaga remota â€” a localizaÃ§Ã£o indica a sede da empresa para referÃªncia.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* â•â•â• STEP 5: Contato â•â•â• */}
          {currentStep === "contact" && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">
                Informe pelo menos um canal para que candidatos entrem em contato.
              </p>

              {errors.contact && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{errors.contact}</p>
                </div>
              )}

              <FormField label="Email">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="rh@empresa.com"
                    value={contatoEmail}
                    onChange={(e) => setContatoEmail(e.target.value)}
                    className="pl-10 h-12 text-sm rounded-xl"
                  />
                </div>
              </FormField>

              <FormField label="WhatsApp">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="71999990001"
                    value={contatoWhatsapp}
                    onChange={(e) => setContatoWhatsapp(e.target.value)}
                    className="pl-10 h-12 text-sm rounded-xl"
                  />
                </div>
              </FormField>

              <FormField label="Telefone">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="7133001234"
                    value={contatoTelefone}
                    onChange={(e) => setContatoTelefone(e.target.value)}
                    className="pl-10 h-12 text-sm rounded-xl"
                  />
                </div>
              </FormField>

              <FormField label="Link externo" optional>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="https://empresa.com/vagas"
                    value={linkExterno}
                    onChange={(e) => setLinkExterno(e.target.value)}
                    className="pl-10 h-12 text-sm rounded-xl"
                  />
                </div>
              </FormField>
            </div>
          )}

          {/* â•â•â• STEP 6: RevisÃ£o â•â•â• */}
          {currentStep === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-bold text-foreground">RevisÃ£o da Vaga</h2>
              </div>

              {/* Main info */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{titulo || "Sem tÃ­tulo"}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {empresa || "Sem empresa"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{CONTRATO_LABELS[contrato]}</span>
                  <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">{MODALIDADE_LABELS[modalidade]}</span>
                  <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">{NIVEL_LABELS[nivel]}</span>
                  {urgente && (
                    <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" /> Urgente
                    </span>
                  )}
                  {categoria && (
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
                      {formCategories.find((c) => c.id === categoria)?.emoji} {formCategories.find((c) => c.id === categoria)?.label}
                    </span>
                  )}
                </div>

                {(activeLocationName) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {activeLocationName}
                  </p>
                )}
              </div>

              {/* SalÃ¡rio */}
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">SalÃ¡rio</p>
                <p className="text-sm text-primary font-bold">{salaryDisplay}</p>
              </div>

              {/* DescriÃ§Ã£o */}
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">DescriÃ§Ã£o</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{descricao || "â€”"}</p>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Requisitos */}
              {requisitos.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Requisitos</p>
                  <ul className="space-y-1">
                    {requisitos.map((r) => (
                      <li key={r} className="text-sm text-muted-foreground">â€¢ {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* BenefÃ­cios */}
              {beneficios.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">BenefÃ­cios</p>
                  <div className="flex flex-wrap gap-1.5">
                    {beneficios.map((b) => (
                      <span key={b} className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">{b}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contato */}
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Contato</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {contatoEmail && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {contatoEmail}</p>}
                  {contatoWhatsapp && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {contatoWhatsapp}</p>}
                  {contatoTelefone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {contatoTelefone}</p>}
                  {linkExterno && <p className="flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" /> {linkExterno}</p>}
                  {!contatoEmail && !contatoWhatsapp && !contatoTelefone && !linkExterno && (
                    <p className="text-destructive text-xs">âš ï¸ Nenhum contato informado</p>
                  )}
                </div>
              </div>

              {vagasQtd && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Vagas disponÃ­veis</p>
                  <p className="text-sm text-foreground font-semibold">{vagasQtd} vaga(s)</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* â”€â”€â”€ Fixed Bottom Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-20">
        <div className="max-w-3xl mx-auto">
          {currentStep === "preview" ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setCurrentStep("info")}
              >
                Editar
              </Button>
              <Button
                className="flex-1 h-12 text-base font-semibold rounded-xl shadow-lg"
                onClick={handlePublish}
                disabled={publishing || isLoadingPermission || !permission.canPublish}
              >
                {publishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : isLoadingPermission ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : !permission.canPublish ? (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Publicação bloqueada
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publicar Vaga
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              {currentStepIndex > 0 && (
                <Button
                  variant="outline"
                  className="h-12 rounded-xl px-5"
                  onClick={goPrev}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              )}
              <Button
                className="flex-1 h-12 text-base font-semibold rounded-xl"
                onClick={goNext}
              >
                {currentStepIndex === STEPS.length - 2 ? "Revisar" : "PrÃ³ximo"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Reusable Form Field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FormField({
  label,
  error,
  counter,
  optional,
  required,
  children,
}: {
  label: string;
  error?: string;
  counter?: string;
  optional?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
          {optional && (
            <span className="text-muted-foreground font-normal text-xs ml-1">(opcional)</span>
          )}
        </label>
        {counter && (
          <span className="text-[10px] text-muted-foreground">{counter}</span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

