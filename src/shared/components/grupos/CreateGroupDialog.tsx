import React from "react";
import { BarChart3, Globe, Image, Loader2, Lock, MessageSquare, Mic, ShieldCheck, UserCog } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import {
  DEFAULT_GROUP_RULES,
  GROUP_CATEGORIES,
  GROUP_GOVERNANCE_PRESETS,
} from "@/shared/constants/groupTaxonomy";

interface NewGroupData {
  name: string;
  description: string;
  category: string;
  is_private: boolean;
  location_id?: string;
  join_policy?: string;
  posting_policy?: string;
  member_visibility?: string;
  media_policy?: string;
  rules?: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newGroup: NewGroupData;
  onUpdateGroup: (updates: Partial<NewGroupData>) => void;
  creating: boolean;
  onSubmit: () => void;
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  newGroup,
  onUpdateGroup,
  creating,
  onSubmit,
}: CreateGroupDialogProps) {
  const activePreset =
    GROUP_GOVERNANCE_PRESETS.find(
      (preset) =>
        preset.joinPolicy === (newGroup.join_policy || "open") &&
        preset.postingPolicy === (newGroup.posting_policy || "members"),
    ) ?? GROUP_GOVERNANCE_PRESETS[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto border-white/10 bg-[#1E2529] text-white">
        <DialogHeader>
          <DialogTitle>Criar grupo</DialogTitle>
          <DialogDescription className="text-gray-400">
            Defina o tema, regras e nivel de acesso desde o inicio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Nome do grupo *</label>
              <Input
                value={newGroup.name}
                onChange={(e) => onUpdateGroup({ name: e.target.value })}
                placeholder="Ex: Avisos da Santa Cruz"
                className="border-white/10 bg-white/5 text-white"
                maxLength={60}
              />
            </div>

            <button
              type="button"
              onClick={() => onUpdateGroup({ is_private: !newGroup.is_private })}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                newGroup.is_private
                  ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-300"
                  : "border-white/10 bg-white/5 text-gray-300"
              }`}
            >
              {newGroup.is_private ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              {newGroup.is_private ? "Restrito" : "Publico"}
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Descricao</label>
            <Textarea
              value={newGroup.description}
              onChange={(e) => onUpdateGroup({ description: e.target.value })}
              placeholder="Para quem e esse grupo? Que tipo de conversa deve ficar aqui?"
              className="resize-none border-white/10 bg-white/5 text-white"
              rows={3}
              maxLength={300}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="block text-sm text-gray-400">Categoria</label>
              <span className="text-xs text-gray-500">Catalogo escalavel</span>
            </div>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {GROUP_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => onUpdateGroup({ category: cat.id })}
                  className={`flex min-w-0 items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
                    (newGroup.category || "geral") === cat.id
                      ? "border-teal-400 bg-teal-400/10 text-teal-100"
                      : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/20"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold">
                    {cat.token}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{cat.label}</span>
                    <span className="line-clamp-2 text-xs text-gray-500">{cat.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">Governanca</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {GROUP_GOVERNANCE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() =>
                    onUpdateGroup({
                      join_policy: preset.joinPolicy,
                      posting_policy: preset.postingPolicy,
                      is_private: preset.joinPolicy !== "open",
                    })
                  }
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    activePreset.id === preset.id
                      ? "border-teal-400 bg-teal-400/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <span className="block text-sm font-semibold text-white">{preset.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <MessageSquare className="mb-2 h-4 w-4 text-teal-300" />
              <p className="text-sm font-semibold">Bate-papo</p>
              <p className="mt-1 text-xs text-gray-500">Mensagens em tempo real para membros.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <Image className="mb-2 h-4 w-4 text-cyan-300" />
              <p className="text-sm font-semibold">Imagens</p>
              <p className="mt-1 text-xs text-gray-500">Midia com download manual por padrao.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <Mic className="mb-2 h-4 w-4 text-emerald-300" />
              <p className="text-sm font-semibold">Audio</p>
              <p className="mt-1 text-xs text-gray-500">Base pronta para mensagens de voz.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <BarChart3 className="mb-2 h-4 w-4 text-violet-300" />
              <p className="text-sm font-semibold">Enquetes</p>
              <p className="mt-1 text-xs text-gray-500">Base pronta para votacoes do grupo.</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-start gap-3">
              <UserCog className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              <div>
                <p className="text-sm font-semibold">Admins do grupo</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  Depois de criado, admins podem promover membros para admin/moderador pela aba de membros, como em grupos de WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              Regras do grupo
            </label>
            <Textarea
              value={newGroup.rules || DEFAULT_GROUP_RULES.join("\n")}
              onChange={(e) => onUpdateGroup({ rules: e.target.value })}
              className="min-h-32 resize-none border-white/10 bg-white/5 text-sm text-white"
            />
          </div>

          <Button
            onClick={onSubmit}
            disabled={creating || !newGroup.name.trim()}
            className="w-full bg-teal-500 text-white hover:bg-teal-600"
          >
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Criar grupo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
