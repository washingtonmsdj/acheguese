import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Save,
  Camera,
  Trash2,
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
import { Switch } from "@/shared/components/ui/switch";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/hooks/use-toast";
import { mediaService } from "@/core/media/services/MediaService";
import { useSessionContext } from "@/core/session";
import { useProfessionalById } from "@/modules/professionals/services/hooks/useProfessionalById";
import { useProfessionalEdit } from "@/modules/professionals/services/hooks/useProfessionalEdit";
import { useServiceUrls } from "@/modules/professionals/services/hooks/useServiceUrls";
import { ProfessionalSlugSection } from "@/modules/professionals/services/components/identity/ProfessionalSlugSection";
import { useProfessionalSlugSaveGuard } from "@/modules/professionals/services/components/identity/useProfessionalSlugSaveGuard";
import { IdentityChangeConfirmDialog } from "@/core/public-identity/components/IdentityChangeConfirmDialog";
import { useIdentitySaveLogger } from "@/core/public-identity/hooks/useIdentitySaveLogger";
import { SERVICE_FORM_CATEGORY_OPTIONS } from "@/modules/professionals/services/domain/professionalCategories";
import { SERVICE_AREA_OPTIONS } from "@/modules/professionals/services/domain/serviceAreaOptions";
import type { UpdateProfessionalInput } from "@/core/professional/types";
import type { ProfessionalCategory } from "@/core/professional/types";

const FORM_CATEGORIES = SERVICE_FORM_CATEGORY_OPTIONS;

type Tab = "info" | "details" | "contact" | "portfolio" | "availability";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "info", label: "Informações", icon: Briefcase },
  { key: "details", label: "Detalhes", icon: Award },
  { key: "contact", label: "Contato", icon: Phone },
  { key: "portfolio", label: "Portfólio", icon: Camera },
  { key: "availability", label: "Horários", icon: Clock },
];

export default function EditarServicoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serviceUrls = useServiceUrls();
  const { toast } = useToast();
  const { user } = useSessionContext();
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const {
    professional,
    loading: loadingProfessional,
    error: loadError,
  } = useProfessionalById({
    id: id || "",
    enabled: !!id,
  });

  const { updateProfessional } = useProfessionalEdit({
    onSuccess: () => {
      toast({ title: "Perfil profissional atualizado com sucesso!" });
      setHasChanges(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
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
    email: "",
    availableHours: "",
    priceRange: "",
    experienceYears: "",
    education: "",
    certifications: "",
    instagram: "",
    website: "",
    isAcceptingClients: true,
  });

  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const identityEntityId = professional?.professional_data_id ?? "";

  const { logAttempt, logSuccess, logError } = useIdentitySaveLogger({
    entityType: 'professional',
    entityId: identityEntityId,
    userId: user?.id ?? "",
    page: 'EditarServicoPage',
  });

  // Populate form when professional data loads
  useEffect(() => {
    if (professional) {
      setForm({
        name: professional.name || "",
        category: professional.category || "",
        subcategory: professional.subcategory || "",
        description: professional.description || "",
        serviceAreas: professional.service_areas || [],
        phone: professional.phone || "",
        whatsapp: professional.whatsapp || "",
        email: professional.email || "",
        availableHours: professional.available_hours?.schedule || "",
        priceRange: professional.price_range || "",
        experienceYears: professional.experience_years?.toString() || "",
        education: professional.education || "",
        certifications: professional.certifications?.join(", ") || "",
        instagram: professional.instagram || "",
        website: professional.website || "",
        isAcceptingClients: professional.is_accepting_clients ?? true,
      });
      if (professional.logo_url) {
        setPhotoPreview(professional.logo_url);
      }
      const savedSlug = professional.slug || "";
      setSlug(savedSlug);
      setOriginalSlug(savedSlug);
      if (
        professional.portfolio_images &&
        professional.portfolio_images.length > 0
      ) {
        setPortfolioPreviews(professional.portfolio_images);
      }
    }
  }, [professional]);

  const updateField = (key: string, value: string | string[] | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleBairro = (bairro: string) => {
    setForm((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(bairro)
        ? prev.serviceAreas.filter((b) => b !== bairro)
        : [...prev.serviceAreas, bairro],
    }));
    setHasChanges(true);
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setHasChanges(true);
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
      setHasChanges(true);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxTotal = 10;
    const currentCount = portfolioPreviews.length + portfolioFiles.length;
    const allowedFiles = files.slice(0, maxTotal - currentCount);

    if (allowedFiles.length < files.length) {
      toast({
        title: `Máximo ${maxTotal} imagens no portfólio`,
        variant: "destructive",
      });
    }

    const validFiles = allowedFiles.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        toast({
          title: `${f.name} é muito grande (máx 5MB)`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolioPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPortfolioFiles((prev) => [...prev, ...validFiles]);
    setHasChanges(true);
  };

  const removePortfolioImage = (index: number) => {
    // If this is an existing URL (not a newly added file)
    const existingCount = (professional?.portfolio_images || []).length;
    if (index < existingCount) {
      setPortfolioPreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      const fileIndex = index - existingCount;
      setPortfolioFiles((prev) => prev.filter((_, i) => i !== fileIndex));
      setPortfolioPreviews((prev) => prev.filter((_, i) => i !== index));
    }
    setHasChanges(true);
  };

  const doSave = async () => {
    if (!user || !id) return;

    // Basic validation
    if (!form.name.trim()) {
      toast({ title: "Informe seu nome completo", variant: "destructive" });
      setActiveTab("info");
      return;
    }
    if (!form.category) {
      toast({ title: "Selecione uma categoria", variant: "destructive" });
      setActiveTab("info");
      return;
    }

    const hasSlugChange = !!originalSlug && slug !== originalSlug;
    if (hasSlugChange) {
      logAttempt(originalSlug, slug);
    }

    setSaving(true);
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

      // Upload new portfolio images usando MediaService
      const existingPortfolioUrls = (
        professional?.portfolio_images || []
      ).filter(
        (_, i) => {
          const previewAtIndex = portfolioPreviews.at(i);
          return !!previewAtIndex && !previewAtIndex.startsWith("data:");
        },
      );
      const newPortfolioUrls: string[] = [];

      for (const file of portfolioFiles) {
        const result = await mediaService.uploadProfessionalImage(
          user.id,
          file,
          "portfolio",
        );
        newPortfolioUrls.push(result.url);
      }

      // Build final portfolio: keep existing URLs that weren't removed + new uploads
      const finalPortfolio = [
        ...portfolioPreviews.filter((p) => !p.startsWith("data:")),
        ...newPortfolioUrls,
      ];

      const certsArray = form.certifications
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const updateData: UpdateProfessionalInput = {
        name: form.name.trim(),
        category: form.category as ProfessionalCategory,
        ...(hasSlugChange ? { slug: slug.trim() } : {}),
        subcategory: form.subcategory.trim() || undefined,
        description: form.description.trim() || undefined,
        phone: form.phone.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
        service_areas: form.serviceAreas,
        available_hours: form.availableHours
          ? { schedule: form.availableHours }
          : undefined,
        price_range: form.priceRange.trim() || undefined,
        experience_years: form.experienceYears
          ? parseInt(form.experienceYears)
          : undefined,
        education: form.education.trim() || undefined,
        certifications: certsArray,
        instagram: form.instagram.trim() || undefined,
        website: form.website.trim() || undefined,
        is_accepting_clients: form.isAcceptingClients,
        portfolio_images: finalPortfolio,
        ...(logoUrl && { logo_url: logoUrl }),
      };

      await updateProfessional(id, updateData);
      
      if (hasSlugChange) {
        logSuccess(originalSlug, slug);
      }
      
      setPhotoFile(null);
      setPortfolioFiles([]);
    } catch (err: any) {
      if (hasSlugChange) {
        logError(originalSlug, slug, err.message || 'Erro ao salvar', err.code);
      }
      // Error handled by hook onError
    } finally {
      setSaving(false);
    }
  };

  const { triggerSave: handleSave, confirmProps: slugConfirmProps } = useProfessionalSlugSaveGuard({
    slug,
    originalSlug,
    onSave: doSave,
  });

  // Loading state
  if (loadingProfessional) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-24 rounded-2xl mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // Error / not found
  if (loadError || !professional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <p className="text-muted-foreground mb-4">
          {loadError?.message || "Profissional não encontrado"}
        </p>
        <Button variant="outline" onClick={() => navigate(serviceUrls.list)}>
          Voltar para Serviços
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background z-10">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold font-display">
          Editar Perfil Profissional
        </h1>
        {hasChanges && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Alterações pendentes
          </Badge>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* === INFO TAB === */}
        {activeTab === "info" && (
          <div className="space-y-6">
            {/* Photo */}
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden border-2 border-border">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Foto"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-lg">
                      <Upload className="h-4 w-4 text-primary-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique para alterar a foto
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Profissional *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => updateField("category", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icone}</span>
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcategory">Título do Serviço</Label>
                  <Input
                    id="subcategory"
                    value={form.subcategory}
                    onChange={(e) => updateField("subcategory", e.target.value)}
                    placeholder="Ex: Eletricista Residencial"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Descreva seus serviços, experiência e diferenciais..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.description.length}/2000
                  </p>
                </div>
              </CardContent>
            </Card>

            <ProfessionalSlugSection
              slug={slug}
              onSlugChange={handleSlugChange}
              originalSlug={originalSlug}
              professionalId={professional.professional_data_id}
            />
            <IdentityChangeConfirmDialog {...slugConfirmProps} />
          </div>
        )}

        {/* === DETAILS TAB === */}
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Experience & Education */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Experiência e Formação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="experienceYears">Anos de Experiência</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min="0"
                    max="50"
                    value={form.experienceYears}
                    onChange={(e) =>
                      updateField("experienceYears", e.target.value)
                    }
                    placeholder="Ex: 5"
                  />
                </div>

                <div>
                  <Label htmlFor="education">Formação</Label>
                  <Input
                    id="education"
                    value={form.education}
                    onChange={(e) => updateField("education", e.target.value)}
                    placeholder="Ex: Técnico em Eletrotécnica"
                  />
                </div>

                <div>
                  <Label htmlFor="certifications">Certificações</Label>
                  <Input
                    id="certifications"
                    value={form.certifications}
                    onChange={(e) =>
                      updateField("certifications", e.target.value)
                    }
                    placeholder="Separe por vírgula"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ex: NR-10, NR-35, CREA
                  </p>
                </div>

                <div>
                  <Label htmlFor="priceRange">Faixa de Preço</Label>
                  <Select
                    value={form.priceRange}
                    onValueChange={(v) => updateField("priceRange", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a faixa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ - Econômico</SelectItem>
                      <SelectItem value="$$">$$ - Moderado</SelectItem>
                      <SelectItem value="$$$">$$$ - Premium</SelectItem>
                      <SelectItem value="$$$$">$$$$ - Luxo</SelectItem>
                      <SelectItem value="negociavel">Negociável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Service Areas */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Áreas de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_AREA_OPTIONS.map((bairro) => {
                    const selected = form.serviceAreas.includes(bairro);
                    return (
                      <Badge
                        key={bairro}
                        variant={selected ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-secondary"
                        }`}
                        onClick={() => toggleBairro(bairro)}
                      >
                        {bairro}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {form.serviceAreas.length} bairro(s) selecionado(s)
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === CONTACT TAB === */}
        {activeTab === "contact" && (
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Dados de Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(21) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                    placeholder="(21) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Redes Sociais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={form.instagram}
                    onChange={(e) => updateField("instagram", e.target.value)}
                    placeholder="@seuperfil"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={form.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    placeholder="https://seusite.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === PORTFOLIO TAB === */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  Portfólio de Trabalhos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Adicione fotos dos seus trabalhos para mostrar a qualidade do
                  seu serviço. Máximo de 10 imagens.
                </p>

                {/* Existing + New Portfolio Images */}
                <div className="grid grid-cols-3 gap-3">
                  {portfolioPreviews.map((preview, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img
                        src={preview}
                        alt={`Portfólio ${i + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePortfolioImage(i)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add button */}
                  {portfolioPreviews.length < 10 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground mt-1">
                        Adicionar
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePortfolioAdd}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {portfolioPreviews.length}/10 imagens • Máximo 5MB por imagem
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === AVAILABILITY TAB === */}
        {activeTab === "availability" && (
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Disponibilidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-sm">
                      Aceitando novos clientes
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {form.isAcceptingClients
                        ? "Seu perfil está visível para novos clientes"
                        : "Seu perfil está oculto para novos clientes"}
                    </p>
                  </div>
                  <Switch
                    checked={form.isAcceptingClients}
                    onCheckedChange={(v) =>
                      updateField("isAcceptingClients", v)
                    }
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="availableHours">Horário de Atendimento</Label>
                  <Textarea
                    id="availableHours"
                    value={form.availableHours}
                    onChange={(e) =>
                      updateField("availableHours", e.target.value)
                    }
                    placeholder="Ex: Seg-Sex: 8h às 18h&#10;Sáb: 8h às 12h"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30 border">
              <CardHeader>
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Zona de Perigo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Desativar seu perfil profissional irá ocultá-lo de todos os
                  resultados de busca.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    updateField("isAcceptingClients", false);
                    toast({
                      title:
                        "Perfil marcado como inativo. Salve para confirmar.",
                    });
                  }}
                >
                  Desativar Perfil
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Fixed Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4 z-20">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
