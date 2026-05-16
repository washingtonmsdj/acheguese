import { FormEvent, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { CommunicationPageShell } from "../components/CommunicationBlocks";
import { useCommunicationLocations } from "../hooks";
import { communicationTerritorialGateway } from "../services";
import { CHANNEL_KIND_LABELS, getCommunicationErrorMessage, type ChannelKind } from "../types";

const CHANNEL_KINDS = Object.keys(CHANNEL_KIND_LABELS) as ChannelKind[];

export default function CommunicationRequestPage() {
  const [form, setForm] = useState({
    public_name: "",
    channel_kind: "portal" as ChannelKind,
    description: "",
    website_url: "",
    contact_email: "",
    contact_phone: "",
    requested_location_id: "",
  });

  const { data: locations = [] } = useCommunicationLocations();

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === form.requested_location_id),
    [locations, form.requested_location_id],
  );

  const mutation = useMutation({
    mutationFn: () => communicationTerritorialGateway.requestChannel(form),
    onSuccess: () => toast.success("Solicitacao enviada. O canal ficara pendente ate aprovacao administrativa."),
    onError: (error) =>
      toast.error(getCommunicationErrorMessage(error, "Nao foi possivel enviar a solicitacao.")),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>Solicitar Canal de Comunicação | Achegue-se</title>
        <link rel="canonical" href="/comunicacao/solicitar" />
      </Helmet>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Solicitar Canal de Comunicação</CardTitle>
          <CardDescription>
            A solicitação é aberta. A ativação, publicação e território autorizado dependem de aprovação administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="public_name">Nome publico</Label>
                <Input id="public_name" required value={form.public_name} onChange={(e) => setForm({ ...form, public_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de canal</Label>
                <Select value={form.channel_kind} onValueChange={(value) => setForm({ ...form, channel_kind: value as ChannelKind })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNEL_KINDS.map((kind) => <SelectItem key={kind} value={kind}>{CHANNEL_KIND_LABELS[kind]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea id="description" required minLength={20} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email de contato</Label>
                <Input id="contact_email" type="email" required value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input id="contact_phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website_url">Site ou rede principal</Label>
              <Input id="website_url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Territorio pretendido</Label>
              <Select value={form.requested_location_id} onValueChange={(value) => setForm({ ...form, requested_location_id: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione cidade, bairro ou distrito" /></SelectTrigger>
                <SelectContent>
                  {locations.map((location) => <SelectItem key={location.id} value={location.id}>{location.full_name ?? location.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedLocation ? <p className="text-xs text-muted-foreground">Territorio: {selectedLocation.full_name ?? selectedLocation.name}</p> : null}
            </div>
            <Button type="submit" disabled={mutation.isPending || !form.requested_location_id}>
              {mutation.isPending ? "Enviando..." : "Enviar solicitacao"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </CommunicationPageShell>
  );
}
