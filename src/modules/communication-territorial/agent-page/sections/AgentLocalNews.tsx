import { Card } from "@/shared/components/ui/card";
import { Newspaper } from "lucide-react";
import type {
  AgentChannelView,
  AgentPublicationView,
  AgentTerritoryView,
} from "../../types/agentPageViewModels";

export function AgentLocalNews({ publications }: { publications: AgentPublicationView[] }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Newspaper className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Notícias Locais</h2>
      </div>
      <Card className="p-6">
        <p className="text-muted-foreground">Seção de notícias locais em desenvolvimento</p>
      </Card>
    </section>
  );
}

export function AgentEventsHighlight({ agent }: { agent: AgentChannelView }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Eventos em Destaque</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">Eventos divulgados pelo agente</p>
      </Card>
    </section>
  );
}

export function AgentMultimediaGallery({ agent }: { agent: AgentChannelView }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Galeria Multimídia</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">Vídeos, fotos e conteúdo multimídia</p>
      </Card>
    </section>
  );
}

export function AgentCulturalAgenda({ agent }: { agent: AgentChannelView }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Agenda Cultural</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">Programação cultural da região</p>
      </Card>
    </section>
  );
}

export function AgentCommunityAlerts({ agent }: { agent: AgentChannelView }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Alertas Comunitários</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">Avisos importantes para a comunidade</p>
      </Card>
    </section>
  );
}

export function AgentTrendingContent({ publications }: { publications: AgentPublicationView[] }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Conteúdos em Alta</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">Publicações mais populares</p>
      </Card>
    </section>
  );
}

export function AgentCoveredCommunities({ territories }: { territories: AgentTerritoryView[] }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Comunidades Cobertas</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">{territories.length} territórios atendidos</p>
      </Card>
    </section>
  );
}

export function AgentPartnersSponsors({ agent }: { agent: AgentChannelView }) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Parceiros e Patrocinadores</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">Apoiadores do portal</p>
      </Card>
    </section>
  );
}

export function AgentEditorialFeed({
  publications,
  agent,
}: {
  publications: AgentPublicationView[];
  agent: AgentChannelView;
}) {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Feed Editorial</h2>
      <Card className="p-6">
        <p className="text-muted-foreground">Timeline completa de publicações</p>
      </Card>
    </section>
  );
}
