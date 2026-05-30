import React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminBusinessService } from "@/core/admin/services";
import { useSessionContext } from "@/core/session";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Clock, Lightbulb, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { DRIVER_STATUS } from "@/shared/types/constants";
import { profileService } from "@/core/profiles/services";
import { InlineFieldError } from "@/shared/components/ui/InlineFieldError";
import {
  BUSINESS_CATEGORIES,
  updateBusinessSchema,
  type UpdateBusinessInput,
} from "@/shared/schemas/business/businessSchemas";
import { CATEGORY_CONFIGS } from "@/modules/business/config/categoryFilters";

export interface BizEditData {
  id: string;
  name: string;
  description: string;
  category: string;
  address: string;
  neighborhood: string;
  phone: string;
  whatsapp: string;
  schedule: string;
  schedule_fechamento?: string;
  email: string;
  instagram: string;
  facebook: string;
  website: string;
  logo: string;
  capa: string;
  formas_pagamento: string[];
  especialidades: string[];
  facilidades: string[];
  ano_fundacao: number | null;
  latitude: number | null;
  longitude: number | null;
  modos_atendimento?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  biz?: BizEditData;
  onSaved: (updated: BizEditData) => void;
  mode?: "edit" | "create";
}

const CATEGORY_OPTIONS = BUSINESS_CATEGORIES.map((id) => ({
  id,
  label: getRecordValue(CATEGORY_CONFIGS, id)?.label ?? id,
}));

const MODOS = [
  { id: "presencial", label: "Presencial" },
  { id: "delivery", label: "Delivery" },
  { id: "domicilio", label: "A domicílio" },
  { id: DRIVER_STATUS.ONLINE, label: "Online" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold font-display pt-3 pb-1 border-b border-border/50">
      {children}
    </h3>
  );
}

const emptyBiz: BizEditData = {
  id: "",
  name: "",
  description: "",
  category: "outros",
  address: "",
  neighborhood: "",
  phone: "",
  whatsapp: "",
  schedule: "",
  schedule_fechamento: "",
  email: "",
  instagram: "",
  facebook: "",
  website: "",
  logo: "",
  capa: "",
  formas_pagamento: [],
  especialidades: [],
  facilidades: [],
  ano_fundacao: null,
  latitude: null,
  longitude: null,
  modos_atendimento: ["presencial"],
};

// Helper para mapear BizEditData para UpdateBusinessInput
function mapBizToDefaultValues(biz: BizEditData | undefined): Partial<UpdateBusinessInput> {
  if (!biz) return {};
  return {
    name: biz.name,
    description: biz.description,
    category: biz.category as UpdateBusinessInput['category'],
    phone: biz.phone,
    whatsapp: biz.whatsapp,
    email: biz.email,
    website: biz.website,
    address: biz.address,
    neighborhood: biz.neighborhood,
    instagram: biz.instagram,
    facebook: biz.facebook,
    latitude: biz.latitude ?? undefined,
    longitude: biz.longitude ?? undefined,
  };
}

export default function EmpresaEditSheet({
  open,
  onOpenChange,
  biz,
  onSaved,
  mode = "edit",
}: Props) {
  const { user, activeProfile } = useSessionContext();
  const [saving, setSaving] = useState(false);

  // Campos fora do schema (arrays, files, etc)
  const [schedule, setSchedule] = useState("");
  const [scheduleFechamento, setScheduleFechamento] = useState<string | null>(null);
  const [modosAtendimento, setModosAtendimento] = useState<string[]>(["presencial"]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<string[]>([]);
  const [facilidades, setFacilidades] = useState<string[]>([]);
  const [logo, setLogo] = useState("");
  const [capa, setCapa] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [anoFundacao, setAnoFundacao] = useState<number | null>(null);
  const [address, setAddress] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateBusinessInput>({
    resolver: zodResolver(updateBusinessSchema),
    mode: "onBlur",
    defaultValues: mapBizToDefaultValues(biz),
  });

  const watchName = watch("name");
  const watchCategory = watch("category");

  useEffect(() => {
    if (open) {
      reset(mapBizToDefaultValues(biz));
      // Sincronizar campos fora do schema
      if (biz) {
        setSchedule(biz.schedule ?? "");
        setScheduleFechamento(biz.schedule_fechamento ?? null);
        setModosAtendimento(biz.modos_atendimento ?? ["presencial"]);
        setEspecialidades(biz.especialidades ?? []);
        setFormasPagamento(biz.formas_pagamento ?? []);
        setFacilidades(biz.facilidades ?? []);
        setLogo(biz.logo ?? "");
        setCapa(biz.capa ?? "");
        setInstagram(biz.instagram ?? "");
        setFacebook(biz.facebook ?? "");
        setAnoFundacao(biz.ano_fundacao ?? null);
        setAddress(biz.address ?? "");
      } else {
        setSchedule("");
        setScheduleFechamento(null);
        setModosAtendimento(["presencial"]);
        setEspecialidades([]);
        setFormasPagamento([]);
        setFacilidades([]);
        setLogo("");
        setCapa("");
        setInstagram("");
        setFacebook("");
        setAnoFundacao(null);
        setAddress("");
      }
    }
  }, [open, biz, reset]);

  const toggleModo = (modo: string) => {
    const current = modosAtendimento;
    if (current.includes(modo)) {
      if (current.length <= 1) return;
      setModosAtendimento(current.filter((m) => m !== modo));
    } else {
      setModosAtendimento([...current, modo]);
    }
  };

  const arrayValue = (arr: string[]) => arr.join(", ");
  const parseArray = (val: string) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const onValid = async (data: UpdateBusinessInput) => {
    if (mode === "create") {
      if (
        !address.trim() &&
        !modosAtendimento.every((m) => m === DRIVER_STATUS.ONLINE)
      ) {
        toast.error("Endereço é obrigatório para empresas presenciais");
        return;
      }
    }

    setSaving(true);

    const payload = {
      ...data,
      address,
      instagram,
      facebook,
      schedule: schedule.trim(),
      schedule_fechamento: scheduleFechamento?.trim() || null,
      formas_pagamento: formasPagamento,
      especialidades: especialidades,
      facilidades: facilidades,
      ano_fundacao: anoFundacao,
      modos_atendimento: modosAtendimento,
      logo_url: logo.trim() || undefined,
      banner_url: capa.trim() || undefined,
    };

    if (mode === "create") {
      if (!user) {
        toast.error("Faça login primeiro");
        setSaving(false);
        return;
      }

      if (!activeProfile?.id) {
        toast.error("Perfil ativo não encontrado");
        setSaving(false);
        return;
      }

      try {
        const profile = await adminBusinessService.createBusinessProfile(
          {
            name: data.name?.trim() ?? "",
            bio: data.description?.trim() ?? "",
            avatar_url: logo.trim() || null,
            phone: data.phone?.trim() || null,
          },
          payload,
          activeProfile.id,
        );

        toast.success("Empresa cadastrada. Aguarde aprovação pela equipe.");
        onSaved({
          id: profile.id,
          name: data.name ?? "",
          description: data.description ?? "",
          category: data.category ?? "outros",
          address,
          neighborhood: data.neighborhood ?? "",
          phone: data.phone ?? "",
          whatsapp: data.whatsapp ?? "",
          schedule,
          schedule_fechamento: scheduleFechamento,
          email: data.email ?? "",
          instagram,
          facebook,
          website: data.website ?? "",
          logo,
          capa,
          formas_pagamento: formasPagamento,
          especialidades,
          facilidades,
          ano_fundacao: anoFundacao,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          modos_atendimento: modosAtendimento,
        });
        onOpenChange(false);
        reset();
      } catch (error) {
        toast.error(`Erro ao cadastrar: ${(error as Error).message}`);
      }
    } else {
      // Modo edição: update profiles E business_profiles

      // 1. Atualizar profiles (name, bio, avatar, phone, whatsapp)
      if (biz?.id) {
        await profileService.updateProfile(biz.id, {
          name: data.name?.trim() ?? "",
          bio: data.description?.trim() ?? "",
          avatar_url: logo.trim() || null,
          phone: data.phone?.trim() || null,
          whatsapp: data.whatsapp?.trim() || null,
        });

        // 2. Atualizar business_profiles (usando profile_id)
        try {
          await adminBusinessService.updateBusinessProfile(biz.id, payload);
          toast.success("Informações atualizadas.");
          onSaved({
            id: biz.id,
            name: data.name ?? biz.name,
            description: data.description ?? biz.description,
            category: data.category ?? biz.category,
            address,
            neighborhood: data.neighborhood ?? biz.neighborhood,
            phone: data.phone ?? biz.phone,
            whatsapp: data.whatsapp ?? biz.whatsapp,
            schedule,
            schedule_fechamento: scheduleFechamento,
            email: data.email ?? biz.email,
            instagram,
            facebook,
            website: data.website ?? biz.website,
            logo,
            capa,
            formas_pagamento: formasPagamento,
            especialidades,
            facilidades,
            ano_fundacao: anoFundacao,
            latitude: data.latitude ?? biz.latitude,
            longitude: data.longitude ?? biz.longitude,
            modos_atendimento: modosAtendimento,
          });
          onOpenChange(false);
          reset();
        } catch (error) {
          toast.error(`Erro ao salvar: ${(error as Error).message}`);
        }
      }
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-lg font-display">
            {mode === "create" ? "Cadastrar empresa" : "Editar empresa"}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(90vh-120px)] px-4">
          <form onSubmit={handleSubmit(onValid)} className="space-y-3 pb-4">
            <SectionTitle>Dados básicos</SectionTitle>
            <Field label="Nome *">
              <Input {...register("name")} />
              <InlineFieldError message={errors.name?.message} />
            </Field>
            <Field label="Categoria">
              <select
                {...register("category")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORY_OPTIONS.map((categoryOption) => (
                  <option key={categoryOption.id} value={categoryOption.id}>
                    {categoryOption.label}
                  </option>
                ))}
              </select>
              <InlineFieldError message={errors.category?.message} />
            </Field>
            <Field label="Descrição">
              <Textarea {...register("description")} rows={3} />
              <InlineFieldError message={errors.description?.message} />
            </Field>

            <SectionTitle>Modos de atendimento</SectionTitle>
            <p className="text-xs text-muted-foreground">
              Selecione como sua empresa atende os clientes:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MODOS.map((m) => {
                const active = modosAtendimento.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModo(m.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all",
                      active
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border text-muted-foreground",
                    )}
                  >
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <SectionTitle>Endereço</SectionTitle>
            <Field label="Endereço">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>
            <Field label="Bairro">
              <Input {...register("neighborhood")} />
              <InlineFieldError message={errors.neighborhood?.message} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude">
                <Input
                  type="number"
                  step="any"
                  {...register("latitude", { valueAsNumber: true })}
                />
                <InlineFieldError message={errors.latitude?.message} />
              </Field>
              <Field label="Longitude">
                <Input
                  type="number"
                  step="any"
                  {...register("longitude", { valueAsNumber: true })}
                />
                <InlineFieldError message={errors.longitude?.message} />
              </Field>
            </div>

            <SectionTitle>📞 Contato</SectionTitle>
            <Field label="Telefone">
              <Input {...register("phone")} placeholder="(71) 3333-5555" />
              <InlineFieldError message={errors.phone?.message} />
            </Field>
            <Field label="WhatsApp">
              <Input {...register("whatsapp")} placeholder="5571999999999" />
              <InlineFieldError message={errors.whatsapp?.message} />
            </Field>
            <Field label="E-mail">
              <Input type="email" {...register("email")} placeholder="contato@business.com" />
              <InlineFieldError message={errors.email?.message} />
            </Field>
            <Field label="Website">
              <Input {...register("website")} placeholder="www.business.com.br" />
              <InlineFieldError message={errors.website?.message} />
            </Field>
            <Field label="Instagram">
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@user"
              />
            </Field>
            <Field label="Facebook">
              <Input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </Field>

            <SectionTitle>
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Horários e Serviços
              </span>
            </SectionTitle>
            <Field label="Horário de funcionamento">
              <Textarea
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Seg-Sex: 8h-18h&#10;Sábado: 8h-12h&#10;Domingo: Fechado"
                rows={4}
              />
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
                <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>Dica: Use uma linha por dia. Ex: "Seg-Sex: 8h-18h"</span>
              </p>
            </Field>
            <Field label="Horário de fechamento hoje (HH:MM)">
              <Input
                value={scheduleFechamento ?? ""}
                onChange={(e) => setScheduleFechamento(e.target.value)}
                placeholder="18:00"
                maxLength={5}
              />
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground mt-1">
                <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                <span>Usado para mostrar "Fecha às 18:00" quando aberto</span>
              </p>
            </Field>
            <Field label="Especialidades (separar por vírgula)">
              <Textarea
                value={arrayValue(especialidades)}
                onChange={(e) => setEspecialidades(parseArray(e.target.value))}
                placeholder="Carnes frescas, Aves, Peixes"
                rows={2}
              />
            </Field>
            <Field label="Formas de pagamento (separar por vírgula)">
              <Textarea
                value={arrayValue(formasPagamento)}
                onChange={(e) => setFormasPagamento(parseArray(e.target.value))}
                placeholder="Dinheiro, PIX, Cartão"
                rows={2}
              />
            </Field>
            <Field label="Facilidades (separar por vírgula)">
              <Textarea
                value={arrayValue(facilidades)}
                onChange={(e) => setFacilidades(parseArray(e.target.value))}
                placeholder="Estacionamento, Wi-Fi, Acessibilidade"
                rows={2}
              />
            </Field>

            <SectionTitle>🏢 Sobre</SectionTitle>
            <Field label="Ano de fundação">
              <Input
                type="number"
                value={anoFundacao ?? ""}
                onChange={(e) =>
                  setAnoFundacao(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="2015"
              />
            </Field>

            <SectionTitle>🖼️ Imagens</SectionTitle>
            <Field label="URL do Logo">
              <Input
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="URL da Capa">
              <Input
                value={capa}
                onChange={(e) => setCapa(e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </form>
        </ScrollArea>
        <div className="px-4 py-3 border-t">
          <Button
            type="submit"
            form={undefined}
            onClick={handleSubmit(onValid)}
            disabled={saving}
            className="w-full gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving
              ? "Saving..."
              : mode === "create"
                ? "Cadastrar business"
                : "Salvar alterações"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
