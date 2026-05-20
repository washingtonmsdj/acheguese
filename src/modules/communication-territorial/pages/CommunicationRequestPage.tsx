import { FormEvent, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  requestCommunicationChannelSchema,
  type RequestCommunicationChannelInput,
} from "@/core/communication-territorial";
import { PublicIdentityService } from "@/core/public-identity";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { CommunicationPageShell } from "../components/CommunicationBlocks";
import { useCommunicationLocations } from "../hooks";
import { communicationTerritorialGateway } from "../services";
import { CHANNEL_KIND_LABELS, getCommunicationErrorMessage, type ChannelKind } from "../types";

const CHANNEL_KINDS = Object.keys(CHANNEL_KIND_LABELS) as ChannelKind[];

export default function CommunicationRequestPage() {
  const [form, setForm] = useState<RequestCommunicationChannelInput>({
    public_name: "",
    channel_kind: "portal" as ChannelKind,
    description: "",
    website_url: "",
    contact_email: "",
    contact_phone: "",
    requested_location_id: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof RequestCommunicationChannelInput, string>>
  >({});

  const { data: locations = [] } = useCommunicationLocations();
  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === form.requested_location_id),
    [locations, form.requested_location_id],
  );
  const suggestedSlug = useMemo(
    () => PublicIdentityService.normalize(form.public_name, "communication_channel"),
    [form.public_name],
  );

  const mutation = useMutation({
    mutationFn: (payload: RequestCommunicationChannelInput) =>
      communicationTerritorialGateway.requestChannel(payload),
    onSuccess: () => {
      toast.success("Solicitacao enviada. O canal ficara pendente ate aprovacao administrativa.");
      setFieldErrors({});
    },
    onError: (error) =>
      toast.error(getCommunicationErrorMessage(error, "Nao foi possivel enviar a solicitacao.")),
  });

  const setFieldValue = <K extends keyof RequestCommunicationChannelInput>(
    key: K,
    value: RequestCommunicationChannelInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const validation = requestCommunicationChannelSchema.safeParse(form);
    if (!validation.success) {
      const nextErrors: Partial<Record<keyof RequestCommunicationChannelInput, string>> = {};
      for (const issue of validation.error.issues) {
        const fieldName = issue.path[0];
        if (
          typeof fieldName === "string" &&
          !nextErrors[fieldName as keyof RequestCommunicationChannelInput]
        ) {
          nextErrors[fieldName as keyof RequestCommunicationChannelInput] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      toast.error(validation.error.issues[0]?.message || "Revise os campos obrigatorios.");
      return;
    }

    setFieldErrors({});
    mutation.mutate(validation.data as RequestCommunicationChannelInput);
  };

  return (
    <CommunicationPageShell>
      <Helmet>
        <title>Solicitar Canal de Comunicacao | Achegue-se</title>
        <link rel="canonical" href="/comunicacao/solicitar" />
      </Helmet>
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Solicitar Canal de Comunicacao</CardTitle>
          <CardDescription>
            A solicitacao e aberta. Ativacao, publicacao e territorio autorizado dependem de aprovacao administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="public_name">Nome publico</Label>
                <Input
                  id="public_name"
                  required
                  value={form.public_name}
                  onChange={(event) => setFieldValue("public_name", event.target.value)}
                />
                {fieldErrors.public_name ? (
                  <p className="text-xs text-destructive">{fieldErrors.public_name}</p>
                ) : null}
                {suggestedSlug ? (
                  <p className="text-xs text-muted-foreground">
                    Slug sugerido: <span className="font-mono">{suggestedSlug}</span> (geracao automatica apos aprovacao)
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>Tipo de canal</Label>
                <Select
                  value={form.channel_kind}
                  onValueChange={(value) => setFieldValue("channel_kind", value as ChannelKind)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {CHANNEL_KIND_LABELS[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.channel_kind ? (
                  <p className="text-xs text-destructive">{fieldErrors.channel_kind}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                required
                minLength={20}
                value={form.description}
                onChange={(event) => setFieldValue("description", event.target.value)}
              />
              {fieldErrors.description ? (
                <p className="text-xs text-destructive">{fieldErrors.description}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email de contato</Label>
                <Input
                  id="contact_email"
                  type="email"
                  required
                  value={form.contact_email}
                  onChange={(event) => setFieldValue("contact_email", event.target.value)}
                />
                {fieldErrors.contact_email ? (
                  <p className="text-xs text-destructive">{fieldErrors.contact_email}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input
                  id="contact_phone"
                  value={form.contact_phone}
                  onChange={(event) => setFieldValue("contact_phone", event.target.value)}
                />
                {fieldErrors.contact_phone ? (
                  <p className="text-xs text-destructive">{fieldErrors.contact_phone}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Site ou rede principal</Label>
              <Input
                id="website_url"
                value={form.website_url}
                onChange={(event) => setFieldValue("website_url", event.target.value)}
              />
              {fieldErrors.website_url ? (
                <p className="text-xs text-destructive">{fieldErrors.website_url}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Territorio pretendido</Label>
              <Select
                value={form.requested_location_id}
                onValueChange={(value) => setFieldValue("requested_location_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione cidade, bairro ou distrito" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.full_name ?? location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLocation ? (
                <p className="text-xs text-muted-foreground">
                  Territorio: {selectedLocation.full_name ?? selectedLocation.name}
                </p>
              ) : null}
              {fieldErrors.requested_location_id ? (
                <p className="text-xs text-destructive">{fieldErrors.requested_location_id}</p>
              ) : null}
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
