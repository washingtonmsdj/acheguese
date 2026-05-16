import { Helmet } from "react-helmet-async";
import { HeroSection } from "../v2/sections/HeroSection";
import { FeaturedMediaSection } from "../v2/sections/FeaturedMediaSection";
import { ActiveCoverageSection } from "../v2/sections/ActiveCoverageSection";
import { VerifiedChannelsSection } from "../v2/sections/VerifiedChannelsSection";
import { TrendingTerritorialSection } from "../v2/sections/TrendingTerritorialSection";
import { LatestPublicationsSection } from "../v2/sections/LatestPublicationsSection";
import { CommunitiesInMotionSection } from "../v2/sections/CommunitiesInMotionSection";
import { EventsCultureSection } from "../v2/sections/EventsCultureSection";
import { LocalNewsSection } from "../v2/sections/LocalNewsSection";
import { PublicUtilitySection } from "../v2/sections/PublicUtilitySection";
import { MultimediaContentSection } from "../v2/sections/MultimediaContentSection";
import { TerritorialSidebar } from "../v2/components/TerritorialSidebar";
import { TerritorialFilters } from "../v2/components/TerritorialFilters";
import { useCommunicationLandingHub } from "../hooks/useCommunicationLandingHub";

export default function CommunicationLandingPage() {
  const { data: hub } = useCommunicationLandingHub({ state: "ba", city: "salvador" });

  return (
    <>
      <Helmet>
        <title>Comunicacao Territorial | Achegue-se</title>
        <meta
          name="description"
          content="Hub de comunicação territorial: descubra portais locais, rádios comunitárias, coletivos e agentes de mídia do seu território."
        />
        <link rel="canonical" href="/comunicacao" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-lg">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6">
            <TerritorialFilters />
          </div>
        </div>

        <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12 lg:gap-8">
            <main className="space-y-6 sm:space-y-8 lg:col-span-8 lg:space-y-10">
              <HeroSection />
              <FeaturedMediaSection channels={hub?.channels} />
              <VerifiedChannelsSection channels={hub?.channels} />
              <ActiveCoverageSection />
              <TrendingTerritorialSection />
              <LatestPublicationsSection publications={hub?.publications} />
              <CommunitiesInMotionSection />
              <EventsCultureSection />
              <LocalNewsSection />
              <PublicUtilitySection />
              <MultimediaContentSection />
            </main>

            <aside className="order-last lg:col-span-4">
              <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24">
                <TerritorialSidebar />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
