import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { AlertCircle, Bell, BriefcaseBusiness, Building2, Calendar, ClipboardList, HelpCircle, Image, Megaphone, MessageSquare, OctagonAlert, PartyPopper, Search, Siren, UserRound, Users, Wrench, X } from "lucide-react";
import { useSessionContext } from "@/core/session";
import { useCreatePostForm } from "../../hooks/composer/useCreatePostForm";
import { postService } from "@/core/posts/services";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import type { PostType } from "@/core/posts/types/Post";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: PostType;
  editPostId?: string;
  initialContent?: string;
  initialType?: PostType;
  initialReach?: "street" | "neighborhood" | "city";
}

type IntentId =
  | "discussao"
  | "pergunta"
  | "enquete"
  | "recomendacao"
  | "aviso_comunitario"
  | "alerta_urgente"
  | "reportar_problema"
  | "vaga"
  | "classificado"
  | "promocao"
  | "servico"
  | "evento"
  | "mutirao"
  | "encontro";

interface IntentDef {
  id: IntentId;
  label: string;
  icon: React.ElementType;
  structuralType: PostType;
  distribution: Array<"moradores" | "empresas" | "eventos" | "alertas" | "vagas" | "classificados" | "para_voce" | "todos">;
  tooltip: string;
}

const INTENT_GROUPS: Array<{ title: string; items: IntentDef[] }> = [
  {
    title: "Comunidade",
    items: [
      { id: "discussao", label: "Discussão", icon: MessageSquare, structuralType: "discussao", distribution: ["moradores", "para_voce", "todos"], tooltip: "Conversas abertas entre moradores sobre o dia a dia do território." },
      { id: "pergunta", label: "Pergunta", icon: HelpCircle, structuralType: "pergunta", distribution: ["moradores", "para_voce", "todos"], tooltip: "Pergunta objetiva para obter respostas da comunidade local." },
      { id: "enquete", label: "Enquete", icon: ClipboardList, structuralType: "enquete", distribution: ["moradores", "para_voce", "todos"], tooltip: "Consulta rápida para tomada de decisão coletiva." },
      { id: "recomendacao", label: "Recomendação", icon: Search, structuralType: "recomendacao", distribution: ["moradores", "para_voce", "todos"], tooltip: "Indicação de pessoas, lugares ou soluções úteis no bairro." },
      { id: "aviso_comunitario", label: "Aviso comunitário", icon: Megaphone, structuralType: "discussao", distribution: ["moradores", "todos"], tooltip: "Comunicado local não urgente para orientar a vizinhança." },
    ],
  },
  {
    title: "Alertas e Problemas",
    items: [
      { id: "alerta_urgente", label: "Alerta urgente", icon: Siren, structuralType: "discussao", distribution: ["alertas", "para_voce", "todos"], tooltip: "Situações urgentes ou momentâneas. Exemplo: trânsito, acidente, falta de água agora." },
      { id: "reportar_problema", label: "Reportar problema", icon: OctagonAlert, structuralType: "discussao", distribution: ["alertas", "para_voce", "todos"], tooltip: "Problemas persistentes do bairro que precisam de acompanhamento. Exemplo: buraco na rua, iluminação quebrada, lixo acumulado." },
    ],
  },
  {
    title: "Economia local",
    items: [
      { id: "vaga", label: "Vaga", icon: BriefcaseBusiness, structuralType: "recomendacao", distribution: ["vagas", "empresas", "para_voce", "todos"], tooltip: "Oportunidade de trabalho vinculada ao território local." },
      { id: "classificado", label: "Classificado", icon: ClipboardList, structuralType: "desapego", distribution: ["classificados", "empresas", "para_voce", "todos"], tooltip: "Compra, venda e trocas com contexto territorial." },
      { id: "promocao", label: "Promoção", icon: Bell, structuralType: "recomendacao", distribution: ["empresas", "para_voce", "todos"], tooltip: "Oferta comercial temporária para circulação local." },
      { id: "servico", label: "Serviço", icon: Wrench, structuralType: "favor", distribution: ["empresas", "classificados", "para_voce", "todos"], tooltip: "Oferta de serviço profissional de alcance local." },
    ],
  },
  {
    title: "Eventos e atividades",
    items: [
      { id: "evento", label: "Evento", icon: Calendar, structuralType: "evento", distribution: ["eventos", "para_voce", "todos"], tooltip: "Programação local com data, horário e participação." },
      { id: "mutirao", label: "Mutirão", icon: Users, structuralType: "evento", distribution: ["eventos", "moradores", "para_voce", "todos"], tooltip: "Ação coletiva de melhoria territorial com coordenação comunitária." },
      { id: "encontro", label: "Encontro", icon: PartyPopper, structuralType: "evento", distribution: ["eventos", "moradores", "para_voce", "todos"], tooltip: "Reunião social ou temática entre moradores." },
    ],
  },
];

const REACH_OPTIONS = [
  { value: "street", label: "Rua" },
  { value: "neighborhood", label: "Bairro" },
  { value: "city", label: "Cidade" },
] as const;

function intentFromPostType(postType?: PostType): IntentId {
  switch (postType) {
    case "pergunta":
      return "pergunta";
    case "enquete":
      return "enquete";
    case "recomendacao":
      return "recomendacao";
    case "evento":
      return "evento";
    case "favor":
      return "servico";
    case "desapego":
      return "classificado";
    default:
      return "discussao";
  }
}

function flattenIntents(): IntentDef[] {
  return INTENT_GROUPS.flatMap((group) => group.items);
}

export function CreatePostModal({
  open,
  onClose,
  defaultType,
  editPostId,
  initialContent,
  initialType,
  initialReach,
}: CreatePostModalProps) {
  const { activeProfile: sessionProfile } = useSessionContext();
  const { effectiveProfile } = useMultiProfileContext();
  const rawProfile = effectiveProfile ?? sessionProfile;
  const profile = rawProfile as { id?: string; name?: string; avatar_url?: string; avatarUrl?: string; location_id?: string; locationId?: string; profile_type?: string } | null;
  const form = useCreatePostForm();
  const territoryFilter = useTerritoryFilter();
  const [publishing, setPublishing] = React.useState(false);
  const [intent, setIntent] = React.useState<IntentId>(intentFromPostType(initialType ?? defaultType));

  const [problemLocation, setProblemLocation] = React.useState("");
  const [problemCategory, setProblemCategory] = React.useState("");
  const [problemSeverity, setProblemSeverity] = React.useState<"baixa" | "media" | "alta" | "critica">("media");
  const [problemRecurrence, setProblemRecurrence] = React.useState<"pontual" | "frequente" | "constante">("pontual");
  const [problemDescription, setProblemDescription] = React.useState("");

  const intents = flattenIntents();
  const selectedIntent = intents.find((item) => item.id === intent) ?? intents[0];

  React.useEffect(() => {
    if (!open) return;
    form.setType((initialType ?? defaultType ?? selectedIntent.structuralType) as PostType);
    form.setReach(initialReach ?? "neighborhood");
    form.setContent(initialContent ?? "");
    setIntent(intentFromPostType(initialType ?? defaultType));
  }, [open, defaultType, initialType, initialReach, initialContent]); // intentional

  React.useEffect(() => {
    form.setType(selectedIntent.structuralType);
  }, [selectedIntent.structuralType]); // intentional

  const displayName = profile?.name ?? "Usuário";
  const avatarUrl = profile?.avatar_url ?? profile?.avatarUrl;
  const initials = displayName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const locationId = territoryFilter.scope === "location"
    ? territoryFilter.location_id
    : profile?.location_id ?? profile?.locationId ?? null;
  const locationError = !locationId ? "Configure sua localização antes de publicar." : null;

  const isProblemIntent = intent === "reportar_problema";
  const problemValid =
    problemLocation.trim().length >= 3 &&
    problemCategory.trim().length >= 3 &&
    problemDescription.trim().length >= 20;

  const baseValid = isProblemIntent ? problemValid : form.characterCount >= 20 && form.characterCount <= 2000;
  const canPublish = !!profile?.id && !locationError && !publishing && baseValid;

  const buildStructuredPayload = () => {
    const problemPayload = isProblemIntent
      ? {
          location: problemLocation.trim(),
          category: problemCategory.trim(),
          severity: problemSeverity,
          recurrence: problemRecurrence,
          description: problemDescription.trim(),
          photo_count: form.images.length,
        }
      : null;

    const structural = {
      schema_version: "territorial-content.v1",
      intent,
      structural_type: selectedIntent.structuralType,
      display_format: isProblemIntent ? "issue_card" : "post_card",
      distribution_territorial: selectedIntent.distribution,
      problem: problemPayload,
    };

    const content = isProblemIntent
      ? `Problema reportado: ${problemCategory}\n\n${problemDescription.trim()}`
      : form.content.trim();

    const tags = [
      `intent:${intent}`,
      `structural:${selectedIntent.structuralType}`,
      ...selectedIntent.distribution.map((channel) => `dist:${channel}`),
      ...(isProblemIntent ? [`problem:category:${problemCategory.trim().toLowerCase().replace(/\s+/g, "_")}`, `problem:severity:${problemSeverity}`, `problem:recurrence:${problemRecurrence}`] : []),
      `schema:${structural.schema_version}`,
    ];

    return { content, tags, structural };
  };

  const handleClose = () => {
    form.resetForm();
    setProblemLocation("");
    setProblemCategory("");
    setProblemSeverity("media");
    setProblemRecurrence("pontual");
    setProblemDescription("");
    onClose();
  };

  const handlePublish = async () => {
    if (!profile?.id) {
      toast.error("Faça login para publicar.");
      return;
    }
    if (locationError || !locationId) {
      toast.error(locationError ?? "Localização inválida.");
      return;
    }
    if (!baseValid) {
      toast.error("Preencha os campos obrigatórios do conteúdo.");
      return;
    }

    setPublishing(true);
    try {
      const payload = buildStructuredPayload();

      if (editPostId) {
        await postService.updatePost(editPostId, { content: payload.content });
        toast.success("Conteúdo atualizado.");
      } else {
        await postService.createPost({
          author_profile_id: profile.id,
          content: payload.content,
          type: selectedIntent.structuralType,
          location_id: locationId,
          reach: form.reach,
          images: form.images,
          tags: payload.tags,
          content_intent: intent,
          display_format: payload.structural.display_format,
          distribution_channels: payload.structural.distribution_territorial,
          content_payload: payload.structural as unknown as Record<string, unknown>,
        });
        toast.success("Conteúdo publicado.");
      }

      form.resetForm();
      handleClose();
    } catch {
      toast.error("Erro ao publicar conteúdo.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[760px] max-h-[88vh] overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-semibold">{editPostId ? "Editar conteúdo territorial" : "Criar conteúdo territorial"}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-5">
          {locationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{selectedIntent.label}</p>
            </div>
            {effectiveProfile && effectiveProfile.profile_type !== "personal" && (
              <div className="ml-auto">
                <ActiveProfileBadge profile={effectiveProfile} action="publicando como" />
              </div>
            )}
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">O que deseja publicar?</h3>
            {INTENT_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.title}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === intent;
                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setIntent(item.id)}
                            className={cn(
                              "rounded-lg border p-2.5 text-left transition-colors",
                              active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="text-xs font-semibold">{item.label}</span>
                            </div>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[280px] text-xs">
                          {item.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          {isProblemIntent ? (
            <section className="space-y-3 rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-semibold">Dados estruturados do problema</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Localização</label>
                  <Input value={problemLocation} onChange={(e) => setProblemLocation(e.target.value)} placeholder="Rua, referência ou ponto crítico" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Categoria</label>
                  <Input value={problemCategory} onChange={(e) => setProblemCategory(e.target.value)} placeholder="Ex.: buraco, iluminação, lixo" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Gravidade</label>
                  <Select value={problemSeverity} onValueChange={(v) => setProblemSeverity(v as typeof problemSeverity)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Recorrência</label>
                  <Select value={problemRecurrence} onValueChange={(v) => setProblemRecurrence(v as typeof problemRecurrence)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pontual">Pontual</SelectItem>
                      <SelectItem value="frequente">Frequente</SelectItem>
                      <SelectItem value="constante">Constante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição estruturada</label>
                <Textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Descreva o problema, impacto e contexto."
                  className="min-h-[120px]"
                />
              </div>
            </section>
          ) : (
            <section className="space-y-2">
              <p className="text-xs text-muted-foreground">Conteúdo principal</p>
              <Textarea
                value={form.content}
                onChange={(e) => form.setContent(e.target.value)}
                placeholder="Descreva o que deseja publicar no território."
                className="min-h-[140px]"
                maxLength={2000}
              />
              <p className="text-[11px] text-muted-foreground">{form.characterCount}/2000</p>
            </section>
          )}

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Mídia</p>
              <Button variant="ghost" size="icon" type="button" onClick={form.handleAddImage}>
                <Image className="h-4 w-4" />
              </Button>
            </div>
            {form.images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {form.images.map((img, i) => (
                  <div key={img} className="relative">
                    <img src={img} alt="" className="h-16 w-16 rounded-lg border object-cover" />
                    <button
                      type="button"
                      onClick={() => form.handleRemoveImage(i)}
                      className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <p className="text-xs text-muted-foreground">Distribuição territorial</p>
            <div className="flex flex-wrap gap-2">
              {REACH_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => form.setReach(option.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    form.reach === option.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-border px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {canPublish ? "Estrutura válida para publicação" : "Complete os campos obrigatórios"}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handlePublish} disabled={!canPublish}>
              {publishing ? (editPostId ? "Salvando..." : "Publicando...") : (editPostId ? "Salvar" : "Publicar")}
            </Button>
          </div>
        </div>

        <input ref={form.fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={form.handleFileSelect} />
      </DialogContent>
    </Dialog>
  );
}
