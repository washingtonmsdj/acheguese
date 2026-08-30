import { Helmet } from "react-helmet-async";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";
import { HeroSection } from "../sections/HeroSection";
import { FeaturedMediaSection } from "../sections/FeaturedMediaSection";
import { VerifiedChannelsSection } from "../sections/VerifiedChannelsSection";
import { LatestPublicationsSection } from "../sections/LatestPublicationsSection";
import { TerritorialSidebar } from "../components/TerritorialSidebar";
import { TerritorialFilters } from "../components/TerritorialFilters";
import { useCommunicationLandingHub } from "../hooks/useCommunicationLandingHub";

export default function CommunicationLandingPage() {
  const { data: hub } = useCommunicationLandingHub({
    state: TERRITORY_CONFIG.launch.state,
    city: TERRITORY_CONFIG.launch.city,
  });
  const canonicalUrl = buildPublicAbsoluteUrl("/comunicacao");

  return (
    <>
      <Helmet>
        <title>Comunicacao Territorial | Achegue-se</title>
        <meta
          name="description"
          content="Hub de comunicacao territorial: descubra portais locais, radios comunitarias, coletivos e agentes de midia do seu territorio."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-lg">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <TerritorialFilters locations={hub?.locations} />
          </div>
        </div>

        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
            <main className="space-y-6 sm:space-y-8 lg:col-span-8 lg:space-y-10">
              <HeroSection
                title={hub?.title}
                channels={hub?.channels}
                publicationsCount={hub?.publications.length ?? 0}
              />
              <FeaturedMediaSection channels={hub?.channels} />
              <VerifiedChannelsSection channels={hub?.channels} />
              <LatestPublicationsSection publications={hub?.publications} />
            </main>

            <aside className="order-last lg:col-span-4">
              <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24">
                <TerritorialSidebar
                  title={hub?.title}
                  channels={hub?.channels}
                  publications={hub?.publications}
                />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

