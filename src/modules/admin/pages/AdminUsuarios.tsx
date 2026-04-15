import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Users, Shield, Ban, Crown, CheckCircle,
  MoreVertical, ChevronLeft, ChevronRight, Mail, Phone,
  MapPin, Calendar, Layers, User, Car, Building2,
  Briefcase, X, AlertTriangle, Clock, Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/shared/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/shared/components/ui/dialog";
import { Separator } from "@/shared/components/ui/separator";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/utils/cn";
import { useSessionContext } from "@/core/session";
import {
  AdminUserService,
  type AdminUser,
  type AdminUserProfile,
} from "@/core/admin/services/AdminUserService";
import { UserReputationManager } from "@/modules/admin/components/UserReputationManager";

const PAGE_SIZE = 20;

const PROFILE_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  personal:     { label: "Pessoal",      icon: User,       color: "text-blue-500 bg-blue-500/10" },
  driver:       { label: "Motorista",    icon: Car,        color: "text-orange-500 bg-orange-500/10" },
  business:     { label: "Empresa",      icon: Building2,  color: "text-purple-500 bg-purple-500/10" },
  professional: { label: "Profissional", icon: Briefcase,  color: "text-teal-500 bg-teal-500/10" },
  community:    { label: "Comunidade",   icon: Users,      color: "text-green-500 bg-green-500/10" },
};

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function AdminUsuarios() {
  const { activeProfile } = useSessionContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [filter, setFilter] = useState<"all" | "verified" | "suspended" | "admin">("all");
  const [suspendDialogUser, setSuspendDialogUser] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => AdminUserService.listUsers(page, PAGE_SIZE, search || undefined),
    staleTime: 30_000,
  });

  const refetchList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  }, [queryClient]);

  const users = (data?.users ?? []).filter((u) => {
    if (filter === "verified") return u.primary_profile.verified;
    if (filter === "suspended") return u.primary_profile.is_suspended;
    if (filter === "admin") return u.roles.some((r) => ["admin", "super_admin"].includes(r));
    return true;
  });

  const stats = {
    total: data?.total ?? 0,
    verified: data?.users.filter((u) => u.primary_profile.verified).length ?? 0,
    suspended: data?.users.filter((u) => u.primary_profile.is_suspended).length ?? 0,
    admins: data?.users.filter((u) => u.roles.some((r) => ["admin", "super_admin"].includes(r))).length ?? 0,
  };

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => {
      const until = new Date();
      until.setDate(until.getDate() + 7);
      return AdminUserService.suspendUser(userId, reason, until);
    },
    onSuccess: (_, vars) => {
      toast({ title: "Usuário suspenso por 7 dias" });
      setSuspendDialogUser(null);
      setSuspendReason("");
      refetchList();
      if (selectedUser?.user_id === vars.userId) {
        AdminUserService.getUserById(vars.userId).then((u) => u && setSelectedUser(u));
      }
    },
    onError: (e: any) => toast({ title: "Erro ao suspender", description: e.message, variant: "destructive" }),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (userId: string) => AdminUserService.unsuspendUser(userId),
    onSuccess: (_, userId) => {
      toast({ title: "Suspensão removida" });
      refetchList();
      if (selectedUser?.user_id === userId) {
        AdminUserService.getUserById(userId).then((u) => u && setSelectedUser(u));
      }
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const verifyMutation = useMutation({
    mutationFn: (profileId: string) => AdminUserService.verifyUser(profileId),
    onSuccess: (_, profileId) => {
      toast({ title: "Perfil verificado" });
      refetchList();
      if (selectedUser) {
        AdminUserService.getUserById(selectedUser.user_id).then((u) => u && setSelectedUser(u));
      }
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Gestão de Usuários
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cada linha representa uma conta única — múltiplos perfis agrupados
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { key: "all",       label: "Total",      value: stats.total,     icon: Users,  color: "text-foreground"   },
          { key: "verified",  label: "Verificados", value: stats.verified,  icon: Shield, color: "text-green-500"    },
          { key: "suspended", label: "Suspensos",   value: stats.suspended, icon: Ban,    color: "text-destructive"  },
          { key: "admin",     label: "Admins",      value: stats.admins,    icon: Crown,  color: "text-primary"      },
        ] as const).map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={cn(
              "bg-card rounded-xl border p-4 text-left transition-all hover:shadow-sm",
              filter === s.key ? "border-primary ring-1 ring-primary/20" : "hover:border-border/80",
            )}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn("h-4 w-4", s.color)} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou username..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "verified", "suspended", "admin"] as const).map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
              onClick={() => setFilter(f)}>
              {{ all: "Todos", verified: "Verificados", suspended: "Suspensos", admin: "Admins" }[f]}
            </Button>
          ))}
        </div>
      </div>

      {/* Layout principal */}
      <div className={cn("grid gap-5 transition-all", selectedUser ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1")}>

        {/* Lista */}
        <div className={cn(selectedUser ? "lg:col-span-2" : "lg:col-span-1")}>
          <Card className="h-full">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {isLoading ? "Carregando..." : `${users.length} usuário(s)`}
                </CardTitle>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Button variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span>{page + 1}/{totalPages}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              {error ? (
                <div className="text-center py-10 px-4">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive font-medium">Erro ao carregar</p>
                  <p className="text-xs text-muted-foreground mt-1">Verifique VITE_SUPABASE_SERVICE_ROLE_KEY</p>
                </div>
              ) : isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-10">
                  <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="space-y-0.5 max-h-[calc(100vh-380px)] overflow-y-auto">
                  {users.map((user) => (
                    <UserRow key={user.user_id} user={user}
                      selected={selectedUser?.user_id === user.user_id}
                      compact={!!selectedUser}
                      onSelect={() => setSelectedUser(user)}
                      onSuspend={() => { setSuspendDialogUser(user); setSuspendReason(""); }}
                      onUnsuspend={() => unsuspendMutation.mutate(user.user_id)}
                      onVerify={() => verifyMutation.mutate(user.primary_profile.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel de detalhe */}
        {selectedUser && (
          <div className="lg:col-span-3">
            <UserDetailPanel
              user={selectedUser}
              onClose={() => setSelectedUser(null)}
              onSuspend={() => { setSuspendDialogUser(selectedUser); setSuspendReason(""); }}
              onUnsuspend={() => unsuspendMutation.mutate(selectedUser.user_id)}
              onVerify={(profileId) => verifyMutation.mutate(profileId)}
              onUpdate={() => {
                refetchList();
                AdminUserService.getUserById(selectedUser.user_id).then((u) => u && setSelectedUser(u));
              }}
            />
          </div>
        )}
      </div>

      {/* Dialog de suspensão com motivo */}
      <Dialog open={!!suspendDialogUser} onOpenChange={(o) => !o && setSuspendDialogUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Suspender usuário</DialogTitle>
            <DialogDescription>
              {suspendDialogUser?.primary_profile.name} será suspenso por 7 dias.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <label className="text-xs font-medium text-muted-foreground">Motivo *</label>
            <Input
              placeholder="Ex: Violação dos termos de uso"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setSuspendDialogUser(null)}>
                Cancelar
              </Button>
              <Button size="sm" variant="destructive"
                disabled={!suspendReason.trim() || suspendMutation.isPending}
                onClick={() => suspendDialogUser && suspendMutation.mutate({
                  userId: suspendDialogUser.user_id,
                  reason: suspendReason,
                })}>
                Suspender
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── UserRow ─────────────────────────────────────────────────────────────────

interface UserRowProps {
  user: AdminUser;
  selected: boolean;
  compact: boolean;
  onSelect: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onVerify: () => void;
}

function UserRow({ user, selected, compact, onSelect, onSuspend, onUnsuspend, onVerify }: UserRowProps) {
  const p = user.primary_profile;
  const isSuspended = p.is_suspended;
  const isAdmin = user.roles.some((r) => ["admin", "super_admin"].includes(r));

  return (
    <div onClick={onSelect}
      className={cn(
        "flex items-center gap-2.5 px-2 py-2.5 rounded-lg cursor-pointer transition-all group",
        selected ? "bg-primary/8 border border-primary/30" : "hover:bg-muted/50 border border-transparent",
        isSuspended && "opacity-60",
      )}>
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={p.avatar_url ?? undefined} />
        <AvatarFallback className="text-xs font-semibold">{(p.name ?? "?")[0].toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm font-medium truncate">{p.name || "Sem nome"}</span>
          {p.verified && <Shield className="h-3 w-3 text-green-500 shrink-0" />}
          {isSuspended && <Ban className="h-3 w-3 text-destructive shrink-0" />}
          {isAdmin && <Crown className="h-3 w-3 text-primary shrink-0" />}
        </div>
        {!compact && (
          <p className="text-xs text-muted-foreground truncate">{user.email || "Sem email"}</p>
        )}
        {user.profiles.length > 1 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            <Layers className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{user.profiles.length} perfis</span>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {!p.verified && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onVerify(); }}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Verificar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {isSuspended ? (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUnsuspend(); }}>
              <CheckCircle className="h-4 w-4 mr-2" /> Remover suspensão
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onSuspend(); }}>
              <Ban className="h-4 w-4 mr-2" /> Suspender
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── UserDetailPanel ──────────────────────────────────────────────────────────

interface UserDetailPanelProps {
  user: AdminUser;
  onClose: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onVerify: (profileId: string) => void;
  onUpdate: () => void;
}

function UserDetailPanel({ user, onClose, onSuspend, onUnsuspend, onVerify, onUpdate }: UserDetailPanelProps) {
  const p = user.primary_profile;
  const isSuspended = p.is_suspended;
  const isAdmin = user.roles.some((r) => ["admin", "super_admin"].includes(r));

  return (
    <Card className="h-full">
      {/* Header do painel */}
      <div className="flex items-start gap-4 p-5 border-b">
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarImage src={p.avatar_url ?? undefined} />
          <AvatarFallback className="text-lg font-bold">{(p.name ?? "?")[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-bold text-base leading-tight">{p.name}</h2>
              <p className="text-xs text-muted-foreground">@{p.username}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mt-0.5" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {p.verified && (
              <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 gap-0.5">
                <Shield className="h-2.5 w-2.5" /> Verificado
              </Badge>
            )}
            {isSuspended && (
              <Badge variant="destructive" className="text-[10px] gap-0.5">
                <Ban className="h-2.5 w-2.5" /> Suspenso
              </Badge>
            )}
            {isAdmin && (
              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 gap-0.5">
                <Crown className="h-2.5 w-2.5" /> Admin
              </Badge>
            )}
            {!user.email_confirmed && (
              <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-500/30 gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" /> Email não confirmado
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="flex-1">
        <TabsList className="w-full rounded-none border-b bg-transparent h-10 px-4 justify-start gap-1">
          <TabsTrigger value="info" className="text-xs h-8 data-[state=active]:bg-muted rounded-md px-3">
            Conta
          </TabsTrigger>
          <TabsTrigger value="profiles" className="text-xs h-8 data-[state=active]:bg-muted rounded-md px-3">
            Perfis ({user.profiles.length})
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs h-8 data-[state=active]:bg-muted rounded-md px-3">
            Ações
          </TabsTrigger>
        </TabsList>

        {/* Tab: Conta */}
        <TabsContent value="info" className="p-4 space-y-4 mt-0">
          <div className="space-y-2.5">
            <InfoRow icon={Mail} label="Email" value={user.email || "—"} />
            <InfoRow icon={Phone} label="Telefone" value={user.phone || "—"} />
            <InfoRow icon={MapPin} label="Localização"
              value={[p.neighborhood, p.city].filter(Boolean).join(", ") || "—"} />
            <InfoRow icon={Calendar} label="Cadastro" value={fmt(user.created_at)} />
            <InfoRow icon={Clock} label="Último acesso" value={fmt(user.last_sign_in_at)} />
            <InfoRow icon={Star} label="Reputação" value={String(p.reputation)} />
          </div>

          {isSuspended && p.suspension_reason && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-xs font-medium text-destructive mb-1">Motivo da suspensão</p>
              <p className="text-xs text-muted-foreground">{p.suspension_reason}</p>
              {p.suspended_until && (
                <p className="text-xs text-muted-foreground mt-1">
                  Até: {fmt(p.suspended_until)}
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Tab: Perfis */}
        <TabsContent value="profiles" className="p-4 mt-0 space-y-3">
          {user.profiles.map((prof) => (
            <ProfileCard
              key={prof.id}
              profile={prof}
              onVerify={() => onVerify(prof.id)}
            />
          ))}
        </TabsContent>

        {/* Tab: Ações */}
        <TabsContent value="actions" className="p-4 mt-0 space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Moderação</p>
            {isSuspended ? (
              <Button variant="outline" className="w-full justify-start gap-2" onClick={onUnsuspend}>
                <CheckCircle className="h-4 w-4 text-green-500" /> Remover suspensão
              </Button>
            ) : (
              <Button variant="outline" className="w-full justify-start gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={onSuspend}>
                <Ban className="h-4 w-4" /> Suspender usuário (7 dias)
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reputação</p>
            <UserReputationManager
              userId={p.id}
              currentReputation={p.reputation}
              userName={p.name}
              onUpdate={onUpdate}
            />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// ─── ProfileCard ──────────────────────────────────────────────────────────────

function ProfileCard({ profile, onVerify }: { profile: AdminUserProfile; onVerify: () => void }) {
  const config = PROFILE_TYPE_CONFIG[profile.profile_type] ?? PROFILE_TYPE_CONFIG.personal;
  const Icon = config.icon;

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", config.color)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">{profile.name}</p>
            <p className="text-xs text-muted-foreground">@{profile.username} · {config.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {profile.verified
            ? <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 gap-0.5">
                <Shield className="h-2.5 w-2.5" /> Verificado
              </Badge>
            : <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"
                onClick={onVerify}>
                <CheckCircle className="h-3 w-3" /> Verificar
              </Button>
          }
          {profile.is_suspended && (
            <Badge variant="destructive" className="text-[10px]">Suspenso</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t">
        <div>
          <p className="text-xs font-semibold">{profile.reputation}</p>
          <p className="text-[10px] text-muted-foreground">Reputação</p>
        </div>
        <div>
          <p className="text-xs font-semibold">{profile.city || "—"}</p>
          <p className="text-[10px] text-muted-foreground">Cidade</p>
        </div>
        <div>
          <p className="text-xs font-semibold">{fmt(profile.created_at)}</p>
          <p className="text-[10px] text-muted-foreground">Criado</p>
        </div>
      </div>
    </div>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="text-xs font-medium truncate">{value}</span>
    </div>
  );
}
