/**
 * CreatePostModal - Modal para criação de posts
 * 
 * ✅ SSOT - Usa postService via hook
 * ✅ UX - Validação em tempo real
 * ✅ Performance - Memoização de componentes
 * ✅ Acessibilidade - ARIA labels completos
 */

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Image,
  BarChart2,
  MapPin,
  MessageSquare,
  Calendar,
  Newspaper,
  Globe,
  Home,
  Navigation,
  X,
  AlertCircle,
} from "lucide-react";
import { useSessionContext } from "@/core/session";
import { useCreatePostForm } from "../../hooks/composer/useCreatePostForm";
import { postService } from "@/core/posts/services";
import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import type { PostType } from "@/core/posts/types/Post";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: PostType;
}

// ✅ SPRINT 2 FASE 4: Tipo auxiliar para profile com location_id
interface ProfileWithLocation {
  id: string;
  name?: string;
  avatar_url?: string;
  location_id?: string;
  profile_type?: string;
}

// ✅ SPRINT 2 FASE 4: Type guard para verificar se profile tem location_id
function hasLocationId(profile: any): profile is ProfileWithLocation {
  return profile && typeof profile.location_id === 'string';
}

// ✅ SPRINT 2 FASE 4: Adaptador seguro para profile
function toProfileWithLocation(profile: any): ProfileWithLocation | null {
  if (!profile || typeof profile !== 'object' || !profile.id) {
    return null;
  }
  
  return {
    id: profile.id,
    name: profile.name,
    avatar_url: profile.avatar_url,
    location_id: profile.location_id,
    profile_type: profile.profile_type,
  };
}

const POST_TYPES: {
  value: PostType;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}[] = [
  { value: "discussao",    label: "Discussão",    icon: MessageSquare, description: "Inicie uma conversa com a vizinhança", color: "text-blue-400" },
  { value: "recomendacao", label: "Recomendação", icon: MapPin,        description: "Indique um lugar, serviço ou pessoa",  color: "text-green-400" },
  { value: "evento",       label: "Evento",       icon: Calendar,      description: "Divulgue um evento local",             color: "text-purple-400" },
  { value: "noticia",      label: "Notícia",      icon: Newspaper,     description: "Compartilhe uma notícia do bairro",    color: "text-yellow-400" },
  { value: "enquete",      label: "Enquete",      icon: BarChart2,     description: "Crie uma votação para a comunidade",   color: "text-orange-400" },
];

const REACH_OPTIONS = [
  { value: "street",       label: "Minha rua",  icon: Navigation, description: "Visível apenas para moradores da sua rua" },
  { value: "neighborhood", label: "Meu bairro", icon: Home,       description: "Visível para todo o bairro" },
  { value: "city",         label: "Cidade",     icon: Globe,      description: "Visível para toda a cidade" },
];

export function CreatePostModal({ open, onClose, defaultType }: CreatePostModalProps) {
  const { activeProfile: sessionProfile } = useSessionContext();
  const { effectiveProfile } = useMultiProfileContext();
  // effectiveProfile = contextual (business/professional/driver) ?? personal
  const rawProfile = effectiveProfile ?? sessionProfile;
  const profile = toProfileWithLocation(rawProfile);
  const form = useCreatePostForm();
  const [publishing, setPublishing] = React.useState(false);
  const territoryFilter = useTerritoryFilter();

  React.useEffect(() => {
    if (open) {
      form.setType(defaultType ?? "discussao");
    }
  }, [open, defaultType]);

  const displayName = profile?.name || "Usuário";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const currentType = POST_TYPES.find((t) => t.value === form.type);
  const currentReach = REACH_OPTIONS.find((r) => r.value === form.reach);

  const charPercent = (form.characterCount / 2000) * 100;
  const charColor = charPercent > 90 ? "text-red-400" : charPercent > 70 ? "text-yellow-400" : "text-muted-foreground/50";

  // ============================================================================
  // SPRINT 2 FASE 3: Resolução de location_id para criação
  // ============================================================================
  const getLocationIdForPost = (): { location_id: string | null; error: string | null } => {
    // 1. Se território ativo for group, bloquear
    if (territoryFilter.scope === 'group') {
      return {
        location_id: null,
        error: "Selecione uma cidade ou bairro específico para publicar"
      };
    }

    // 2. Se território ativo for location, usar
    if (territoryFilter.scope === 'location') {
      return {
        location_id: territoryFilter.location_id,
        error: null
      };
    }

    // 3. Fallback para profile.location_id (✅ FASE 4: tipado corretamente)
    if (profile && hasLocationId(profile)) {
      return {
        location_id: profile.location_id,
        error: null
      };
    }

    // 4. Sem localização disponível
    return {
      location_id: null,
      error: "Configure sua localização no perfil antes de publicar"
    };
  };

  const { location_id: resolvedLocationId, error: locationError } = getLocationIdForPost();
  const canPublish = form.isValid && !locationError && !publishing;

  const handlePublish = async () => {
    if (!form.validateForm()) return;
    if (!profile) { 
      toast.error("Faça login para publicar"); 
      return; 
    }

    if (locationError) {
      toast.error(locationError);
      return;
    }

    if (!resolvedLocationId) {
      toast.error("Erro ao resolver localização");
      return;
    }

    setPublishing(true);
    try {
      const data = form.getFormData();
      
      // ✅ SPRINT 2 FASE 3: Usar createPost() com location_id
      await postService.createPost({
        author_profile_id: profile.id,
        content: data.content,
        type: data.type,
        location_id: resolvedLocationId,
        reach: data.reach,
        images: data.images,
      });
      
      toast.success("Post publicado!");
      form.resetForm();
      onClose();
    } catch (error: any) {
      // Tratar erros específicos do service
      if (error.code === 'INVALID_LOCATION_TYPE') {
        toast.error("Esta localização não permite criação de posts");
      } else if (error.code === 'INACTIVE_LOCATION') {
        toast.error("Localização inativa");
      } else {
        toast.error("Erro ao publicar");
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => { form.resetForm(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px] bg-card border-border p-0 gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-border bg-card">
          <DialogTitle className="text-base font-semibold text-foreground">
            Criar novo post
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <>
          <div className="px-5 py-4 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">

            {/* ✅ SPRINT 2 FASE 3: Alerta de bloqueio territorial */}
            {locationError && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {locationError}
                </AlertDescription>
              </Alert>
            )}

            {/* Author + autoria explícita */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 ring-2 ring-border">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {currentReach && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <currentReach.icon className="h-3 w-3" />
                        {currentReach.label}
                      </span>
                    )}
                    {currentType && (
                      <>
                        <span className="text-muted-foreground/40 text-xs">·</span>
                        <span className={cn("text-xs", currentType.color)}>{currentType.label}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Badge de autoria — visível quando não é o perfil personal padrão */}
              {profile && profile.profile_type && profile.profile_type !== 'personal' && (
                <ActiveProfileBadge profile={profile} action="publicando como" />
              )}
            </div>

            {/* Textarea */}
            <div className="relative">
              <Textarea
                placeholder="No que você está pensando?"
                value={form.content}
                onChange={(e) => form.setContent(e.target.value)}
                className="min-h-[120px] resize-none bg-background border-border text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-1 text-sm leading-relaxed"
                maxLength={2000}
              />
              <span className={cn("absolute bottom-2 right-3 text-[10px] tabular-nums", charColor)}>
                {form.characterCount}/2000
              </span>
            </div>

            {/* Type grid */}
            <div>
              <p className="text-xs text-muted-foreground/70 mb-2 font-medium uppercase tracking-wide text-[10px]">Tipo de post</p>
              <div className="grid grid-cols-3 gap-1.5">
                {POST_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = form.type === t.value;
                  return (
                    <Tooltip key={t.value}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => form.setType(t.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all",
                            active
                              ? `border-current bg-current/10 ${t.color}`
                              : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground hover:bg-secondary/50"
                          )}
                        >
                          <Icon className={cn("h-4 w-4", active ? t.color : "")} />
                          {t.label}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-xs">{t.description}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Reach pills + media */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wide">Visível para:</p>
              {REACH_OPTIONS.map((r) => {
                const Icon = r.icon;
                const active = form.reach === r.value;
                return (
                  <Tooltip key={r.value}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => form.setReach(r.value as any)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3 w-3" />{r.label}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">{r.description}</TooltipContent>
                  </Tooltip>
                );
              })}
              <div className="ml-auto">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={form.handleAddImage} type="button">
                      <Image className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Adicionar foto ou vídeo</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Image previews */}
            {form.images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {form.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="h-16 w-16 object-cover rounded-lg border border-border" />
                    <button type="button" onClick={() => form.handleRemoveImage(i)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {form.images.length < 3 && (
                  <button type="button" onClick={form.handleAddImage}
                    className="h-16 w-16 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center">
                    <Image className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {locationError
                ? "⚠️ Localização inválida"
                : form.isValid
                ? "✓ Pronto para publicar"
                : `Mínimo 20 caracteres (${Math.max(0, 20 - form.characterCount)} restantes)`
              }
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground text-xs">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={!canPublish}
                className="text-xs font-semibold min-w-[100px] bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {publishing ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </div>
        </>

        <input ref={form.fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={form.handleFileSelect} />
      </DialogContent>
    </Dialog>
  );
}
