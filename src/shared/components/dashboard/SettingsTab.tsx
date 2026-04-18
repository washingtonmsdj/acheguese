/**
 * SettingsTab
 * 
 * Aba de configurações completa da empresa.
 * Integra todas as seções de edição de dados.
 * 
 * SSOT: Usa componentes e constantes centralizadas.
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Info,
  ImageIcon,
  Phone,
  Store,
  MapPin,
  Clock,
  Settings as SettingsIcon,
  Save,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase";

// Seções
import {
  BasicInfoSection,
  VisualIdentitySection,
  ContactSection,
  ServiceSection,
  LocationSection,
  OpeningHoursSection,
  AdvancedSection,
} from "@/core/business/components/settings/sections";

interface SettingsTabProps {
  businessId: string;
  onEditBusiness?: () => void;
}

type SectionId =
  | "basic"
  | "visual"
  | "contact"
  | "service"
  | "location"
  | "hours"
  | "advanced";

interface Section {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const SECTIONS: Section[] = [
  {
    id: "basic",
    label: "Informações Básicas",
    icon: Info,
    description: "Nome, categoria, descrição",
  },
  {
    id: "visual",
    label: "Identidade Visual",
    icon: ImageIcon,
    description: "Logo, banner, fotos",
  },
  {
    id: "contact",
    label: "Contato",
    icon: Phone,
    description: "Telefone, email, redes sociais",
  },
  {
    id: "service",
    label: "Atendimento",
    icon: Store,
    description: "Modos, pagamentos, facilidades",
  },
  {
    id: "location",
    label: "Localização",
    icon: MapPin,
    description: "Endereço completo",
  },
  {
    id: "hours",
    label: "Horários",
    icon: Clock,
    description: "Funcionamento semanal",
  },
  {
    id: "advanced",
    label: "Avançado",
    icon: SettingsIcon,
    description: "Status, visibilidade, SEO",
  },
];

export function SettingsTab({ businessId, onEditBusiness }: SettingsTabProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("basic");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Estado dos dados da empresa
  const [businessData, setBusinessData] = useState<any>({
    // Basic Info
    name: "",
    slug: "",
    category: "",
    subcategoria: "",
    description: "",

    // Visual Identity
    logo_url: null,
    banner_url: null,
    fotos: [],

    // Contact
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    tiktok: "",
    youtube: "",

    // Service
    modos_atendimento: [],
    areas_entrega: [],
    formas_pagamento: [],
    facilidades: [],
    especialidades: [],

    // Location
    street: "",
    number: "",
    complement: "",
    postal_code: "",
    neighborhood: "",
    city: "",
    state: "",
    latitude: null,
    longitude: null,

    // Opening Hours
    horario_funcionamento: {},

    // Advanced
    status: "active",
    visibility: "public",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    allow_reviews: true,
    allow_messages: true,
    show_contact_info: true,
  });

  // Carregar dados da empresa
  useEffect(() => {
    loadBusinessData();
  }, [businessId]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

      if (error) throw error;

      if (data) {
        setBusinessData({
          ...businessData,
          ...data,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados da empresa:", error);
      toast.error("Erro ao carregar dados da empresa");
    } finally {
      setLoading(false);
    }
  };

  // Handlers de mudança por seção
  const handleBasicInfoChange = (data: any) => {
    setBusinessData((prev: any) => ({ ...prev, ...data }));
    setHasChanges(true);
  };

  const handleVisualIdentityChange = (data: any) => {
    setBusinessData((prev: any) => ({ ...prev, ...data }));
    setHasChanges(true);
  };

  const handleContactChange = (data: any) => {
    setBusinessData((prev: any) => ({ ...prev, ...data }));
    setHasChanges(true);
  };

  const handleServiceChange = (data: any) => {
    setBusinessData((prev: any) => ({ ...prev, ...data }));
    setHasChanges(true);
  };

  const handleLocationChange = (data: any) => {
    setBusinessData((prev: any) => ({ ...prev, ...data }));
    setHasChanges(true);
  };

  const handleOpeningHoursChange = (data: any) => {
    setBusinessData((prev: any) => ({ ...prev, horario_funcionamento: data }));
    setHasChanges(true);
  };

  const handleAdvancedChange = (data: any) => {
    setBusinessData((prev: any) => ({ ...prev, ...data }));
    setHasChanges(true);
  };

  // Upload de imagens
  const handleImageUpload = async (
    file: File,
    type: "logo" | "banner" | "gallery"
  ): Promise<string> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${businessId}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("business-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("business-images").getPublicUrl(fileName);

      toast.success("Imagem enviada com sucesso!");
      return publicUrl;
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar imagem");
      throw error;
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    try {
      setSaving(true);

      // Validações básicas
      if (!businessData.name || !businessData.slug || !businessData.category) {
        toast.error("Preencha os campos obrigatórios");
        setActiveSection("basic");
        return;
      }

      const { error } = await supabase
        .from("businesses")
        .update({
          name: businessData.name,
          slug: businessData.slug,
          category: businessData.category,
          subcategoria: businessData.subcategoria,
          description: businessData.description,
          logo_url: businessData.logo_url,
          banner_url: businessData.banner_url,
          fotos: businessData.fotos,
          phone: businessData.phone,
          whatsapp: businessData.whatsapp,
          email: businessData.email,
          website: businessData.website,
          instagram: businessData.instagram,
          facebook: businessData.facebook,
          twitter: businessData.twitter,
          linkedin: businessData.linkedin,
          tiktok: businessData.tiktok,
          youtube: businessData.youtube,
          modos_atendimento: businessData.modos_atendimento,
          areas_entrega: businessData.areas_entrega,
          formas_pagamento: businessData.formas_pagamento,
          facilidades: businessData.facilidades,
          especialidades: businessData.especialidades,
          street: businessData.street,
          number: businessData.number,
          complement: businessData.complement,
          postal_code: businessData.postal_code,
          neighborhood: businessData.neighborhood,
          city: businessData.city,
          state: businessData.state,
          latitude: businessData.latitude,
          longitude: businessData.longitude,
          horario_funcionamento: businessData.horario_funcionamento,
          status: businessData.status,
          visibility: businessData.visibility,
          seo_title: businessData.seo_title,
          seo_description: businessData.seo_description,
          seo_keywords: businessData.seo_keywords,
          allow_reviews: businessData.allow_reviews,
          allow_messages: businessData.allow_messages,
          show_contact_info: businessData.show_contact_info,
          updated_at: new Date().toISOString(),
        })
        .eq("id", businessId);

      if (error) throw error;

      toast.success("Alterações salvas com sucesso!");
      setHasChanges(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  // Cancelar alterações
  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("Descartar alterações não salvas?")) {
        loadBusinessData();
        setHasChanges(false);
      }
    }
  };

  // Renderizar seção ativa
  const renderActiveSection = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (activeSection) {
      case "basic":
        return (
          <BasicInfoSection
            data={{
              name: businessData.name,
              slug: businessData.slug,
              category: businessData.category,
              subcategoria: businessData.subcategoria,
              description: businessData.description,
            }}
            onChange={handleBasicInfoChange}
          />
        );

      case "visual":
        return (
          <VisualIdentitySection
            data={{
              logo_url: businessData.logo_url,
              banner_url: businessData.banner_url,
              fotos: businessData.fotos,
            }}
            onChange={handleVisualIdentityChange}
            onUpload={handleImageUpload}
          />
        );

      case "contact":
        return (
          <ContactSection
            data={{
              phone: businessData.phone,
              whatsapp: businessData.whatsapp,
              email: businessData.email,
              website: businessData.website,
              instagram: businessData.instagram,
              facebook: businessData.facebook,
              twitter: businessData.twitter,
              linkedin: businessData.linkedin,
              tiktok: businessData.tiktok,
              youtube: businessData.youtube,
            }}
            onChange={handleContactChange}
          />
        );

      case "service":
        return (
          <ServiceSection
            data={{
              modos_atendimento: businessData.modos_atendimento,
              areas_entrega: businessData.areas_entrega,
              formas_pagamento: businessData.formas_pagamento,
              facilidades: businessData.facilidades,
              especialidades: businessData.especialidades,
              category: businessData.category,
            }}
            onChange={handleServiceChange}
          />
        );

      case "location":
        return (
          <LocationSection
            data={{
              street: businessData.street,
              number: businessData.number,
              complement: businessData.complement,
              postal_code: businessData.postal_code,
              neighborhood: businessData.neighborhood,
              city: businessData.city,
              state: businessData.state,
              latitude: businessData.latitude,
              longitude: businessData.longitude,
            }}
            onChange={handleLocationChange}
          />
        );

      case "hours":
        return (
          <OpeningHoursSection
            data={businessData.horario_funcionamento}
            onChange={handleOpeningHoursChange}
          />
        );

      case "advanced":
        return (
          <AdvancedSection
            data={{
              status: businessData.status,
              visibility: businessData.visibility,
              seo_title: businessData.seo_title,
              seo_description: businessData.seo_description,
              seo_keywords: businessData.seo_keywords,
              allow_reviews: businessData.allow_reviews,
              allow_messages: businessData.allow_messages,
              show_contact_info: businessData.show_contact_info,
            }}
            onChange={handleAdvancedChange}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar de Navegação */}
      <Card className="w-64 flex-shrink-0">
        <CardContent className="p-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide mb-4">
            Configurações
          </h3>
          <nav className="space-y-1">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{section.label}</div>
                    <div
                      className={cn(
                        "text-xs mt-0.5",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {section.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra de Ações */}
        {hasChanges && (
          <Card className="mb-4 border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-sm text-amber-600">
                      Você tem alterações não salvas
                    </p>
                    <p className="text-xs text-amber-600/80 mt-0.5">
                      Salve ou descarte as alterações antes de sair
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Descartar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conteúdo da Seção */}
        <Card className="flex-1">
          <ScrollArea className="h-full">
            <CardContent className="p-6">{renderActiveSection()}</CardContent>
          </ScrollArea>
        </Card>

        {/* Botão de Salvar Fixo (quando não há mudanças) */}
        {!hasChanges && !loading && (
          <Card className="mt-4 border-emerald-500/50 bg-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-emerald-600 font-medium">
                  Todas as alterações foram salvas
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
