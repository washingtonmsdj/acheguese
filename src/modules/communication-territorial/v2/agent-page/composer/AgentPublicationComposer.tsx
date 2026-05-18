import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { 
  Image, 
  Video, 
  FileText, 
  MapPin, 
  Send, 
  AlertCircle,
  Calendar,
  Sparkles,
  X
} from "lucide-react";
import { communicationTerritorialGateway } from "@/modules/communication-territorial/services";
import type { CommunicationChannel } from "@/modules/communication-territorial/types";
import type { AgentTerritoryView } from "../../types/agentPageViewModels";

interface AgentPublicationComposerProps {
  channel: CommunicationChannel;
  territories: AgentTerritoryView[];
  onPublished?: () => void;
}

/**
 * AgentPublicationComposer
 * 
 * Composer social-first para criar publicações diretamente na página pública do agente.
 * 
 * Conceito: Experiência similar a Instagram/Facebook/LinkedIn - criar e publicar inline.
 * 
 * Funcionalidades:
 * - Criar postagem rápida
 * - Criar notícia/matéria
 * - Divulgar evento
 * - Criar alerta
 * - Upload de mídia
 * - Seleção de território
 * - Publicar ou agendar
 * 
 * UX: Social-first, contextual, territorial, moderna
 */
export function AgentPublicationComposer({ channel, territories, onPublished }: AgentPublicationComposerProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [publicationType, setPublicationType] = useState<"post" | "news" | "event" | "report">("post");
  const [form, setForm] = useState({
    title: "",
    content: "",
    territory_id: "",
    media_url: "",
    scheduled_at: "",
  });

  const createPublication = useMutation({
    mutationFn: async () => {
      const publication = await communicationTerritorialGateway.createPublication({
        channel_id: channel.id,
        location_id: form.territory_id,
        publication_type: publicationType === "post" ? "news" : publicationType,
        content_format: publicationType === "post" ? "update" : "article",
        title: form.title || form.content.substring(0, 100),
        summary: "",
        body: form.content,
        source_url: "",
      });

      // Publicar imediatamente se não for agendado
      if (!form.scheduled_at) {
        await communicationTerritorialGateway.publishPublication(publication.publication_id);
      }

      return publication;
    },
    onSuccess: () => {
      toast.success(form.scheduled_at ? "Publicação agendada!" : "Publicado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["communication-agent-v2"] });
      setForm({ title: "", content: "", territory_id: "", media_url: "", scheduled_at: "" });
      setIsExpanded(false);
      onPublished?.();
    },
    onError: () => {
      toast.error("Erro ao publicar. Tente novamente.");
    },
  });

  const handleSubmit = () => {
    if (!form.content.trim()) {
      toast.error("Escreva algo para publicar");
      return;
    }
    if (!form.territory_id) {
      toast.error("Selecione um território");
      return;
    }
    createPublication.mutate();
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="p-4 sm:p-6">
        
        {/* Composer Collapsed */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-left p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  Compartilhe notícias, eventos ou alertas com sua comunidade...
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Composer Expanded */}
        {isExpanded && (
          <div className="space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Nova Publicação</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Type Selector */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={publicationType === "post" ? "default" : "outline"}
                size="sm"
                onClick={() => setPublicationType("post")}
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Postagem
              </Button>
              <Button
                variant={publicationType === "news" ? "default" : "outline"}
                size="sm"
                onClick={() => setPublicationType("news")}
              >
                <FileText className="h-3 w-3 mr-1" />
                Notícia
              </Button>
              <Button
                variant={publicationType === "event" ? "default" : "outline"}
                size="sm"
                onClick={() => setPublicationType("event")}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Evento
              </Button>
              <Button
                variant={publicationType === "report" ? "default" : "outline"}
                size="sm"
                onClick={() => setPublicationType("report")}
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Alerta
              </Button>
            </div>

            {/* Title (for news/event) */}
            {(publicationType === "news" || publicationType === "event") && (
              <Input
                placeholder="Título da publicação..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="text-lg font-semibold"
              />
            )}

            {/* Content */}
            <Textarea
              placeholder={
                publicationType === "post" 
                  ? "O que está acontecendo na comunidade?"
                  : publicationType === "news"
                  ? "Escreva a notícia..."
                  : publicationType === "event"
                  ? "Detalhes do evento..."
                  : "Descreva o alerta..."
              }
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="min-h-32 resize-none"
            />

            {/* Territory Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Território
              </label>
              <div className="flex flex-wrap gap-2">
                {territories.length === 0 ? (
                  <Badge variant="outline" className="text-amber-600">
                    Nenhum território autorizado
                  </Badge>
                ) : (
                  territories.map((territory) => {
                    const location = territory.location as { name?: string } | undefined;
                    return (
                      <Badge
                        key={territory.id}
                        variant={form.territory_id === territory.location_id ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setForm({ ...form, territory_id: territory.location_id ?? "" })}
                      >
                        {location?.name || "Território"}
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>

            {/* Media Upload (placeholder) */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled>
                <Image className="h-4 w-4 mr-1" />
                Foto
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Video className="h-4 w-4 mr-1" />
                Vídeo
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <Calendar className="h-4 w-4 mr-1" />
                  Agendar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createPublication.isPending || !form.content.trim() || !form.territory_id}
                >
                  {createPublication.isPending ? (
                    <>Publicando...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Publicar
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
        )}

      </CardContent>
    </Card>
  );
}
