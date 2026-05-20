import { Helmet } from "react-helmet-async";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import { HeroSection } from "../sections/HeroSection";
import { FeaturedMediaSection } from "../sections/FeaturedMediaSection";
import { ActiveCoverageSection } from "../sections/ActiveCoverageSection";
import { VerifiedChannelsSection } from "../sections/VerifiedChannelsSection";
import { TrendingTerritorialSection } from "../sections/TrendingTerritorialSection";
import { LatestPublicationsSection } from "../sections/LatestPublicationsSection";
import { CommunitiesInMotionSection } from "../sections/CommunitiesInMotionSection";
import { EventsCultureSection } from "../sections/EventsCultureSection";
import { LocalNewsSection } from "../sections/LocalNewsSection";
import { PublicUtilitySection } from "../sections/PublicUtilitySection";
import { MultimediaContentSection } from "../sections/MultimediaContentSection";
import { TerritorialSidebar } from "../components/TerritorialSidebar";
import { TerritorialFilters } from "../components/TerritorialFilters";
import { useCommunicationLandingHub } from "../hooks/useCommunicationLandingHub";

export default function CommunicationLandingPage() {
  const { data: hub } = useCommunicationLandingHub({ state: "ba", city: "salvador" });
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

