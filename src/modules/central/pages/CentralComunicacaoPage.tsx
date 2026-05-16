import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  CommunicationTerritorialService,
  COMMUNICATION_CONTENT_FORMAT_LABELS,
  PUBLICATION_TYPE_LABELS,
  getCommunicationErrorMessage,
  type CommunicationContentFormat,
  type PublicationType,
} from "@/core/communication-territorial";

const PUBLICATION_TYPES = Object.keys(PUBLICATION_TYPE_LABELS) as PublicationType[];
const CONTENT_FORMATS = Object.keys(COMMUNICATION_CONTENT_FORMAT_LABELS) as CommunicationContentFormat[];

export default function CentralComunicacaoPage() {
  const queryClient = useQueryClient();
  const [publishNow, setPublishNow] = useState(true);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [form, setForm] = useState({
    channel_id: "",
    location_id: "",
    publication_type: "news" as PublicationType,
    content_format: "article" as CommunicationContentFormat,
    title: "",
    summary: "",
    body: "",
    source_url: "",
  });

  const channels = useQuery({
    queryKey: ["central", "communication", "channels"],
    queryFn: () => CommunicationTerritorialService.listManagedChannels(),
  });

  const territories = useQuery({
    queryKey: ["central", "communication", "territories", form.channel_id],
    queryFn: () => CommunicationTerritorialService.listAuthorizedTerritories(form.channel_id),
    enabled: !!form.channel_id,
  });

  const selectedChannel = useMemo(
    () => channels.data?.find((channel) => channel.id === form.channel_id),
    [channels.data, form.channel_id],
  );
  const hasAuthorizedTerritories = (territories.data?.length ?? 0) > 0;

  const drafts = useQuery({
    queryKey: ["central", "communication", "drafts", form.channel_id],
    queryFn: () =>
      CommunicationTerritorialService.listPublications({
        channelId: form.channel_id,
        status: "draft",
        limit: 20,
      }),
    enabled: !!form.channel_id,
  });

  const createPublication = useMutation({
    mutationFn: async () => {
      const created = await CommunicationTerritorialService.createPublication(form);
      if (publishNow) await CommunicationTerritorialService.publishPublication(created.publication_id);
      return created;
    },
    onSuccess: () => {
      toast.success(publishNow ? "Publicacao criada e publicada." : "Rascunho criado.");
      queryClient.invalidateQueries({ queryKey: ["central", "communication"] });
      setForm({ channel_id: form.channel_id, location_id: "", publication_type: "news", content_format: "article", title: "", summary: "", body: "", source_url: "" });
    },
    onError: (error) => toast.error(getCommunicationErrorMessage(error, "Falha ao criar publicacao.")),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (selectedChannel && !hasAuthorizedTerritories) {
      toast.error("Este canal ainda não possui território autorizado para publicar.");
      return;
    }
    if (editingDraftId) {
      updateDraft.mutate();
      return;
    }
    createPublication.mutate();
  };

  const updateDraft = useMutation({
    mutationFn: async () => {
      await CommunicationTerritorialService.updateDraftPublication({
        publication_id: editingDraftId!,
        ...form,
      });
      if (publishNow) await CommunicationTerritorialService.publishPublication(editingDraftId!);
    },
    onSuccess: () => {
      toast.success(publishNow ? "Rascunho atualizado e publicado." : "Rascunho atualizado.");
      queryClient.invalidateQueries({ queryKey: ["central", "communication"] });
      setEditingDraftId(null);
      setForm({
        channel_id: form.channel_id,
        location_id: "",
        publication_type: "news",
        content_format: "article",
        title: "",
        summary: "",
        body: "",
        source_url: "",
      });
    },
    onError: (error) => toast.error(getCommunicationErrorMessage(error, "Falha ao atualizar rascunho.")),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Central de Comunicacao</h1>
        <p className="text-sm text-muted-foreground">
          Crie materias/reportagens ou postagens simples. O conteudo publicado e distribuido para a comunidade territorial autorizada.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {(channels.data ?? []).map((channel) => (
          <Card key={channel.id} className={form.channel_id === channel.id ? "border-primary" : undefined}>
            <CardHeader>
              <CardTitle className="text-lg">{channel.public_name}</CardTitle>
              <CardDescription>/{channel.slug}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge>{channel.verification_status}</Badge>
                <Badge variant="secondary">Score {channel.reliability_score}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => setForm({ ...form, channel_id: channel.id, location_id: "" })}>
                Operar este canal
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {!channels.isLoading && !channels.data?.length ? (
        <Card><CardContent className="py-8 text-sm text-muted-foreground">Voce ainda nao opera nenhum canal ativo aprovado.</CardContent></Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Nova publicação editorial</CardTitle>
          <CardDescription>
            Publicação fora de território autorizado será recusada pelo banco. Alertas urgentes e push não estão ativos no MVP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select value={form.channel_id} onValueChange={(value) => setForm({ ...form, channel_id: value, location_id: "" })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
                  <SelectContent>
                    {(channels.data ?? []).map((channel) => <SelectItem key={channel.id} value={channel.id}>{channel.public_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Território autorizado</Label>
                <Select value={form.location_id} onValueChange={(value) => setForm({ ...form, location_id: value })} disabled={!selectedChannel}>
                  <SelectTrigger><SelectValue placeholder="Selecione o território" /></SelectTrigger>
                  <SelectContent>
                    {(territories.data ?? []).map((territory) => (
                      <SelectItem key={territory.id} value={territory.location_id}>{territory.location?.full_name ?? territory.location?.name ?? territory.location_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedChannel && !territories.isLoading && !hasAuthorizedTerritories ? (
                  <p className="text-xs text-amber-700">
                    Este canal nao tem territorio com permissao de publicacao. Solicite liberacao no admin.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.publication_type} onValueChange={(value) => setForm({ ...form, publication_type: value as PublicationType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PUBLICATION_TYPES.map((type) => <SelectItem key={type} value={type}>{PUBLICATION_TYPE_LABELS[type]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato de consumo</Label>
                <Select
                  value={form.content_format}
                  onValueChange={(value) => setForm({ ...form, content_format: value as CommunicationContentFormat })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_FORMATS.map((format) => (
                      <SelectItem key={format} value={format}>
                        {COMMUNICATION_CONTENT_FORMAT_LABELS[format]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Materia abre o canal canonico. Postagem simples aparece inline na aba Comunicacao da comunidade.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source_url">Fonte externa</Label>
                <Input id="source_url" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Titulo</Label>
              <Input id="title" required minLength={5} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Resumo</Label>
              <Textarea id="summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Conteudo</Label>
              <Textarea id="body" required minLength={20} className="min-h-40" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
              Publicar agora
            </label>
            <Button
              type="submit"
              disabled={(createPublication.isPending || updateDraft.isPending) || !form.channel_id || !form.location_id}
            >
              {createPublication.isPending || updateDraft.isPending
                ? "Salvando..."
                : editingDraftId
                  ? publishNow
                    ? "Atualizar e publicar"
                    : "Atualizar rascunho"
                  : publishNow
                    ? "Criar e publicar"
                    : "Salvar rascunho"}
            </Button>
            {editingDraftId ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditingDraftId(null);
                  setForm({
                    channel_id: form.channel_id,
                    location_id: "",
                    publication_type: "news",
                    content_format: "article",
                    title: "",
                    summary: "",
                    body: "",
                    source_url: "",
                  });
                }}
              >
                Cancelar edicao
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rascunhos do canal</CardTitle>
          <CardDescription>Edite rascunhos existentes e publique quando quiser.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(drafts.data ?? []).map((draft) => (
            <div key={draft.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{draft.title}</p>
                <p className="text-xs text-muted-foreground">
                  {PUBLICATION_TYPE_LABELS[draft.publication_type]} - {COMMUNICATION_CONTENT_FORMAT_LABELS[draft.content_format ?? "article"]} - {new Date(draft.updated_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingDraftId(draft.id);
                  setForm({
                    channel_id: draft.channel_id,
                    location_id: draft.location_id,
                    publication_type: draft.publication_type,
                    content_format: draft.content_format ?? "article",
                    title: draft.title,
                    summary: draft.summary ?? "",
                    body: draft.body,
                    source_url: draft.source_url ?? "",
                  });
                }}
              >
                Editar
              </Button>
            </div>
          ))}
          {!drafts.isLoading && !drafts.data?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum rascunho encontrado para este canal.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
