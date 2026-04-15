import React from "react";

import { useState, useEffect } from "react";
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
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import { DRIVER_STATUS } from "@/shared/types/constants";
import { profileService } from "@/core/profiles/services";

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

const CATEGORIAS = [
  "restaurante",
  "mercado",
  "farmácia",
  "salão",
  "academia",
  "pet shop",
  "padaria",
  "oficina",
  "loja",
  "outros",
];
const MODOS = [
  { id: "presencial", label: "🏪 Presencial" },
  { id: "delivery", label: "🚚 Delivery" },
  { id: "domicilio", label: "🏠 A domicílio" },
  { id: DRIVER_STATUS.ONLINE, label: "🌐 Online" },
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

export default function EmpresaEditSheet({
  open,
  onOpenChange,
  biz,
  onSaved,
  mode = "edit",
}: Props) {
  const { user, activeProfile } = useSessionContext();
  const [form, setForm] = useState<BizEditData>(
    biz ? { ...biz } : { ...emptyBiz },
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        biz
          ? {
              ...biz,
              modos_atendimento: biz.modos_atendimento ?? ["presencial"],
            }
          : { ...emptyBiz },
      );
    }
  }, [open, biz]);

  const set = (
    key: keyof BizEditData,
    value: string | string[] | number | null,
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleModo = (modo: string) => {
    const current = form.modos_atendimento ?? ["presencial"];
    if (current.includes(modo)) {
      if (current.length <= 1) {
        return;
      } // at least one mode
      set(
        "modos_atendimento",
        current.filter((m) => m !== modo),
      );
    } else {
      set("modos_atendimento", [...current, modo]);
    }
  };

  const payload = () => ({
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    address: form.address.trim(),
    neighborhood: form.neighborhood.trim(),
    phone: form.phone.trim(),
    whatsapp: form.whatsapp.trim(),
    schedule: form.schedule.trim(),
    schedule_fechamento: form.schedule_fechamento?.trim() || null,
    email: form.email.trim(),
    instagram: form.instagram.trim(),
    facebook: form.facebook.trim(),
    website: form.website.trim(),
    logo: form.logo.trim(),
    capa: form.capa.trim(),
    formas_pagamento: form.formas_pagamento,
    especialidades: form.especialidades,
    facilidades: form.facilidades,
    ano_fundacao: form.ano_fundacao,
    latitude: form.latitude,
    longitude: form.longitude,
    modos_atendimento: form.modos_atendimento ?? ["presencial"],
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (mode === "create") {
      if (
        !form.address.trim() &&
        !(form.modos_atendimento ?? []).every((m) => m === DRIVER_STATUS.ONLINE)
      ) {
        toast.error("Endereço é obrigatório para businesss presenciais");
        return;
      }
    }

    setSaving(true);

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
            name: form.name.trim(),
            bio: form.description.trim(),
            avatar_url: form.logo.trim() || null,
            phone: form.phone.trim() || null,
            whatsapp: form.whatsapp.trim() || null,
          },
          payload(),
          activeProfile.id,
        );

        toast.success("Empresa cadastrada! Aguarde aprovação pela equipe. ⏳");
        onSaved({ ...form, id: profile.id });
        onOpenChange(false);
      } catch (error) {
        toast.error(`Erro ao cadastrar: ${(error as Error).message}`);
      }
    } else {
      // Modo edição: update profiles E business_profiles

      // 1. Atualizar profiles (name, bio, avatar, phone, whatsapp)
      // ✅ MIGRADO GATE 2: Usar ProfileService.updateProfile
      await profileService.updateProfile(form.id, {
        name: form.name.trim(),
        bio: form.description.trim(),
        avatar_url: form.logo.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
      });

      // 2. Atualizar business_profiles (usando profile_id)
      try {
        await adminBusinessService.updateBusinessProfile(form.id, payload());
        toast.success("Informações atualizadas! ✅");
        onSaved(form);
        onOpenChange(false);
      } catch (error) {
        toast.error(`Erro ao salvar: ${(error as Error).message}`);
      }
    }
  };

  const arrayValue = (arr: string[]) => arr.join(", ");
  const parseArray = (val: string) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-lg font-display">
            {mode === "create" ? "Cadastrar business" : "Editar business"}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(90vh-120px)] px-4">
          <div className="space-y-3 pb-4">
            <SectionTitle>📋 Dados básicos</SectionTitle>
            <Field label="Nome *">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <Field label="Categoria">
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Descrição">
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
              />
            </Field>

            <SectionTitle>🚀 Modos de Atendimento</SectionTitle>
            <p className="text-xs text-muted-foreground">
              Selecione como sua business atende os clientes:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MODOS.map((m) => {
                const active = (form.modos_atendimento ?? []).includes(m.id);
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

            <SectionTitle>📍 Endereço</SectionTitle>
            <Field label="Endereço">
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <Field label="Bairro">
              <Input
                value={form.neighborhood}
                onChange={(e) => set("neighborhood", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude">
                <Input
                  type="number"
                  step="any"
                  value={form.latitude ?? ""}
                  onChange={(e) =>
                    set(
                      "latitude",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </Field>
              <Field label="Longitude">
                <Input
                  type="number"
                  step="any"
                  value={form.longitude ?? ""}
                  onChange={(e) =>
                    set(
                      "longitude",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </Field>
            </div>

            <SectionTitle>📞 Contato</SectionTitle>
            <Field label="Telefone">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(71) 3333-5555"
              />
            </Field>
            <Field label="WhatsApp">
              <Input
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="5571999999999"
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contato@business.com"
              />
            </Field>
            <Field label="Website">
              <Input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="www.business.com.br"
              />
            </Field>
            <Field label="Instagram">
              <Input
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="@user"
              />
            </Field>
            <Field label="Facebook">
              <Input
                value={form.facebook}
                onChange={(e) => set("facebook", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </Field>

            <SectionTitle>🕐 Horários e Serviços</SectionTitle>
            <Field label="Horário de funcionamento">
              <Textarea
                value={form.schedule}
                onChange={(e) => set("schedule", e.target.value)}
                placeholder="Seg-Sex: 8h-18h&#10;Sábado: 8h-12h&#10;Domingo: Fechado"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 Dica: Use uma linha por dia. Ex: "Seg-Sex: 8h-18h"
              </p>
            </Field>
            <Field label="Horário de fechamento hoje (HH:MM)">
              <Input
                value={form.schedule_fechamento ?? ""}
                onChange={(e) => set("schedule_fechamento", e.target.value)}
                placeholder="18:00"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 Usado para mostrar "Fecha às 18:00" quando aberto
              </p>
            </Field>
            <Field label="Especialidades (separar por vírgula)">
              <Textarea
                value={arrayValue(form.especialidades)}
                onChange={(e) =>
                  set("especialidades", parseArray(e.target.value))
                }
                placeholder="Carnes frescas, Aves, Peixes"
                rows={2}
              />
            </Field>
            <Field label="Formas de pagamento (separar por vírgula)">
              <Textarea
                value={arrayValue(form.formas_pagamento)}
                onChange={(e) =>
                  set("formas_pagamento", parseArray(e.target.value))
                }
                placeholder="Dinheiro, PIX, Cartão"
                rows={2}
              />
            </Field>
            <Field label="Facilidades (separar por vírgula)">
              <Textarea
                value={arrayValue(form.facilidades)}
                onChange={(e) => set("facilidades", parseArray(e.target.value))}
                placeholder="Estacionamento, Wi-Fi, Acessibilidade"
                rows={2}
              />
            </Field>

            <SectionTitle>🏢 Sobre</SectionTitle>
            <Field label="Ano de fundação">
              <Input
                type="number"
                value={form.ano_fundacao ?? ""}
                onChange={(e) =>
                  set(
                    "ano_fundacao",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="2015"
              />
            </Field>

            <SectionTitle>🖼️ Imagens</SectionTitle>
            <Field label="URL do Logo">
              <Input
                value={form.logo}
                onChange={(e) => set("logo", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="URL da Capa">
              <Input
                value={form.capa}
                onChange={(e) => set("capa", e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>
        </ScrollArea>
        <div className="px-4 py-3 border-t">
          <Button
            onClick={handleSave}
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
