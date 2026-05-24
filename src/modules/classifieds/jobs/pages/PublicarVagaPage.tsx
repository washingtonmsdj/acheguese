/**
 * 📝 PUBLICAR VAGA PAGE — Formulário completo multi-step
 *
 * ✅ 6 seções: Informações → Detalhes → Salário → Localização → Contato → Revisão
 * ✅ SSOT — tipos de vagas.types.ts
 * ✅ Padrão visual consistente com NovoClassificadoPage
 * ✅ Mobile-first + desktop responsivo
 * ✅ Design system tokens
 */

import React, { useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Globe,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useSessionContext } from "@/core/session";
import { useVagasLocation } from "../hooks/useVagasLocation";
import { useVagaPublishPermission } from "../hooks/useVagaPublishPermission";
import { VagasPublishWorkflowService } from "../services/VagasPublishWorkflowService";
import { JOB_FORM_LIMITS } from "../constants/form-limits";
import {
  VAGA_CATEGORIAS,
  type VagaContrato,
  type VagaModalidade,
  type VagaNivel,
} from "../types/vagas.types";
import {
  STEPS,
  SUGGESTED_BENEFITS,
  addUniqueListItem,
  buildVagasListPath,
  contratoLabelsMap,
  modalidadeLabelsMap,
  nivelLabelsMap,
  parseSalaryInputToCents,
  removeListItem,
  resolveSalaryMode,
  toggleListItem,
  type StepId,
} from "./publicarVaga.shared";
import { validateBeforePublish } from "./publicarVaga.validation";
import {
  ContactStep,
  DetailsStep,
  InfoStep,
  LocationStep,
  PreviewStep,
  SalaryStep,
} from "./steps";
import {
  PublishBottomActions,
  PublishHeader,
  PublishPermissionBanner,
} from "./publicarVaga.chrome";

// ═════════════════════════════════════════════════════════════
export default function PublicarVagaPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
  // Não precisa de state local - usa activeLocationId diretamente

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
  const vagasListPath = useMemo(
    () => buildVagasListPath(location.pathname),
    [location.pathname],
  );

  // ─── Helpers ────────────────────────────────────
  const addToList = useCallback(
    (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
      const next = addUniqueListItem(list, input);
      if (next !== list) {
        setList(next);
        setInput("");
      }
    },
    []
  );

  const removeFromList = useCallback(
    (list: string[], setList: (v: string[]) => void, index: number) => {
      setList(removeListItem(list, index));
    },
    []
  );

  const toggleBenefit = useCallback((benefit: string) => {
    setBeneficios((prev) => toggleListItem(prev, benefit));
  }, []);

  // ─── Step validation ───────────────────────────
  const validateStep = useCallback(
    (step: StepId): boolean => {
      const newErrors: Record<string, string> = {};

      switch (step) {
        case "info":
          if (!titulo.trim()) newErrors.titulo = "Título obrigatório";
          else if (titulo.trim().length < 5) newErrors.titulo = "Mínimo 5 caracteres";
          if (!empresa.trim()) newErrors.empresa = "Nome da empresa obrigatório";
          if (!descricao.trim()) newErrors.descricao = "Descrição obrigatória";
          else if (descricao.trim().length < 20) newErrors.descricao = "Mínimo 20 caracteres";
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

  // ─── Navigation ─────────────────────────────────
  const goNext = useCallback(() => {
    if (!validateStep(currentStep)) return;
    const nextIdx = currentStepIndex + 1;
    const nextStep = STEPS.at(nextIdx);
    if (nextStep) setCurrentStep(nextStep.id);
  }, [currentStep, currentStepIndex, validateStep]);

  const goBackToVagas = useCallback(() => {
    navigate(vagasListPath);
  }, [navigate, vagasListPath]);

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

  // ─── Completeness ───────────────────────────────
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

  // ─── Submit ─────────────────────────────────────
  const handlePublish = useCallback(async () => {
    const validationError = validateBeforePublish({
      titulo,
      empresa,
      descricao,
      contatoEmail,
      contatoWhatsapp,
      contatoTelefone,
      linkExterno,
      isLoadingPermission,
      canPublish: permission.canPublish,
      permissionMessage: permission.message,
      isAdmin: permission.isAdmin,
      businessId: permission.businessId,
      activeProfileId: activeProfile?.id,
      activeLocationId,
    });
    if (validationError) {
      toast.error(validationError.message);
      setCurrentStep(validationError.step);
      return;
    }

    setPublishing(true);
    try {
      const salarioMinCents = parseSalaryInputToCents(salarioMin);
      const salarioMaxCents = parseSalaryInputToCents(salarioMax);
      const salary = resolveSalaryMode(
        ocultarSalario,
        salarioMinCents,
        salarioMaxCents,
      );
      const normalizedSalaryMode =
        salary.mode === "fixed" ? "range" : salary.mode;
      const normalizedActiveLocation = activeLocation
        ? {
            id: activeLocation.id,
            name: activeLocation.name,
            type: activeLocation.type === "district" ? "district" : "city",
          }
        : null;

      await VagasPublishWorkflowService.publish({
        form: {
          titulo,
          empresa,
          descricao,
          categoria,
          contrato,
          modalidade,
          nivel,
          tags,
          beneficios,
          requisitos,
          contatoEmail,
          contatoWhatsapp,
          contatoTelefone,
          linkExterno,
          vagasQtd,
          ocultarSalario,
          salarioMinCents: salary.min,
          salarioMaxCents: salary.max,
          salaryMode: normalizedSalaryMode,
          salaryText: salary.text,
          urgente,
          destaque,
        },
        context: {
          activeProfileId: activeProfile.id,
          activeLocationId,
          activeLocation: normalizedActiveLocation,
          permission,
          actorUserId: user?.id ?? null,
        },
      });

      toast.success("Vaga enviada para revisão com sucesso.");
      navigate(vagasListPath);
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
    user?.id,
    activeLocationId,
    activeLocation,
    salarioMin,
    salarioMax,
    ocultarSalario,
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
    vagasListPath,
  ]);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      toast.error("Faça login para publicar uma vaga");
      navigate("/login", {
        state: { redirectTo: location.pathname + location.search + location.hash },
      });
    }
  }, [user, navigate, location.pathname, location.search, location.hash]);

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
    ? `R$ ${Number(salarioMin).toLocaleString("pt-BR")} – R$ ${Number(salarioMax).toLocaleString("pt-BR")}`
    : salarioMin
    ? `A partir de R$ ${Number(salarioMin).toLocaleString("pt-BR")}`
    : salarioMax
    ? `Até R$ ${Number(salarioMax).toLocaleString("pt-BR")}`
    : "A combinar";

  // ─── Render ─────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full bg-background">
      <PublishHeader
        steps={STEPS}
        currentStepIndex={currentStepIndex}
        completeness={completeness}
        onBack={goBackToVagas}
        onStepChange={goToStep}
      />

      <PublishPermissionBanner
        canPublish={permission.canPublish}
        isLoadingPermission={isLoadingPermission}
        permissionMessage={permission.message}
        businessName={permission.businessName}
        empresaFallback={empresa}
      />

      {/* ─── Step Content ──────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 px-4 py-5 pb-28 max-w-3xl mx-auto w-full"
        >
          {/* ═══ STEP 1: Informações ═══ */}
          {currentStep === "info" && (
            <InfoStep
              errors={errors}
              titulo={titulo}
              setTitulo={setTitulo}
              empresa={empresa}
              setEmpresa={setEmpresa}
              descricao={descricao}
              setDescricao={setDescricao}
              contrato={contrato}
              setContrato={setContrato}
              contratoEntries={Array.from(contratoLabelsMap.entries())}
              modalidade={modalidade}
              setModalidade={setModalidade}
              modalidadeEntries={Array.from(modalidadeLabelsMap.entries())}
              nivel={nivel}
              setNivel={setNivel}
              nivelEntries={Array.from(nivelLabelsMap.entries())}
              categoria={categoria}
              setCategoria={setCategoria}
              formCategories={formCategories}
              vagasQtd={vagasQtd}
              setVagasQtd={setVagasQtd}
            />
          )}

          {/* ═══ STEP 2: Detalhes ═══ */}
          {currentStep === "details" && (
            <DetailsStep
              tagInput={tagInput}
              setTagInput={setTagInput}
              tags={tags}
              addTag={() => addToList(tags, setTags, tagInput, setTagInput)}
              removeTag={(index) => removeFromList(tags, setTags, index)}
              reqInput={reqInput}
              setReqInput={setReqInput}
              requisitos={requisitos}
              addRequisito={() => addToList(requisitos, setRequisitos, reqInput, setReqInput)}
              removeRequisito={(index) => removeFromList(requisitos, setRequisitos, index)}
              beneficios={beneficios}
              toggleBenefit={toggleBenefit}
              benInput={benInput}
              setBenInput={setBenInput}
              addBeneficio={() => addToList(beneficios, setBeneficios, benInput, setBenInput)}
              removeBeneficioByValue={(value) =>
                setBeneficios((prev) => prev.filter((item) => item !== value))
              }
              suggestedBenefits={SUGGESTED_BENEFITS}
            />
          )}

          {currentStep === "salary" && (
            <SalaryStep
              ocultarSalario={ocultarSalario}
              setOcultarSalario={setOcultarSalario}
              salarioMin={salarioMin}
              setSalarioMin={setSalarioMin}
              salarioMax={salarioMax}
              setSalarioMax={setSalarioMax}
              salaryDisplay={salaryDisplay}
              urgente={urgente}
              setUrgente={setUrgente}
            />
          )}

          {currentStep === "location" && (
            <LocationStep
              hasActiveLocation={hasActiveLocation}
              activeLocationName={activeLocationName}
              errors={errors}
              modalidade={modalidade}
            />
          )}

          {currentStep === "contact" && (
            <ContactStep
              errors={errors}
              contatoEmail={contatoEmail}
              setContatoEmail={setContatoEmail}
              contatoWhatsapp={contatoWhatsapp}
              setContatoWhatsapp={setContatoWhatsapp}
              contatoTelefone={contatoTelefone}
              setContatoTelefone={setContatoTelefone}
              linkExterno={linkExterno}
              setLinkExterno={setLinkExterno}
            />
          )}

          {currentStep === "preview" && (
            <PreviewStep
              titulo={titulo}
              empresa={empresa}
              contratoLabel={contratoLabelsMap.get(contrato) ?? contrato}
              modalidadeLabel={modalidadeLabelsMap.get(modalidade) ?? modalidade}
              nivelLabel={nivelLabelsMap.get(nivel) ?? nivel}
              urgente={urgente}
              categoria={categoria}
              formCategories={formCategories}
              activeLocationName={activeLocationName}
              salaryDisplay={salaryDisplay}
              descricao={descricao}
              tags={tags}
              requisitos={requisitos}
              beneficios={beneficios}
              contatoEmail={contatoEmail}
              contatoWhatsapp={contatoWhatsapp}
              contatoTelefone={contatoTelefone}
              linkExterno={linkExterno}
              vagasQtd={vagasQtd}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <PublishBottomActions
        isPreview={currentStep === "preview"}
        publishing={publishing}
        isLoadingPermission={isLoadingPermission}
        canPublish={permission.canPublish}
        currentStepIndex={currentStepIndex}
        stepsLength={STEPS.length}
        onEdit={() => setCurrentStep("info")}
        onPublish={handlePublish}
        onBack={goBackToVagas}
        onNext={goNext}
      />
    </div>
  );
}



