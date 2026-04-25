import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppUrls } from "@/core/routing/hooks"; // ✅ SSOT URLs
import {
  ArrowLeft,
  Upload,
  Loader2,
  MapPin,
  Clock,
  DollarSign,
  Phone,
  MessageCircle,
  Briefcase,
  Award,
  GraduationCap,
  Globe,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import { useToast } from "@/shared/hooks/use-toast";
import { mediaService } from "@/core/media/services/MediaService";
import { useSessionContext } from "@/core/session";
import { servicesLocationService } from "@/modules/professionals/services/services/ServicesLocationService";
import { useProfessionalCreateMultiProfile } from "@/modules/professionals/services/hooks/useProfessionalCreateMultiProfile";
import { ProfessionalSlugSection } from "@/modules/professionals/services/components/identity/ProfessionalSlugSection";
import { PublicIdentityService } from "@/core/public-identity";
import { logger } from "@/shared/utils/logger";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import {
  SERVICE_FORM_CATEGORY_OPTIONS,
  getServiceCategoryIcon,
  getServiceCategoryLabel,
} from "@/modules/professionals/services/domain/professionalCategories";
import { SERVICE_AREA_OPTIONS } from "@/modules/professionals/services/domain/serviceAreaOptions";
import type { ProfessionalCategory } from "@/core/professional/types";
import { useEffect } from "react";

// Categories for the form (excluding 'todos')
const FORM_CATEGORIES = SERVICE_FORM_CATEGORY_OPTIONS;

type Step = "info" | "details" | "contact" | "review";

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: "info", label: "Informações", icon: Briefcase },
  { key: "details", label: "Detalhes", icon: Award },
  { key: "contact", label: "Contato", icon: Phone },
  { key: "review", label: "Revisão", icon: Globe },
];

export default function CadastrarServicoPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // ✅ SSOT URLs
  const { toast } = useToast();
  const { user } = useSessionContext();
  const { setModuleContext, effectiveProfile } = useMultiProfileContext();
  const [step, setStep] = useState<Step>("info");

  // Definir contexto professional ao montar, limpar ao desmontar
  useEffect(() => {
    setModuleContext('professional');
    return () => setModuleContext(null);
  }, [setModuleContext]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const { createProfessional, isLoading: loading } = useProfessionalCreateMultiProfile({
    onSuccess: (result) => {
      // ✅ Professional não usa /u/:username
      // Redirecionar para página de sucesso ou listagem de serviços
      toast({
        title: "Serviço cadastrado com sucesso!",
        description: "Seu perfil profissional está ativo.",
      });
      navigate('/services');
    },
  });

  const [form, setForm] = useState({
    name: "",
    category: "",
    subcategory: "",
    description: "",
    serviceAreas: [] as string[],
    phone: "",
    whatsapp: "",
    availableHours: "",
    priceRange: "",
    experienceYears: "",
    education: "",
    certifications: "",
    instagram: "",
    website: "",
  });

  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const updateField = (key: string, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Auto-sugerir slug a partir do nome
    if (key === 'name' && !slugManuallyEdited) {
      setSlug(PublicIdentityService.normalize(value as string, 'professional'));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugManuallyEdited(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Imagem muito grande",
          description: "Máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleBairro = (bairro: string) => {
    setForm((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(bairro)
        ? prev.serviceAreas.filter((b) => b !== bairro)
        : [...prev.serviceAreas, bairro],
    }));
  };

  const validateStep = (s: Step): string | null => {
    switch (s) {
      case "info":
        if (!form.name.trim()) return "Informe seu nome completo";
        if (form.name.trim().length < 2)
          return "Nome deve ter pelo menos 2 caracteres";
        if (!form.category) return "Selecione uma categoria";
        if (!form.subcategory.trim()) return "Informe o título do serviço";
        return null;
      case "details":
        if (form.serviceAreas.length === 0)
          return "Selecione pelo menos um bairro";
        return null;
      case "contact":
        if (!form.phone.trim() && !form.whatsapp.trim())
          return "Informe pelo menos um telefone ou WhatsApp";
        return null;
      default:
        return null;
    }
  };

  const goToStep = (target: Step) => {
    const stepOrder: Step[] = ["info", "details", "contact", "review"];
    const currentIdx = stepOrder.indexOf(step);
    const targetIdx = stepOrder.indexOf(target);

    // Allow going back freely
    if (targetIdx < currentIdx) {
      setStep(target);
      return;
    }

    // Validate current step before advancing
    for (let i = currentIdx; i < targetIdx; i++) {
      const currentStep = stepOrder.at(i);
      if (!currentStep) {
        continue;
      }
      const err = validateStep(currentStep);
      if (err) {
        toast({ title: err, variant: "destructive" });
        setStep(currentStep);
        return;
      }
    }
    setStep(target);
  };

  const handleNext = () => {
    const order: Step[] = ["info", "details", "contact", "review"];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) {
      goToStep(order[idx + 1]);
    }
  };

  const handleBack = () => {
    const order: Step[] = ["info", "details", "contact", "review"];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
    else navigate(-1);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Faça login para cadastrar", variant: "destructive" });
      navigate(appUrls.auth.login); // ✅ SSOT
      return;
    }

    // Final validation
    for (const s of ["info", "details", "contact"] as Step[]) {
      const err = validateStep(s);
      if (err) {
        toast({ title: err, variant: "destructive" });
        setStep(s);
        return;
      }
    }

    try {
      let logoUrl: string | undefined;

      // Upload logo usando MediaService
      if (photoFile) {
        const result = await mediaService.uploadProfessionalImage(
          user.id,
          photoFile,
          "logo",
        );
        logoUrl = result.url;
      }

      const certsArray = form.certifications
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      // Criar perfil professional via MultiProfileService
      createProfessional({
        name: form.name.trim(),
        slug: slug.trim() || undefined,
        category: form.category as ProfessionalCategory,
        subcategory: form.subcategory.trim(),
        description: form.description.trim(),
        phone: form.phone.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        service_areas: form.serviceAreas,
        available_hours: form.availableHours
          ? { schedule: form.availableHours }
          : undefined,
        price_range: form.priceRange.trim() || undefined,
        experience_years: form.experienceYears
          ? parseInt(form.experienceYears)
          : undefined,
        education: form.education.trim() || undefined,
        certifications: certsArray.length > 0 ? certsArray : undefined,
        instagram: form.instagram.trim() || undefined,
        website: form.website.trim() || undefined,
        logo_url: logoUrl,
        location_id: servicesLocationService.getActiveLocationId() ?? undefined,
        city: servicesLocationService.getActiveLocationName() ?? "",
        neighborhood: form.serviceAreas[0] || "",
      });
    } catch (err: any) {
      logger.error("Error creating professional:", err);
      toast({
        title: "Erro ao cadastrar",
        description: err.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);
  const getCategoryLabel = (id: string) =>
    getServiceCategoryLabel(id) || id;
  const getCategoryIcon = (id: string) => getServiceCategoryIcon(id);

  return (
    <div className="flex flex-col pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button
          onClick={handleBack}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold font-display">Cadastrar Serviço</h1>
          <p className="text-xs text-muted-foreground">
            Etapa {currentStepIdx + 1} de {STEPS.length}
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="px-4 pt-4 pb-2">
        {/* Autoria explícita */}
        {effectiveProfile && (
          <ActiveProfileBadge profile={effectiveProfile} action="cadastrando serviço como" className="mb-3" />
        )}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <button
                onClick={() => goToStep(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : i < currentStepIdx
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 rounded ${i < currentStepIdx ? "bg-primary/40" : "bg-border"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* STEP 1: Informações Básicas */}
        {step === "info" && (
          <>
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-2">
              <label className="cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-primary group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-secondary border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center group-hover:border-primary transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">
                      Sua foto
                    </span>
                  </div>
                )}
              </label>
              <span className="text-xs text-muted-foreground">
                Toque para adicionar foto
              </span>
            </div>

            <div className="space-y-1.5">
              <Label>
                Nome completo <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Seu nome"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Categoria do serviço <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {FORM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icone} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Título do serviço <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.subcategory}
                onChange={(e) => updateField("subcategory", e.target.value)}
                placeholder="Ex: Eletricista residencial e predial"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrição do serviço</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Descreva seus serviços, experiência, diferenciais, qualificações..."
                rows={4}
                maxLength={2000}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                {form.description.length}/2000
              </p>
            </div>

            <ProfessionalSlugSection
              slug={slug}
              onSlugChange={handleSlugChange}
            />
          </>
        )}

        {/* STEP 2: Detalhes Profissionais */}
        {step === "details" && (
          <>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Bairros onde atende <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Selecione os bairros onde você presta serviços
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-card">
                {SERVICE_AREA_OPTIONS.map((bairro) => (
                  <label
                    key={bairro}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors"
                  >
                    <Checkbox
                      checked={form.serviceAreas.includes(bairro)}
                      onCheckedChange={() => toggleBairro(bairro)}
                    />
                    {bairro}
                  </label>
                ))}
              </div>
              {form.serviceAreas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.serviceAreas.map((b) => (
                    <Badge
                      key={b}
                      variant="secondary"
                      className="text-xs gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      {b}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Anos de experiência
                </Label>
                <Input
                  type="number"
                  value={form.experienceYears}
                  onChange={(e) =>
                    updateField("experienceYears", e.target.value)
                  }
                  placeholder="Ex: 5"
                  min="0"
                  max="50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Faixa de preço
                </Label>
                <Input
                  value={form.priceRange}
                  onChange={(e) => updateField("priceRange", e.target.value)}
                  placeholder="Ex: R$ 80 - R$ 200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário de atendimento
              </Label>
              <Input
                value={form.availableHours}
                onChange={(e) => updateField("availableHours", e.target.value)}
                placeholder="Ex: Seg a Sex, 8h às 18h"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Formação / Qualificação
              </Label>
              <Input
                value={form.education}
                onChange={(e) => updateField("education", e.target.value)}
                placeholder="Ex: Curso técnico em elétrica"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Certificações
              </Label>
              <Input
                value={form.certifications}
                onChange={(e) => updateField("certifications", e.target.value)}
                placeholder="Separadas por vírgula (ex: NR-10, CREA)"
              />
              <p className="text-[10px] text-muted-foreground">
                Separe cada certificação com vírgula
              </p>
            </div>
          </>
        )}

        {/* STEP 3: Contato e Redes */}
        {step === "contact" && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Informações de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(21) 99999-9999"
                    type="tel"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-success" />
                    WhatsApp
                  </Label>
                  <Input
                    value={form.whatsapp}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                    placeholder="(21) 99999-9999"
                    type="tel"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Informe pelo menos um telefone ou WhatsApp para contato
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Redes Sociais (opcional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Instagram</Label>
                  <Input
                    value={form.instagram}
                    onChange={(e) => updateField("instagram", e.target.value)}
                    placeholder="@seuperfil"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://seusite.com"
                    type="url"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* STEP 4: Review */}
        {step === "review" && (
          <>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Revise seu cadastro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview Card */}
                <div className="flex items-start gap-3">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                      {getCategoryIcon(form.category)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold">{form.name || "Seu nome"}</h3>
                    <p className="text-sm text-primary font-medium">
                      {form.subcategory || "Título do serviço"}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {getCategoryIcon(form.category)}{" "}
                      {getCategoryLabel(form.category)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {form.description && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Descrição
                    </p>
                    <p className="text-sm">{form.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {form.experienceYears && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Experiência
                      </p>
                      <p className="font-medium">{form.experienceYears} anos</p>
                    </div>
                  )}
                  {form.priceRange && (
                    <div>
                      <p className="text-xs text-muted-foreground">Preço</p>
                      <p className="font-medium">{form.priceRange}</p>
                    </div>
                  )}
                  {form.availableHours && (
                    <div>
                      <p className="text-xs text-muted-foreground">Horário</p>
                      <p className="font-medium">{form.availableHours}</p>
                    </div>
                  )}
                  {form.education && (
                    <div>
                      <p className="text-xs text-muted-foreground">Formação</p>
                      <p className="font-medium">{form.education}</p>
                    </div>
                  )}
                </div>

                {form.serviceAreas.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Bairros atendidos
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {form.serviceAreas.map((b) => (
                        <Badge key={b} variant="secondary" className="text-xs">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {form.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium">{form.phone}</p>
                    </div>
                  )}
                  {form.whatsapp && (
                    <div>
                      <p className="text-xs text-muted-foreground">WhatsApp</p>
                      <p className="font-medium">{form.whatsapp}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-center">
              Ao cadastrar, seu perfil profissional ficará disponível para a
              comunidade.
            </p>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-2">
          {step !== "info" && (
            <Button variant="outline" className="flex-1" onClick={handleBack}>
              Voltar
            </Button>
          )}

          {step !== "review" ? (
            <Button className="flex-1" onClick={handleNext}>
              Próximo
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cadastrar Serviço
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


