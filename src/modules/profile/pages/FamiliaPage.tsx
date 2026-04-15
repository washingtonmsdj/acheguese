import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Plus,
  MapPin,
  Battery,
  Settings,
  Bell,
  Shield,
  X,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { useAppUrls } from "@/core/routing/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  useFamilyConnections,
  useChildrenLocations,
  useLocationSharing,
  useGeofences,
  useLocationAlerts,
} from "@/core/family/hooks/useFamily";
import type {
  FamilyConnection,
  FamilyLocationData,
  FamilyRelationshipType,
} from "@/core/family/types";
import {
  resolveFamilyLocationPresence,
  type FamilyLocationPresence,
} from "@/core/family/utils/familyLocationStatus";
import { cn } from "@/shared/utils/cn";

const RELATIONSHIP_OPTIONS = ["pai", "mae", "responsavel"] as const satisfies readonly FamilyRelationshipType[];

function isFamilyRelationshipType(value: string): value is FamilyRelationshipType {
  return (RELATIONSHIP_OPTIONS as readonly string[]).includes(value);
}

function getLocationIdentity(location: FamilyLocationData): string | null {
  return location.profile_id ?? location.user_id ?? null;
}

function getChildLocation(
  child: FamilyConnection,
  locations: FamilyLocationData[],
): FamilyLocationData | undefined {
  const childIdentity = new Set(
    [child.child_profile_id, child.child_id].filter(
      (value): value is string => Boolean(value),
    ),
  );

  if (childIdentity.size === 0) return undefined;

  return locations.find((location) => {
    const locationIdentity = getLocationIdentity(location);
    return locationIdentity ? childIdentity.has(locationIdentity) : false;
  });
}

function formatPresenceText(presence: FamilyLocationPresence): string {
  if (presence.status === "online") return "Online";
  if (presence.status === "away") {
    return presence.minutesSinceUpdate === null
      ? "Atualizacao pendente"
      : `${presence.minutesSinceUpdate} min atras`;
  }
  return presence.minutesSinceUpdate === null
    ? "Offline"
    : `Offline ha ${presence.minutesSinceUpdate} min`;
}

function getPresenceColorClass(status: FamilyLocationPresence["status"]): string {
  if (status === "online") return "text-green-500";
  if (status === "away") return "text-yellow-500";
  return "text-gray-500";
}

function getPresenceDotClass(status: FamilyLocationPresence["status"]): string {
  if (status === "online") return "bg-green-500";
  if (status === "away") return "bg-yellow-500";
  return "bg-gray-400";
}

export default function FamiliaPage() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const {
    children,
    parents,
    pendingInvites,
    loading,
    sendInvite,
    acceptInvite,
    rejectInvite,
    removeConnection,
  } = useFamilyConnections();
  const { locations } = useChildrenLocations();
  const { settings, updateSettings } = useLocationSharing();
  const { geofences } = useGeofences();
  const { unreadCount } = useLocationAlerts();

  const [showAddChild, setShowAddChild] = useState(false);
  const [childEmail, setChildEmail] = useState("");
  const [relationship, setRelationship] = useState<FamilyRelationshipType>("pai");
  const [adding, setAdding] = useState(false);

  const handleAddChild = async () => {
    if (!childEmail.trim()) return;

    setAdding(true);
    const result = await sendInvite(childEmail, relationship);
    setAdding(false);

    if (result.success) {
      setChildEmail("");
      setShowAddChild(false);
      return;
    }

    toast.error(result.error || "Erro ao enviar convite");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20">
      <div className="border-b px-4 pb-2 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2"
              onClick={() => navigate(appUrls.profile.central)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
            <h1 className="flex items-center gap-2 font-display text-xl font-bold">
              <Users className="h-5 w-5" />
              Minha Familia
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie vinculos e rastreamento
            </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Bell className="h-3.5 w-3.5" />
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <div className="border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
          <p className="mb-2 text-sm font-medium text-yellow-700 dark:text-yellow-300">
            Voce tem {pendingInvites.length} convite(s) pendente(s)
          </p>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {invite.parent_profile?.name ?? "Responsavel"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Quer rastrear sua localizacao
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectInvite(invite.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => acceptInvite(invite.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 px-4 py-4">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold">
              Filhos vinculados ({children.length})
            </h2>
            <Dialog open={showAddChild} onOpenChange={setShowAddChild}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar filho</DialogTitle>
                </DialogHeader>
                <DialogDescription className="sr-only">
                  Adicionar membro da familia
                </DialogDescription>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Email do filho
                    </label>
                    <Input
                      type="email"
                      placeholder="filho@email.com"
                      value={childEmail}
                      onChange={(event) => setChildEmail(event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Relacao
                    </label>
                    <Select
                      value={relationship}
                      onValueChange={(value) => {
                        if (isFamilyRelationshipType(value)) {
                          setRelationship(value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pai">Pai</SelectItem>
                        <SelectItem value="mae">Mae</SelectItem>
                        <SelectItem value="responsavel">Responsavel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAddChild}
                    disabled={adding}
                  >
                    {adding ? "Enviando..." : "Enviar convite"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {children.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="mb-3 text-sm text-muted-foreground">
                Nenhum filho vinculado ainda
              </p>
              <Button size="sm" onClick={() => setShowAddChild(true)}>
                Adicionar primeiro filho
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {children.map((child) => {
                const location = getChildLocation(child, locations);
                const presence = resolveFamilyLocationPresence(location);

                return (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          {child.child_profile?.avatar_url ? (
                            <img
                              src={child.child_profile.avatar_url}
                              alt={child.child_profile.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
                              getPresenceDotClass(presence.status),
                            )}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <h3 className="text-sm font-bold">
                              {child.child_profile?.name ?? "Perfil vinculado"}
                            </h3>
                            {child.relationship_type && (
                              <Badge variant="outline" className="text-xs">
                                {child.relationship_type}
                              </Badge>
                            )}
                          </div>

                          <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span
                              className={cn(
                                "flex items-center gap-1",
                                getPresenceColorClass(presence.status),
                              )}
                            >
                              <div className="h-2 w-2 rounded-full bg-current" />
                              {formatPresenceText(presence)}
                            </span>
                            {typeof location?.battery_level === "number" && (
                              <span className="flex items-center gap-1">
                                <Battery className="h-3 w-3" />
                                {location.battery_level}%
                              </span>
                            )}
                          </div>

                          {location && (
                            <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              Lat: {location.latitude.toFixed(4)}, Lng:{" "}
                              {location.longitude.toFixed(4)}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => navigate(appUrls.map)}
                              disabled={!location}
                            >
                              <MapPin className="mr-1 h-3 w-3" />
                              Ver no mapa
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {parents.length > 0 && (
          <div>
            <h2 className="mb-3 text-base font-bold">
              Quem me rastreia ({parents.length})
            </h2>
            <div className="space-y-2">
              {parents.map((parent) => (
                <Card key={parent.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {parent.parent_profile?.name ?? "Responsavel"}
                        </p>
                        {parent.relationship_type && (
                          <p className="text-xs text-muted-foreground">
                            {parent.relationship_type}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeConnection(parent.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {geofences.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">
                Zonas seguras ({geofences.length})
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {geofences.slice(0, 4).map((zone) => (
                <Card key={zone.id} className="p-3">
                  <div className="mb-1 text-2xl">{zone.icon ?? ""}</div>
                  <p className="truncate text-sm font-medium">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {zone.radius_meters ?? zone.radius}m
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {settings && (
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Compartilhamento de localizacao
              </h3>
              <Button
                size="sm"
                variant={settings.enabled ? "default" : "outline"}
                onClick={() => updateSettings({ enabled: !settings.enabled })}
              >
                {settings.enabled ? "Ativo" : "Pausado"}
              </Button>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Frequencia de atualizacao</span>
                <span className="font-medium">
                  {settings.update_frequency / 60} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Modo economia de bateria</span>
                <span className="font-medium">
                  {settings.battery_saver_mode ? "Sim" : "Nao"}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
