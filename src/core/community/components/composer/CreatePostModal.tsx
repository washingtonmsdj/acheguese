import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/shared/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  Calendar,
  ChevronDown,
  ClipboardList,
  HelpCircle,
  Image,
  Megaphone,
  MessageSquare,
  OctagonAlert,
  PartyPopper,
  Search,
  Siren,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useSessionContext } from "@/core/session";
import { useCreatePostForm } from "../../hooks/composer/useCreatePostForm";
import { postService } from "@/core/posts/services";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { communityFeedQueryKeys } from "@/core/feed";
import { cn } from "@/shared/utils/cn";
import { POST_LIMITS } from "@/shared/constants/socialContent";
import type { PostType } from "@/core/posts/types.ts";
import { useMultiProfileContext } from "@/core/profiles/contexts/multi-profile-runtime-context";
import { ActiveProfileBadge } from "@/core/profiles/components/ActiveProfileBadge";
import { useTerritoryFilter } from "@/core/location/hooks/useTerritoryFilter";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import {
  clearPostDraft,
  hasMeaningfulDraft,
  loadPostDraft,
  savePostDraft,
  writePostDraftSnapshot,
  type PostDraftPayload,
  type PostDraftSnapshot,
} from "@/core/community/utils/postDraft";
import {
  deleteRemoteDraft,
  fetchRemoteDraft,
  flushPendingSync,
  hasPendingSync,
  upsertRemoteDraft,
} from "@/core/community/services/postDraftSync";
import { emitNewPost } from "@/core/community/state/newPostHighlight";
import { Check as CloudCheck, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  DEFAULT_BLOCKED_ALERT_MESSAGE,
  DEFAULT_BLOCKED_ISSUE_MESSAGE,
  DEFAULT_BLOCKED_POST_MESSAGE,
  resolveCreatePostPublicationPermissionError,
  type CreatePostIntentId,
} from "./CreatePostModal.permissions";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: PostType;
  editPostId?: string;
  initialContent?: string;
  initialType?: PostType;
  initialReach?: "street" | "neighborhood" | "city";
  resolvedTerritory?: ResolvedTerritory;
  canCreatePost: boolean;
  canCreateAlert?: boolean;
  canCreateIssue?: boolean;
  blockedPostMessage?: string;
  blockedAlertMessage?: string;
  blockedIssueMessage?: string;
}

type IntentId = CreatePostIntentId;

type DistributionChannel =
  | "moradores"
  | "empresas"
  | "eventos"
  | "alertas"
  | "classificados"
  | "oportunidades"
  | "para_voce"
  | "todos";
type TerritorialLevel = "street" | "neighborhood" | "region" | "city";
type WorkOpportunityType =
  | "looking_for_work"
  | "offering_work"
  | "freelance"
  | "quick_job"
  | "service_availability";

type PostProfileLocation = {
  locationId?: string | null;
};

type RuntimePostProfile = PostProfileLocation & {
  id?: string;
  name?: string | null;
  displayName?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
  location_id?: string | null;
  profile_type?: string | null;
  profileType?: string | null;
};

type TerritoryFilterSnapshot = {
  scope?: string | null;
  location_id?: string | null;
  locationId?: string | null;
};

interface IntentDef {
  id: IntentId;
  label: string;
  icon: React.ElementType;
  structuralType: PostType;
  distribution: DistributionChannel[];
  tooltip: string;
}

const RAW_INTENT_GROUPS: Array<{ title: string; items: IntentDef[] }> = [
  {
    title: "Comunidade",
    items: [
      {
        id: "discussao",
        label: "Discussão",
        icon: MessageSquare,
        structuralType: "discussao",
        distribution: ["moradores", "para_voce", "todos"],
        tooltip:
          "Conversas abertas entre moradores sobre o dia a dia do território.",
      },
      {
        id: "pergunta",
        label: "Pergunta",
        icon: HelpCircle,
        structuralType: "pergunta",
        distribution: ["moradores", "para_voce", "todos"],
        tooltip: "Pergunta objetiva para obter respostas da comunidade local.",
      },
      {
        id: "enquete",
        label: "Enquete",
        icon: ClipboardList,
        structuralType: "enquete",
        distribution: ["moradores", "para_voce", "todos"],
        tooltip: "Consulta rápida para tomada de decisão coletiva.",
      },
      {
        id: "recomendacao",
        label: "Recomendação",
        icon: Search,
        structuralType: "recomendacao",
        distribution: ["moradores", "para_voce", "todos"],
        tooltip: "Indicação de pessoas, lugares ou soluções úteis no bairro.",
      },
      {
        id: "aviso_comunitario",
        label: "Aviso comunitário",
        icon: Megaphone,
        structuralType: "discussao",
        distribution: ["moradores", "todos"],
        tooltip: "Comunicado local não urgente para orientar a vizinhança.",
      },
    ],
  },
  {
    title: "Alertas e Problemas",
    items: [
      {
        id: "alerta_urgente",
        label: "Alerta urgente",
        icon: Siren,
        structuralType: "discussao",
        distribution: ["alertas", "para_voce", "todos"],
        tooltip:
          "Situações urgentes ou momentâneas. Exemplo: trânsito, acidente, falta de água agora.",
      },
      {
        id: "reportar_problema",
        label: "Reportar problema",
        icon: OctagonAlert,
        structuralType: "discussao",
        distribution: ["alertas", "para_voce", "todos"],
        tooltip:
          "Problemas persistentes do bairro que precisam de acompanhamento. Exemplo: buraco na rua, iluminação quebrada, lixo acumulado.",
      },
    ],
  },
  {
    title: "Economia local",
    items: [
      {
        id: "oportunidade",
        label: "Oportunidade",
        icon: BriefcaseBusiness,
        structuralType: "favor",
        distribution: ["oportunidades", "moradores", "para_voce", "todos"],
        tooltip:
          "Trabalhos rápidos, freelas, diárias ou oportunidades locais imediatas.",
      },
      {
        id: "servico",
        label: "Serviço",
        icon: Wrench,
        structuralType: "favor",
        distribution: ["empresas", "classificados", "para_voce", "todos"],
        tooltip: "Oferta de serviço profissional de alcance local.",
      },
      {
        id: "classificado",
        label: "Classificado",
        icon: ClipboardList,
        structuralType: "desapego",
        distribution: ["classificados", "empresas", "para_voce", "todos"],
        tooltip: "Compra, venda e trocas com contexto territorial.",
      },
      {
        id: "promocao",
        label: "Promoção",
        icon: Bell,
        structuralType: "recomendacao",
        distribution: ["empresas", "para_voce", "todos"],
        tooltip: "Oferta comercial temporária para circulação local.",
      },
    ],
  },
  {
    title: "Eventos e atividades",
    items: [
      {
        id: "evento",
        label: "Evento",
        icon: Calendar,
        structuralType: "evento",
        distribution: ["eventos", "para_voce", "todos"],
        tooltip: "Programação local com data, horário e participação.",
      },
      {
        id: "mutirao",
        label: "Mutirão",
        icon: Users,
        structuralType: "evento",
        distribution: ["eventos", "moradores", "para_voce", "todos"],
        tooltip:
          "Ação coletiva de melhoria territorial com coordenação comunitária.",
      },
      {
        id: "encontro",
        label: "Encontro",
        icon: PartyPopper,
        structuralType: "evento",
        distribution: ["eventos", "moradores", "para_voce", "todos"],
        tooltip: "Reuniao social ou tematica entre moradores.",
      },
    ],
  },
];

function isLaunchIntentEnabled(id: IntentId): boolean {
  switch (id) {
    case "alerta_urgente":
      return isLaunchSurfaceEnabled("communityAlerts");
    case "reportar_problema":
      return isLaunchSurfaceEnabled("communityIssues");
    case "evento":
    case "mutirao":
    case "encontro":
      return isLaunchSurfaceEnabled("events");
    case "oportunidade":
      return isLaunchSurfaceEnabled("jobs");
    case "promocao":
      return isLaunchSurfaceEnabled("coupons");
    default:
      return true;
  }
}

const INTENT_GROUPS: Array<{ title: string; items: IntentDef[] }> =
  RAW_INTENT_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => isLaunchIntentEnabled(item.id)),
  })).filter((group) => group.items.length > 0);

const DISTRIBUTION_LEVEL_OPTIONS: Array<{
  value: TerritorialLevel;
  label: string;
}> = [
  { value: "street", label: "Minha rua" },
  { value: "neighborhood", label: "Meu bairro" },
  { value: "region", label: "Região" },
  { value: "city", label: "Cidade" },
];

const POLL_DURATION_OPTIONS = [
  { value: "1", label: "1 dia" },
  { value: "3", label: "3 dias" },
  { value: "7", label: "7 dias" },
  { value: "14", label: "14 dias" },
] as const;

const OPPORTUNITY_TYPE_OPTIONS: Array<{
  value: WorkOpportunityType;
  label: string;
}> = [
  { value: "looking_for_work", label: "Procura trabalho" },
  { value: "offering_work", label: "Oferece trabalho" },
  { value: "freelance", label: "Freela" },
  { value: "quick_job", label: "Diaria rápida" },
  { value: "service_availability", label: "Disponibilidade de serviço" },
];

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
    case "desapego":
      return "classificado";
    case "favor":
      return "oportunidade";
    default:
      return "discussao";
  }
}

function flattenIntents(): IntentDef[] {
  return INTENT_GROUPS.flatMap((group) => group.items);
}

function getLaunchIntent(id: IntentId): IntentId {
  return isLaunchIntentEnabled(id)
    ? id
    : (flattenIntents()[0]?.id ?? "discussao");
}

function reachFromTerritorialLevel(
  level: TerritorialLevel,
): "street" | "neighborhood" | "city" {
  if (level === "street") return "street";
  if (level === "city") return "city";
  return "neighborhood";
}

function getLocationIdForPost(
  filter: TerritoryFilterSnapshot,
  profile: PostProfileLocation | null,
): string | null {
  if (filter.scope === "group") return null;
  if (filter.scope === "location")
    return filter.location_id ?? filter.locationId ?? null;
  return profile?.locationId ?? null;
}

function normalizeRuntimeProfile(profile: RuntimePostProfile | null) {
  if (!profile?.id) return null;

  return {
    id: profile.id,
    displayName: profile.displayName ?? profile.name ?? "Usuário",
    avatarUrl: profile.avatarUrl ?? profile.avatar_url ?? null,
    locationId: profile.locationId ?? profile.location_id ?? null,
    profileType: profile.profileType ?? profile.profile_type ?? null,
  };
}

export function CreatePostModal({
  open,
  onClose,
  defaultType,
  editPostId,
  initialContent,
  initialType,
  initialReach,
  resolvedTerritory,
  canCreatePost,
  canCreateAlert = false,
  canCreateIssue = false,
  blockedPostMessage = DEFAULT_BLOCKED_POST_MESSAGE,
  blockedAlertMessage = DEFAULT_BLOCKED_ALERT_MESSAGE,
  blockedIssueMessage = DEFAULT_BLOCKED_ISSUE_MESSAGE,
}: CreatePostModalProps) {
  const { activeProfile: sessionProfile } = useSessionContext();
  const { effectiveProfile } = useMultiProfileContext();
  const profile = normalizeRuntimeProfile(
    (effectiveProfile ?? sessionProfile) as RuntimePostProfile | null,
  );
  const form = useCreatePostForm();
  const territoryFilter = useTerritoryFilter(resolvedTerritory);
  const queryClient = useQueryClient();
  const [publishing, setPublishing] = React.useState(false);
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const [hasStoredDraft, setHasStoredDraft] = React.useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "saving" | "synced" | "offline" | "error"
  >("idle");
  const [pendingDraftForRestore, setPendingDraftForRestore] =
    React.useState<PostDraftSnapshot | null>(null);
  const autosaveTimerRef = React.useRef<number | null>(null);
  const remoteSyncTimerRef = React.useRef<number | null>(null);
  const suppressAutosaveRef = React.useRef(true);
  const [intentPickerExpanded, setIntentPickerExpanded] = React.useState(false);
  const intentPickerId = React.useId();
  const [intent, setIntent] = React.useState<IntentId>(
    getLaunchIntent(intentFromPostType(initialType ?? defaultType)),
  );
  const [distributionLevel, setDistributionLevel] =
    React.useState<TerritorialLevel>("neighborhood");
  const [genericDescription, setGenericDescription] = React.useState("");
  const [pollQuestion, setPollQuestion] = React.useState("");
  const [pollOptions, setPollOptions] = React.useState(["", ""]);
  const [pollAllowMultiple, setPollAllowMultiple] = React.useState(false);
  const [pollDurationDays, setPollDurationDays] =
    React.useState<(typeof POLL_DURATION_OPTIONS)[number]["value"]>("3");
  const [pollAllowComments, setPollAllowComments] = React.useState(true);
  const [problemLocation, setProblemLocation] = React.useState("");
  const [problemCategory, setProblemCategory] = React.useState("");
  const [problemSeverity, setProblemSeverity] = React.useState<
    "baixa" | "media" | "alta" | "critica"
  >("media");
  const [problemRecurrence, setProblemRecurrence] = React.useState<
    "pontual" | "frequente" | "constante"
  >("pontual");
  const [problemDescription, setProblemDescription] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [eventTime, setEventTime] = React.useState("");
  const [eventPlace, setEventPlace] = React.useState("");
  const [eventLimit, setEventLimit] = React.useState("");
  const [eventDescription, setEventDescription] = React.useState("");
  const [opportunityWorkType, setOpportunityWorkType] = React.useState("");
  const [opportunityType, setOpportunityType] =
    React.useState<WorkOpportunityType>("offering_work");
  const [opportunityLinkedProfessionalId, setOpportunityLinkedProfessionalId] =
    React.useState("none");
  const [opportunityCategory, setOpportunityCategory] = React.useState("");
  const [opportunityAmount, setOpportunityAmount] = React.useState("");
  const [opportunityUrgency, setOpportunityUrgency] = React.useState<
    "hoje" | "24h" | "semana" | "flexivel"
  >("24h");
  const [opportunityContact, setOpportunityContact] = React.useState("");
  const [opportunityDuration, setOpportunityDuration] = React.useState("");
  const [opportunityDescription, setOpportunityDescription] =
    React.useState("");
  const [ownedProfessionalProfiles, setOwnedProfessionalProfiles] =
    React.useState<
      Array<{
        id: string;
        professional_name: string | null;
        service_category: string | null;
      }>
    >([]);
  const [
    loadingOwnedProfessionalProfiles,
    setLoadingOwnedProfessionalProfiles,
  ] = React.useState(false);

  const selectedIntent =
    flattenIntents().find((item) => item.id === intent) ?? flattenIntents()[0];
  const SelectedIntentIcon = selectedIntent.icon;
  const applyDraftSnapshot = React.useCallback(
    (draft: PostDraftSnapshot) => {
      setIntent(getLaunchIntent(draft.intent as IntentId));
      setDistributionLevel(draft.distributionLevel);
      form.setReach(reachFromTerritorialLevel(draft.distributionLevel));
      setGenericDescription(draft.genericDescription);
      setPollQuestion(draft.pollQuestion);
      setPollOptions(
        draft.pollOptions.length >= 2 ? draft.pollOptions : ["", ""],
      );
      setProblemLocation(draft.problemLocation);
      setProblemCategory(draft.problemCategory);
      setProblemSeverity(draft.problemSeverity);
      setProblemRecurrence(draft.problemRecurrence);
      setProblemDescription(draft.problemDescription);
      setEventDate(draft.eventDate);
      setEventTime(draft.eventTime);
      setEventPlace(draft.eventPlace);
      setEventLimit(draft.eventLimit);
      setEventDescription(draft.eventDescription);
      setLastSavedAt(draft.updatedAt ?? draft.savedAt ?? Date.now());
      setHasStoredDraft(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  React.useEffect(() => {
    if (!open) return;
    // Suprime autosave durante a hidratação inicial do modal.
    suppressAutosaveRef.current = true;
    form.setType(
      (initialType ?? defaultType ?? selectedIntent.structuralType) as PostType,
    );
    const initialDistributionLevel =
      initialReach === "street"
        ? "street"
        : initialReach === "city"
          ? "city"
          : "neighborhood";
    form.setReach(initialReach ?? "neighborhood");
    form.setContent("");
    setIntent(getLaunchIntent(intentFromPostType(initialType ?? defaultType)));
    setIntentPickerExpanded(false);
    setGenericDescription(initialContent ?? "");
    setDistributionLevel(initialDistributionLevel);
    setLastSavedAt(null);
    setHasStoredDraft(false);

    setPendingDraftForRestore(null);
    setSaveStatus("idle");

    // Detecta rascunho (local + remoto) e oferece "Continuar rascunho".
    if (!editPostId && profile?.id) {
      const profileId = profile.id;
      void (async () => {
        const local = await loadPostDraft(profileId);
        let candidate: PostDraftSnapshot | null =
          local && hasMeaningfulDraft(local) ? local : null;
        if (candidate) {
          setHasStoredDraft(true);
          setLastSavedAt(candidate.updatedAt ?? candidate.savedAt ?? null);
          setPendingDraftForRestore(candidate);
        }
        const remote = await fetchRemoteDraft(profileId);
        if (remote && hasMeaningfulDraft(remote.snapshot)) {
          const localTs = candidate?.updatedAt ?? candidate?.savedAt ?? 0;
          // Conflict resolution: mais recente vence.
          if (remote.updatedAt > localTs) {
            await writePostDraftSnapshot(profileId, remote.snapshot);
            candidate = remote.snapshot;
            setHasStoredDraft(true);
            setLastSavedAt(remote.updatedAt);
            setPendingDraftForRestore(remote.snapshot);
          }
        }
      })();
      // Flush de qualquer rascunho pendente que ficou offline.
      if (hasPendingSync(profileId) && typeof navigator !== "undefined" && navigator.onLine !== false) {
        void flushPendingSync(profileId);
      }
    }
    // Libera autosave após o próximo tick, quando os estados já settlaram.
    const t = window.setTimeout(() => {
      suppressAutosaveRef.current = false;
    }, 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultType, initialType, initialContent, initialReach, editPostId, profile?.id]);
  React.useEffect(() => {
    form.setType(selectedIntent.structuralType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIntent.structuralType]);

  // Snapshot atual dos campos textuais (mesma forma do PostDraftPayload).
  const currentDraftPayload = React.useMemo<PostDraftPayload>(
    () => ({
      intent,
      distributionLevel,
      genericDescription,
      pollQuestion,
      pollOptions,
      problemLocation,
      problemCategory,
      problemSeverity,
      problemRecurrence,
      problemDescription,
      eventDate,
      eventTime,
      eventPlace,
      eventLimit,
      eventDescription,
    }),
    [
      intent,
      distributionLevel,
      genericDescription,
      pollQuestion,
      pollOptions,
      problemLocation,
      problemCategory,
      problemSeverity,
      problemRecurrence,
      problemDescription,
      eventDate,
      eventTime,
      eventPlace,
      eventLimit,
      eventDescription,
    ],
  );

  // Autosave: local (debounce 400ms) + remoto (debounce 1500ms).
  React.useEffect(() => {
    if (!open || editPostId) return;
    if (!profile?.id) return;
    if (suppressAutosaveRef.current) return;
    if (!hasMeaningfulDraft(currentDraftPayload)) return;

    const profileId = profile.id;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    if (remoteSyncTimerRef.current)
      window.clearTimeout(remoteSyncTimerRef.current);

    setSaveStatus("saving");

    autosaveTimerRef.current = window.setTimeout(() => {
      void savePostDraft(profileId, currentDraftPayload).then((snapshot) => {
        if (snapshot) {
          setLastSavedAt(snapshot.updatedAt);
          setHasStoredDraft(true);
        }
      });
    }, 400);

    remoteSyncTimerRef.current = window.setTimeout(async () => {
      const snapshot: PostDraftSnapshot = {
        ...currentDraftPayload,
        updatedAt: Date.now(),
      };
      const result = await upsertRemoteDraft(profileId, snapshot);
      if (result.status === "ok") {
        setSaveStatus("synced");
      } else if (result.status === "offline") {
        setSaveStatus("offline");
      } else if (result.status === "conflict") {
        // Rascunho remoto mais novo: reconciliar sem sobrescrever.
        writePostDraftSnapshot(profileId, result.remote.snapshot);
        setLastSavedAt(result.remote.updatedAt);
        setSaveStatus("synced");
        toast.info(
          "Encontramos um rascunho mais recente em outro dispositivo. Recarregue para ver.",
        );
      } else {
        setSaveStatus("error");
      }
    }, 1500);

    return () => {
      if (autosaveTimerRef.current)
        window.clearTimeout(autosaveTimerRef.current);
      if (remoteSyncTimerRef.current)
        window.clearTimeout(remoteSyncTimerRef.current);
    };
  }, [open, editPostId, profile?.id, currentDraftPayload]);

  // Reenvia rascunhos pendentes assim que o navegador voltar a ficar online.
  React.useEffect(() => {
    if (!open || editPostId || !profile?.id) return;
    if (typeof window === "undefined") return;
    const profileId = profile.id;
    const handleOnline = () => {
      setSaveStatus((prev) => (prev === "offline" ? "saving" : prev));
      void flushPendingSync(profileId).then((res) => {
        if (!res) return;
        if (res.status === "ok") setSaveStatus("synced");
        else if (res.status === "offline") setSaveStatus("offline");
        else if (res.status === "error") setSaveStatus("error");
      });
    };
    const handleOffline = () => setSaveStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [open, editPostId, profile?.id]);

  const displayName = profile?.displayName ?? "Usuário";
  const avatarUrl = profile?.avatarUrl;
  const initials = displayName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const resolvedLocationId = React.useMemo(
    () => getLocationIdForPost(territoryFilter, profile),
    [territoryFilter, profile],
  );
  const locationError = React.useMemo(() => {
    if (territoryFilter.scope === "group")
      return "Selecione uma cidade ou bairro específico para publicar.";
    if (!resolvedLocationId)
      return "Configure sua localização no perfil antes de publicar.";
    return null;
  }, [territoryFilter.scope, resolvedLocationId]);
  const isProblemIntent = intent === "reportar_problema";
  const isPollIntent = intent === "enquete";
  const isEventIntent =
    intent === "evento" || intent === "mutirao" || intent === "encontro";
  const isOpportunityIntent = intent === "oportunidade";
  const selectedLinkedProfessional = ownedProfessionalProfiles.find(
    (item) => item.id === opportunityLinkedProfessionalId,
  );
  const pollOptionCount = pollOptions.filter(
    (opt) => opt.trim().length > 0,
  ).length;
  const baseValid = isPollIntent
    ? pollQuestion.trim().length >= 8 && pollOptionCount >= 2
    : isProblemIntent
      ? problemLocation.trim().length >= 3 &&
        problemCategory.trim().length >= 3 &&
        problemDescription.trim().length >= 20
      : isEventIntent
        ? !!eventDate &&
          !!eventTime &&
          eventPlace.trim().length >= 3 &&
          eventDescription.trim().length >= 10
        : isOpportunityIntent
          ? opportunityWorkType.trim().length >= 3 &&
            opportunityCategory.trim().length >= 2 &&
            opportunityContact.trim().length >= 3 &&
            opportunityDuration.trim().length >= 2 &&
            opportunityDescription.trim().length >= 10
          : genericDescription.trim().length >= 10 &&
            genericDescription.trim().length <= 2000;
  const publicationPermissionError = React.useMemo(() => {
    return resolveCreatePostPublicationPermissionError({
      intent,
      canCreatePost,
      canCreateAlert,
      canCreateIssue,
      blockedPostMessage,
      blockedAlertMessage,
      blockedIssueMessage,
    });
  }, [
    blockedAlertMessage,
    blockedIssueMessage,
    blockedPostMessage,
    canCreateAlert,
    canCreateIssue,
    canCreatePost,
    intent,
  ]);
  const canPublish =
    !!profile?.id &&
    !locationError &&
    !publishing &&
    baseValid &&
    !publicationPermissionError;

  React.useEffect(() => {
    if (!selectedLinkedProfessional?.service_category) return;
    setOpportunityCategory(selectedLinkedProfessional.service_category);
    if (
      !opportunityWorkType.trim() &&
      selectedLinkedProfessional.professional_name
    ) {
      setOpportunityWorkType(selectedLinkedProfessional.professional_name);
    }
  }, [selectedLinkedProfessional, opportunityWorkType]);

  const buildStructuredPayload = () => {
    const structuralBase = {
      schema_version: "territorial-content.v2",
      intent,
      structural_type: selectedIntent.structuralType,
      distribution_territorial: {
        level: distributionLevel,
        channels: selectedIntent.distribution,
      },
    };
    if (isPollIntent) {
      return {
        content: pollQuestion.trim(),
        tags: [
          "format:poll",
          `intent:${intent}`,
          `dist-level:${distributionLevel}`,
        ],
        structural: {
          ...structuralBase,
          display_format: "poll_card",
        },
      };
    }
    if (isProblemIntent) {
      return {
        content: `Problema: ${problemCategory.trim()}\n\n${problemDescription.trim()}`,
        tags: [
          "format:issue",
          `intent:${intent}`,
          `dist-level:${distributionLevel}`,
          `problem:severity:${problemSeverity}`,
        ],
        structural: {
          ...structuralBase,
          display_format: "issue_card",
          problem: {
            location: problemLocation.trim(),
            category: problemCategory.trim(),
            severity: problemSeverity,
            recurrence: problemRecurrence,
            description: problemDescription.trim(),
          },
        },
      };
    }
    if (isEventIntent) {
      return {
        content: `${selectedIntent.label}: ${eventDescription.trim()}`,
        tags: [
          "format:event",
          `intent:${intent}`,
          `dist-level:${distributionLevel}`,
        ],
        structural: {
          ...structuralBase,
          display_format: "event_card",
          event: {
            date: eventDate,
            time: eventTime,
            place: eventPlace.trim(),
            participant_limit: eventLimit ? Number(eventLimit) : null,
            description: eventDescription.trim(),
          },
        },
      };
    }
    if (isOpportunityIntent) {
      return {
        content: `Oportunidade: ${opportunityWorkType.trim()}\n\n${opportunityDescription.trim()}`,
        tags: [
          "format:opportunity",
          `intent:${intent}`,
          `dist-level:${distributionLevel}`,
          `opportunity:urgency:${opportunityUrgency}`,
          `opportunity:type:${opportunityType}`,
        ],
        structural: {
          ...structuralBase,
          display_format: "opportunity_card",
          opportunity: {
            work_type: opportunityWorkType.trim(),
            category: opportunityCategory.trim(),
            opportunity_type: opportunityType,
            professional_id:
              opportunityLinkedProfessionalId === "none"
                ? null
                : opportunityLinkedProfessionalId,
            amount: opportunityAmount.trim() || null,
            urgency: opportunityUrgency,
            contact: opportunityContact.trim(),
            duration: opportunityDuration.trim(),
            description: opportunityDescription.trim(),
          },
        },
      };
    }
    return {
      content: genericDescription.trim(),
      tags: [
        "format:post",
        `intent:${intent}`,
        `dist-level:${distributionLevel}`,
      ],
      structural: {
        ...structuralBase,
        display_format: "post_card",
        body: { description: genericDescription.trim() },
      },
    };
  };

  const handleClose = () => {
    form.resetForm();
    setGenericDescription(initialContent ?? "");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollAllowMultiple(false);
    setPollDurationDays("3");
    setPollAllowComments(true);
    setProblemLocation("");
    setProblemCategory("");
    setProblemSeverity("media");
    setProblemRecurrence("pontual");
    setProblemDescription("");
    setEventDate("");
    setEventTime("");
    setEventPlace("");
    setEventLimit("");
    setEventDescription("");
    setOpportunityWorkType("");
    setOpportunityType("offering_work");
    setOpportunityLinkedProfessionalId("none");
    setOpportunityCategory("");
    setOpportunityAmount("");
    setOpportunityUrgency("24h");
    setOpportunityContact("");
    setOpportunityDuration("");
    setOpportunityDescription("");
    setOwnedProfessionalProfiles([]);
    setLoadingOwnedProfessionalProfiles(false);
    setDistributionLevel("neighborhood");
    onClose();
  };

  const handlePublish = async () => {
    if (!profile?.id) return toast.error("Faça login para publicar.");
    if (locationError || !resolvedLocationId)
      return toast.error(locationError ?? "Localização inválida.");
    if (!baseValid) return toast.error("Preencha os campos obrigatórios.");
    if (publicationPermissionError)
      return toast.info(publicationPermissionError);
    setPublishing(true);
    try {
      const payload = buildStructuredPayload();
      let createdPostId: string | null = null;
      if (editPostId) {
        await postService.updatePost(editPostId, { content: payload.content });
        toast.success("Conteúdo atualizado.");
      } else if (isOpportunityIntent) {
        toast.error("Oportunidades estao pausadas neste MVP.");
      } else {
        const commonPostIntent = {
          author_profile_id: profile.id,
          content: payload.content,
          location_id: resolvedLocationId,
          reach: reachFromTerritorialLevel(distributionLevel),
          tags: payload.tags,
          content_intent: intent,
          distribution_channels:
            payload.structural.distribution_territorial.channels,
        };
        const created = isPollIntent
          ? await postService.createPollPostWithImages(
              {
                ...commonPostIntent,
                content_payload: payload.structural,
                poll: {
                  question: pollQuestion.trim(),
                  options: pollOptions
                    .filter((option) => option.trim())
                    .map((option) => option.trim()),
                  duration_days: Number(pollDurationDays),
                  allow_multiple_choice: pollAllowMultiple,
                  allow_comments: pollAllowComments,
                },
              },
              form.imageFiles,
            )
          : await postService.createPostWithImages(
              {
                ...commonPostIntent,
                type: selectedIntent.structuralType,
                display_format: payload.structural.display_format,
                content_payload: payload.structural,
              },
              form.imageFiles,
            );
        createdPostId = created.id;
        toast.success("Conteúdo publicado.");
      }

      queryClient.invalidateQueries({ queryKey: communityFeedQueryKeys.root });

      if (createdPostId) {
        emitNewPost(createdPostId);
      }

      if (!editPostId && profile?.id) {
        clearPostDraft(profile.id);
        void deleteRemoteDraft(profile.id);
        setLastSavedAt(null);
        setHasStoredDraft(false);
        suppressAutosaveRef.current = true;
      }

      form.resetForm();
      handleClose();
    } catch {
      toast.error("Erro ao publicar conteúdo.");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (editPostId) return;
    if (!profile?.id) {
      toast.error("Faça login para salvar rascunhos.");
      return;
    }
    if (!hasMeaningfulDraft(currentDraftPayload)) {
      toast.info("Escreva algo antes de salvar como rascunho.");
      return;
    }
    setSavingDraft(true);
    try {
      const snapshot = await savePostDraft(profile.id, currentDraftPayload);
      if (snapshot) {
        setLastSavedAt(snapshot.updatedAt);
        setHasStoredDraft(true);
        void upsertRemoteDraft(profile.id, snapshot);
      }
      toast.success("Rascunho salvo. Você pode voltar depois para publicar.");
      handleClose();
    } finally {
      setSavingDraft(false);
    }
  };

  const resetComposerFields = React.useCallback(() => {
    setGenericDescription("");
    setPollQuestion("");
    setPollOptions(["", ""]);
    setProblemLocation("");
    setProblemCategory("");
    setProblemSeverity("media");
    setProblemRecurrence("pontual");
    setProblemDescription("");
    setEventDate("");
    setEventTime("");
    setEventPlace("");
    setEventLimit("");
    setEventDescription("");
  }, []);

  const handleDiscardDraft = () => {
    if (!profile?.id) return;
    suppressAutosaveRef.current = true;
    clearPostDraft(profile.id);
    void deleteRemoteDraft(profile.id);
    resetComposerFields();
    setLastSavedAt(null);
    setHasStoredDraft(false);
    setConfirmDiscardOpen(false);
    toast.success("Rascunho descartado.");
    window.setTimeout(() => {
      suppressAutosaveRef.current = false;
    }, 300);
  };

  const handleContinueDraft = () => {
    if (!pendingDraftForRestore) return;
    suppressAutosaveRef.current = true;
    applyDraftSnapshot(pendingDraftForRestore);
    setPendingDraftForRestore(null);
    setSaveStatus("synced");
    window.setTimeout(() => {
      suppressAutosaveRef.current = false;
    }, 300);
  };

  const handleDismissDraftBanner = () => {
    setPendingDraftForRestore(null);
  };

  const formattedSavedAt = React.useMemo(() => {
    if (!lastSavedAt) return null;
    try {
      return new Date(lastSavedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  }, [lastSavedAt]);

  const saveStatusView = React.useMemo(() => {
    switch (saveStatus) {
      case "saving":
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          label: "Salvando…",
          className: "text-muted-foreground",
        };
      case "synced":
        return {
          icon: <CloudCheck className="h-3 w-3" />,
          label: formattedSavedAt
            ? `Sincronizado às ${formattedSavedAt}`
            : "Sincronizado",
          className: "text-emerald-600 dark:text-emerald-400",
        };
      case "offline":
        return {
          icon: <CloudOff className="h-3 w-3" />,
          label: "Offline — vamos sincronizar depois",
          className: "text-amber-600 dark:text-amber-400",
        };
      case "error":
        return {
          icon: <TriangleAlert className="h-3 w-3" />,
          label: "Erro ao sincronizar",
          className: "text-destructive",
        };
      default:
        return null;
    }
  }, [saveStatus, formattedSavedAt]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bottom-0 left-0 right-0 top-auto max-h-[92dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-b-none rounded-t-2xl border-x-0 border-b-0 p-0 sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:max-h-[88vh] sm:max-w-[760px] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border">
        <DialogHeader className="border-b border-border px-4 py-3 text-left sm:px-5 sm:py-4">
          <DialogTitle className="text-base font-semibold">
            {editPostId
              ? "Editar conteúdo territorial"
              : "Criar conteúdo territorial"}
          </DialogTitle>
          <DialogDescription className="pr-8 text-xs">
            Escolha o formato, escreva com clareza e confirme onde o conteúdo
            será exibido.
          </DialogDescription>
          {!editPostId && saveStatusView ? (
            <p
              className={cn(
                "mt-1 flex items-center gap-1.5 text-[11px]",
                saveStatusView.className,
              )}
              aria-live="polite"
            >
              {saveStatusView.icon}
              <span>{saveStatusView.label}</span>
            </p>
          ) : null}
        </DialogHeader>
        <div className="max-h-[calc(92dvh-7.5rem)] space-y-4 overflow-y-auto px-4 py-3 overscroll-contain sm:max-h-[70vh] sm:space-y-5 sm:px-5 sm:py-4">
          {!editPostId && pendingDraftForRestore ? (
            <div
              role="status"
              className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">Você tem um rascunho salvo</p>
                <p className="text-xs text-muted-foreground">
                  {formattedSavedAt
                    ? `Última edição às ${formattedSavedAt}. Continue de onde parou.`
                    : "Continue de onde parou."}
                </p>
              </div>
              <div className="flex gap-2 sm:shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleDismissDraftBanner}
                >
                  Ignorar
                </Button>
                <Button type="button" size="sm" onClick={handleContinueDraft}>
                  Continuar rascunho
                </Button>
              </div>
            </div>
          ) : null}
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
              <p className="text-xs text-muted-foreground">
                {selectedIntent.label}
              </p>
            </div>
            {effectiveProfile &&
              effectiveProfile.profile_type !== "personal" && (
                <div className="ml-auto">
                  <ActiveProfileBadge
                    profile={effectiveProfile}
                    action="publicando como"
                  />
                </div>
              )}
          </div>
          <section className="space-y-2">
            <button
              type="button"
              onClick={() => setIntentPickerExpanded((current) => !current)}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-card px-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-expanded={intentPickerExpanded}
              aria-controls={intentPickerId}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SelectedIntentIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">
                  Tipo de publicação
                </span>
                <span className="block truncate text-sm font-semibold">
                  {selectedIntent.label}
                </span>
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Alterar tipo
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  intentPickerExpanded && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>

            {intentPickerExpanded ? (
              <div
                id={intentPickerId}
                className="space-y-3 rounded-xl border border-border bg-card/60 p-3"
              >
                {INTENT_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <p className="text-[0.68rem] font-medium uppercase text-muted-foreground">
                      {group.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = item.id === intent;
                        return (
                          <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => {
                                  setIntent(item.id);
                                  setIntentPickerExpanded(false);
                                }}
                                className={cn(
                                  "min-h-11 rounded-lg border p-2.5 text-left transition-colors",
                                  active
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/40",
                                )}
                              >
                                <span className="flex items-center gap-2">
                                  <Icon
                                    className="h-4 w-4 shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span className="truncate text-xs font-semibold">
                                    {item.label}
                                  </span>
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="max-w-[280px] text-xs"
                            >
                              {item.tooltip}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
          {isPollIntent ? (
            <section className="space-y-3 rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-semibold">Enquete</p>
              <div>
                <label className="text-xs text-muted-foreground">
                  Pergunta
                </label>
                <Input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Qual pergunta você quer fazer?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Opções</label>
                {pollOptions.map((opt, idx) => (
                  <Input
                    key={`poll-opt-${idx}`}
                    value={opt}
                    onChange={(e) =>
                      setPollOptions((prev) =>
                        prev.map((item, i) =>
                          i === idx ? e.target.value : item,
                        ),
                      )
                    }
                    placeholder={`Opção ${idx + 1}`}
                  />
                ))}
                {pollOptions.length < 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setPollOptions((prev) => [...prev, ""])}
                  >
                    Adicionar opção
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Duração
                  </label>
                  <Select
                    value={pollDurationDays}
                    onValueChange={(v) =>
                      setPollDurationDays(v as typeof pollDurationDays)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POLL_DURATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">
                    Configuração
                  </label>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left text-sm",
                      pollAllowMultiple
                        ? "border-primary bg-primary/10"
                        : "border-border",
                    )}
                    onClick={() => setPollAllowMultiple((prev) => !prev)}
                  >
                    Múltipla escolha: {pollAllowMultiple ? "Sim" : "Não"}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left text-sm",
                      pollAllowComments
                        ? "border-primary bg-primary/10"
                        : "border-border",
                    )}
                    onClick={() => setPollAllowComments((prev) => !prev)}
                  >
                    Permitir comentários: {pollAllowComments ? "Sim" : "Não"}
                  </button>
                </div>
              </div>
            </section>
          ) : isProblemIntent ? (
            <section className="space-y-3 rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-semibold">Problema</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Localização
                  </label>
                  <Input
                    value={problemLocation}
                    onChange={(e) => setProblemLocation(e.target.value)}
                    placeholder="Rua, referência ou ponto crítico"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Categoria
                  </label>
                  <Input
                    value={problemCategory}
                    onChange={(e) => setProblemCategory(e.target.value)}
                    placeholder="Ex.: buraco, iluminação, lixo"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Gravidade
                  </label>
                  <Select
                    value={problemSeverity}
                    onValueChange={(v) =>
                      setProblemSeverity(v as typeof problemSeverity)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Recorrência
                  </label>
                  <Select
                    value={problemRecurrence}
                    onValueChange={(v) =>
                      setProblemRecurrence(v as typeof problemRecurrence)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pontual">Pontual</SelectItem>
                      <SelectItem value="frequente">Frequente</SelectItem>
                      <SelectItem value="constante">Constante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Descrição estruturada
                </label>
                <Textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Descreva o problema, impacto e contexto."
                  className="min-h-[120px]"
                />
              </div>
            </section>
          ) : isEventIntent ? (
            <section className="space-y-3 rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-semibold">Evento</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Data</label>
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Horário
                  </label>
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Local</label>
                  <Input
                    value={eventPlace}
                    onChange={(e) => setEventPlace(e.target.value)}
                    placeholder="Endereço ou ponto de encontro"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Limite de participantes (opcional)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={eventLimit}
                    onChange={(e) => setEventLimit(e.target.value)}
                    placeholder="Ex.: 30"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Descrição
                </label>
                <Textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Explique objetivo, público e orientações."
                  className="min-h-[120px]"
                />
              </div>
            </section>
          ) : isOpportunityIntent ? (
            <section className="space-y-3 rounded-lg border border-border bg-card p-3">
              <p className="text-sm font-semibold">Oportunidade</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Tipo de oportunidade
                  </label>
                  <Select
                    value={opportunityType}
                    onValueChange={(v) =>
                      setOpportunityType(v as WorkOpportunityType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPPORTUNITY_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Perfil profissional vinculado (opcional)
                  </label>
                  <Select
                    value={opportunityLinkedProfessionalId}
                    onValueChange={setOpportunityLinkedProfessionalId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem vincular perfil</SelectItem>
                      {ownedProfessionalProfiles.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.professional_name ?? "Perfil profissional"}{" "}
                          {item.service_category
                            ? `• ${item.service_category}`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingOwnedProfessionalProfiles ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Carregando seus perfis profissionais...
                    </p>
                  ) : null}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Categoria profissional
                </label>
                <Input
                  value={opportunityCategory}
                  onChange={(e) => setOpportunityCategory(e.target.value)}
                  placeholder="Ex.: pizzaiolo, pedreiro, eletricista"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Tipo de trabalho
                  </label>
                  <Input
                    value={opportunityWorkType}
                    onChange={(e) => setOpportunityWorkType(e.target.value)}
                    placeholder="Ex.: freela de garcom, diaria, ajudante"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Valor (opcional)
                  </label>
                  <Input
                    value={opportunityAmount}
                    onChange={(e) => setOpportunityAmount(e.target.value)}
                    placeholder="Ex.: R$ 150 diaria"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Urgencia
                  </label>
                  <Select
                    value={opportunityUrgency}
                    onValueChange={(v) =>
                      setOpportunityUrgency(v as typeof opportunityUrgency)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="24h">Proximas 24h</SelectItem>
                      <SelectItem value="semana">Nesta semana</SelectItem>
                      <SelectItem value="flexivel">Flexivel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Duração
                  </label>
                  <Input
                    value={opportunityDuration}
                    onChange={(e) => setOpportunityDuration(e.target.value)}
                    placeholder="Ex.: 1 dia, 3 dias, turno da noite"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Contato</label>
                <Input
                  value={opportunityContact}
                  onChange={(e) => setOpportunityContact(e.target.value)}
                  placeholder="Telefone, WhatsApp ou @usuário"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Descrição
                </label>
                <Textarea
                  value={opportunityDescription}
                  onChange={(e) => setOpportunityDescription(e.target.value)}
                  placeholder="Contexto da oportunidade e requisitos."
                  className="min-h-[100px]"
                />
              </div>
            </section>
          ) : (
            <section className="space-y-2">
              <p className="text-xs text-muted-foreground">Descrição</p>
              <Textarea
                value={genericDescription}
                onChange={(e) => setGenericDescription(e.target.value)}
                placeholder="Descreva o que deseja publicar no território."
                className="min-h-[140px]"
                maxLength={2000}
              />
              <p className="text-[11px] text-muted-foreground">
                {genericDescription.length}/2000
              </p>
            </section>
          )}
          {!editPostId ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Midia ({form.images.length}/{POST_LIMITS.MAX_IMAGES})
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={form.handleAddImage}
                  disabled={form.images.length >= POST_LIMITS.MAX_IMAGES}
                  aria-label="Adicionar imagens"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </div>
              {form.images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {form.images.map((img, i) => (
                    <div key={img} className="relative">
                      <img
                        src={img}
                        alt=""
                        className="h-16 w-16 rounded-lg border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => form.handleRemoveImage(i)}
                        className="absolute -top-1 -right-1 rounded-full bg-destructive p-0.5 text-white"
                        aria-label={`Remover imagem ${i + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}
          <section className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Distribuicao territorial
            </p>
            <div className="flex flex-wrap gap-2">
              {DISTRIBUTION_LEVEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setDistributionLevel(option.value);
                    form.setReach(reachFromTerritorialLevel(option.value));
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    distributionLevel === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:py-3">
          <p className="sr-only text-xs text-muted-foreground sm:not-sr-only">
            {publicationPermissionError
              ? publicationPermissionError
              : canPublish
                ? "Estrutura valida para publicação"
                : "Complete os campos obrigatórios"}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            {!editPostId && (hasStoredDraft || hasMeaningfulDraft(currentDraftPayload)) ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDiscardOpen(true)}
                disabled={publishing || savingDraft}
                className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-none"
              >
                Descartar
              </Button>
            ) : null}
            {!editPostId ? (
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={savingDraft || publishing}
                className="flex-1 sm:flex-none"
              >
                {savingDraft ? "Salvando..." : "Salvar rascunho"}
              </Button>
            ) : null}
            <Button
              onClick={handlePublish}
              disabled={!canPublish}
              className="flex-1 sm:flex-none"
            >
              {publishing
                ? editPostId
                  ? "Salvando..."
                  : "Publicando..."
                : editPostId
                  ? "Salvar"
                  : "Publicar"}
            </Button>
          </div>
        </div>
        {!editPostId ? (
          <input
            ref={form.fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={form.handleFileSelect}
          />
        ) : null}
      </DialogContent>
      <AlertDialog
        open={confirmDiscardOpen}
        onOpenChange={setConfirmDiscardOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar rascunho?</AlertDialogTitle>
            <AlertDialogDescription>
              O conteúdo salvo será apagado deste dispositivo e dos outros
              dispositivos sincronizados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter rascunho</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardDraft}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
