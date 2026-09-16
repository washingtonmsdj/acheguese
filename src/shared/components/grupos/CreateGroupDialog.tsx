import {
  BarChart3,
  Globe,
  Image,
  Loader2,
  Lock,
  MessageSquare,
  Mic,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  DEFAULT_GROUP_RULES,
  GROUP_CATEGORIES,
  GROUP_GOVERNANCE_PRESETS,
} from "@/shared/constants/groupTaxonomy";
import { cn } from "@/shared/utils/cn";

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

const CAPABILITIES = [
  {
    icon: MessageSquare,
    title: "Bate-papo",
    description: "Mensagens em tempo real para membros.",
    iconClassName: "text-primary",
  },
  {
    icon: Image,
    title: "Imagens",
    description: "Mídia com download manual por padrão.",
    iconClassName: "text-info",
  },
  {
    icon: Mic,
    title: "Áudio",
    description: "Base pronta para mensagens de voz.",
    iconClassName: "text-success",
  },
  {
    icon: BarChart3,
    title: "Enquetes",
    description: "Base pronta para votações do grupo.",
    iconClassName: "text-category-poll",
  },
] as const;

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
      <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto border-border bg-popover text-popover-foreground">
        <DialogHeader>
          <DialogTitle>Criar grupo</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Defina o tema, regras e nível de acesso desde o início.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
            <div>
              <label
                htmlFor="new-group-name"
                className="mb-1 block text-sm text-muted-foreground"
              >
                Nome do grupo *
              </label>
              <Input
                id="new-group-name"
                value={newGroup.name}
                onChange={(event) => onUpdateGroup({ name: event.target.value })}
                placeholder="Ex: Avisos da Santa Cruz"
                maxLength={60}
              />
            </div>

            <button
              type="button"
              onClick={() => onUpdateGroup({ is_private: !newGroup.is_private })}
              aria-pressed={newGroup.is_private}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                newGroup.is_private
                  ? "border-warning/40 bg-warning/10 text-warning"
                  : "border-border bg-muted/50 text-muted-foreground hover:text-foreground",
              )}
            >
              {newGroup.is_private ? (
                <Lock className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Globe className="h-4 w-4" aria-hidden="true" />
              )}
              {newGroup.is_private ? "Restrito" : "Público"}
            </button>
          </div>

          <div>
            <label
              htmlFor="new-group-description"
              className="mb-1 block text-sm text-muted-foreground"
            >
              Descrição
            </label>
            <Textarea
              id="new-group-description"
              value={newGroup.description}
              onChange={(event) =>
                onUpdateGroup({ description: event.target.value })
              }
              placeholder="Para quem é esse grupo? Que tipo de conversa deve ficar aqui?"
              className="resize-none"
              rows={3}
              maxLength={300}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="block text-sm text-muted-foreground">Categoria</span>
              <span className="text-xs text-muted-foreground">Catálogo escalável</span>
            </div>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {GROUP_CATEGORIES.map((category) => {
                const selected = (newGroup.category || "geral") === category.id;
                return (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => onUpdateGroup({ category: category.id })}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-w-0 items-start gap-2 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-foreground hover:bg-muted/60",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-xs font-bold text-foreground">
                      {category.token}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {category.label}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {category.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm text-muted-foreground">
              Governança
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {GROUP_GOVERNANCE_PRESETS.map((preset) => {
                const selected = activePreset.id === preset.id;
                return (
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
                    aria-pressed={selected}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-muted/30 hover:bg-muted/60",
                    )}
                  >
                    <span className="block text-sm font-semibold text-foreground">
                      {preset.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-muted/30 p-3"
              >
                <item.icon
                  className={cn("mb-2 h-4 w-4", item.iconClassName)}
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-start gap-3">
              <UserCog
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Admins do grupo
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Depois de criado, admins podem promover membros para admin/moderador
                  pela aba de membros, como em grupos de WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="new-group-rules"
              className="mb-1 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Regras do grupo
            </label>
            <Textarea
              id="new-group-rules"
              value={newGroup.rules || DEFAULT_GROUP_RULES.join("\n")}
              onChange={(event) => onUpdateGroup({ rules: event.target.value })}
              className="min-h-32 resize-none text-sm"
            />
          </div>

          <Button
            onClick={onSubmit}
            disabled={creating || !newGroup.name.trim()}
            className="w-full"
          >
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Criar grupo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
