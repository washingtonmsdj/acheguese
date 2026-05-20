import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  AdminCommunicationTerritorialService,
  CHANNEL_KIND_LABELS,
  CommunicationTerritorialService,
  getCommunicationErrorMessage,
  type ChannelStatus,
} from "@/core/communication-territorial";
import { PublicIdentityService } from "@/core/public-identity";

const CHANNEL_STATUSES: ChannelStatus[] = ["active", "restricted", "suspended", "pending_verification", "rejected"];

export default function AdminComunicacao() {
  const queryClient = useQueryClient();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [approvalPayloads, setApprovalPayloads] = useState<Record<string, {
    slug?: string;
    legal_name?: string;
    admin_notes?: string;
  }>>({});
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [newTerritoryLocationId, setNewTerritoryLocationId] = useState("");
  const [newTerritoryRole, setNewTerritoryRole] = useState<"primary" | "coverage" | "temporary">("coverage");

  const requests = useQuery({
    queryKey: ["admin", "communication", "requests"],
    queryFn: () => AdminCommunicationTerritorialService.listRequests("pending"),
  });

  const channels = useQuery({
    queryKey: ["admin", "communication", "channels"],
    queryFn: () => AdminCommunicationTerritorialService.listChannels(),
  });

  const audit = useQuery({
    queryKey: ["admin", "communication", "audit"],
    queryFn: () => AdminCommunicationTerritorialService.listAudit(),
  });

  const locations = useQuery({
    queryKey: ["admin", "communication", "locations"],
    queryFn: () => CommunicationTerritorialService.listLocations(),
  });

  const territories = useQuery({
    queryKey: ["admin", "communication", "territories", selectedChannelId],
    queryFn: () => AdminCommunicationTerritorialService.listChannelTerritories(selectedChannelId!),
    enabled: !!selectedChannelId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "communication"] });
  };

  const approve = useMutation({
    mutationFn: ({ requestId, payload }: { requestId: string; payload?: { slug?: string; legal_name?: string; admin_notes?: string } }) =>
      AdminCommunicationTerritorialService.approveRequest(requestId, payload ?? {}),
    onSuccess: (_, input) => {
      toast.success("Canal aprovado e ativado.");
      setApprovalPayloads((current) => {
        const next = { ...current };
        delete next[input.requestId];
        return next;
      });
      invalidate();
    },
    onError: (error) => toast.error(getCommunicationErrorMessage(error, "Falha ao aprovar solicitacao.")),
  });

  const reject = useMutation({
    mutationFn: (requestId: string) => AdminCommunicationTerritorialService.rejectRequest(requestId, rejectNotes[requestId] ?? "Rejeitado pelo admin"),
    onSuccess: () => { toast.success("Solicitacao rejeitada."); invalidate(); },
    onError: (error) => toast.error(getCommunicationErrorMessage(error, "Falha ao rejeitar solicitacao.")),
  });

  const updateStatus = useMutation({
    mutationFn: ({ channelId, status }: { channelId: string; status: ChannelStatus }) =>
      AdminCommunicationTerritorialService.updateChannelStatus(channelId, status),
    onSuccess: () => { toast.success("Status atualizado."); invalidate(); },
    onError: (error) => toast.error(getCommunicationErrorMessage(error, "Falha ao atualizar status do canal.")),
  });

  const updateTerritory = useMutation({
    mutationFn: (input: {
      territoryId: string;
      channelId: string;
      territoryRole?: "primary" | "coverage" | "temporary";
      can_publish?: boolean;
      can_alert?: boolean;
      can_push?: boolean;
    }) =>
      AdminCommunicationTerritorialService.updateTerritoryPermissions(input),
    onSuccess: () => {
      toast.success("Permissao territorial atualizada.");
      invalidate();
    },
    onError: (error) =>
      toast.error(getCommunicationErrorMessage(error, "Falha ao atualizar permissao territorial.")),
  });

  const addTerritory = useMutation({
    mutationFn: (input: { channelId: string; locationId: string; territoryRole: "primary" | "coverage" | "temporary" }) =>
      AdminCommunicationTerritorialService.addTerritory({
        channelId: input.channelId,
        locationId: input.locationId,
        territoryRole: input.territoryRole,
      }),
    onSuccess: () => {
      toast.success("Territorio adicionado ao canal.");
      setNewTerritoryLocationId("");
      setNewTerritoryRole("coverage");
      invalidate();
    },
    onError: (error) => toast.error(getCommunicationErrorMessage(error, "Falha ao adicionar territorio.")),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comunicacao Territorial</h1>
        <p className="text-sm text-muted-foreground">Governanca de canais comunitarios, solicitacoes, territorios e auditoria.</p>
      </div>
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Solicitacoes</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="space-y-4">
          {(requests.data ?? []).map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{request.public_name}</CardTitle>
                    <CardDescription>{CHANNEL_KIND_LABELS[request.channel_kind]} - {request.contact_email}</CardDescription>
                  </div>
                  <Badge>{request.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{request.description}</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    placeholder="Slug opcional (automatico se vazio)"
                    value={approvalPayloads[request.id]?.slug ?? ""}
                    onChange={(event) =>
                      setApprovalPayloads({
                        ...approvalPayloads,
                        [request.id]: {
                          ...approvalPayloads[request.id],
                          slug: PublicIdentityService.normalize(
                            event.target.value,
                            "communication_channel",
                          ),
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="Nome legal (opcional)"
                    value={approvalPayloads[request.id]?.legal_name ?? ""}
                    onChange={(event) =>
                      setApprovalPayloads({
                        ...approvalPayloads,
                        [request.id]: {
                          ...approvalPayloads[request.id],
                          legal_name: event.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="Nota admin (opcional)"
                    value={approvalPayloads[request.id]?.admin_notes ?? ""}
                    onChange={(event) =>
                      setApprovalPayloads({
                        ...approvalPayloads,
                        [request.id]: {
                          ...approvalPayloads[request.id],
                          admin_notes: event.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <Input placeholder="Nota de rejeicao" value={rejectNotes[request.id] ?? ""} onChange={(e) => setRejectNotes({ ...rejectNotes, [request.id]: e.target.value })} />
                  <Button
                    onClick={() =>
                      approve.mutate({
                        requestId: request.id,
                        payload: {
                          slug: approvalPayloads[request.id]?.slug?.trim() || undefined,
                          legal_name: approvalPayloads[request.id]?.legal_name?.trim() || undefined,
                          admin_notes: approvalPayloads[request.id]?.admin_notes?.trim() || undefined,
                        },
                      })
                    }
                    disabled={approve.isPending}
                  >
                    Aprovar
                  </Button>
                  <Button variant="destructive" onClick={() => reject.mutate(request.id)} disabled={reject.isPending}>Rejeitar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!requests.isLoading && !requests.data?.length ? <p className="text-sm text-muted-foreground">Nenhuma solicitacao pendente.</p> : null}
        </TabsContent>
        <TabsContent value="channels" className="space-y-4">
          {(channels.data ?? []).map((channel) => (
            <Card key={channel.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{channel.public_name}</CardTitle>
                    <CardDescription>/{channel.slug} - {CHANNEL_KIND_LABELS[channel.channel_kind]}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{channel.status}</Badge>
                    <Badge variant="secondary">Score {channel.reliability_score}</Badge>
                    <Badge variant="outline">Alertas em preparacao</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {CHANNEL_STATUSES.map((status) => (
                  <Button key={status} variant={channel.status === status ? "default" : "outline"} size="sm" onClick={() => updateStatus.mutate({ channelId: channel.id, status })}>
                    {status}
                  </Button>
                ))}
                <Button variant="secondary" size="sm" onClick={() => setSelectedChannelId(channel.id)}>
                  Gerir territorios
                </Button>
              </CardContent>
              {selectedChannelId === channel.id ? (
                <CardContent className="space-y-2 border-t">
                  <p className="text-xs text-muted-foreground">`can_alert` e `can_push` estao em preparacao no MVP.</p>
                  <div className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1fr_180px_auto]">
                    <div className="space-y-1">
                      <Label htmlFor={`location-${channel.id}`}>Novo territorio</Label>
                      <Select value={newTerritoryLocationId} onValueChange={setNewTerritoryLocationId}>
                        <SelectTrigger id={`location-${channel.id}`}>
                          <SelectValue placeholder="Selecione a localidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {(locations.data ?? []).map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.full_name ?? location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`role-${channel.id}`}>Papel</Label>
                      <Select
                        value={newTerritoryRole}
                        onValueChange={(value) => setNewTerritoryRole(value as "primary" | "coverage" | "temporary")}
                      >
                        <SelectTrigger id={`role-${channel.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">primary</SelectItem>
                          <SelectItem value="coverage">coverage</SelectItem>
                          <SelectItem value="temporary">temporary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        onClick={() =>
                          addTerritory.mutate({
                            channelId: channel.id,
                            locationId: newTerritoryLocationId,
                            territoryRole: newTerritoryRole,
                          })
                        }
                        disabled={!newTerritoryLocationId || addTerritory.isPending}
                      >
                        Adicionar territorio
                      </Button>
                    </div>
                  </div>
                  {(territories.data ?? []).map((territory) => (
                    <div key={territory.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
                      <div className="text-sm">
                        <p className="font-medium">
                          {locations.data?.find((location) => location.id === territory.location_id)?.full_name ?? territory.location_id}
                        </p>
                        <p className="text-xs text-muted-foreground">role: {territory.territory_role}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Select
                          value={territory.territory_role}
                          onValueChange={(value) =>
                            updateTerritory.mutate({
                              territoryId: territory.id,
                              channelId: channel.id,
                              territoryRole: value as "primary" | "coverage" | "temporary",
                            })
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="primary">primary</SelectItem>
                            <SelectItem value="coverage">coverage</SelectItem>
                            <SelectItem value="temporary">temporary</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant={territory.can_publish ? "default" : "outline"}
                          onClick={() =>
                            updateTerritory.mutate({
                              territoryId: territory.id,
                              channelId: channel.id,
                              can_publish: !territory.can_publish,
                            })
                          }
                        >
                          can_publish: {territory.can_publish ? "on" : "off"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateTerritory.mutate({
                              territoryId: territory.id,
                              channelId: channel.id,
                              can_alert: !territory.can_alert,
                            })
                          }
                        >
                          can_alert: {territory.can_alert ? "on" : "off"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateTerritory.mutate({
                              territoryId: territory.id,
                              channelId: channel.id,
                              can_push: !territory.can_push,
                            })
                          }
                        >
                          can_push: {territory.can_push ? "on" : "off"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!territories.isLoading && !territories.data?.length ? (
                    <p className="text-sm text-muted-foreground">Canal sem territorios vinculados.</p>
                  ) : null}
                </CardContent>
              ) : null}
              {selectedChannelId === channel.id ? (
                <CardContent className="pt-0">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedChannelId(null)}>
                    Fechar territorios
                  </Button>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="audit" className="space-y-2">
          {(audit.data ?? []).map((entry) => (
            <div key={entry.id} className="rounded-lg border bg-card px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{entry.action_type}</span>
                <span className="text-muted-foreground">{new Date(entry.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(entry.metadata, null, 2)}</pre>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
