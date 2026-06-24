import { Link } from "react-router-dom";
import {
  ChevronRight,
  Lock,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export type NeighborhoodCommunityTabId =
  | "all"
  | "feed"
  | "business"
  | "services"
  | "classifieds"
  | "gastronomy"
  | "map";

export type NeighborhoodCommunityTab = {
  id: NeighborhoodCommunityTabId;
  label: string;
  icon: LucideIcon;
};

export type NeighborhoodStreamTone = "cyan" | "blue" | "amber" | "pink" | "green";

export type NeighborhoodStreamItem = {
  id: string;
  category: Exclude<NeighborhoodCommunityTabId, "all">;
  label: string;
  tone: NeighborhoodStreamTone;
  title: string;
  description: string;
  href: string;
  mediaUrl?: string | null;
  mediaFallback: LucideIcon;
  meta: string;
  engagementLabel?: string;
  lockedActionLabel?: string;
};

export type NeighborhoodStreamGroups = Record<NeighborhoodCommunityTabId, NeighborhoodStreamItem[]>;

export type NeighborhoodStreamMoreConfig = {
  href: string;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: string;
};

function NeighborhoodStreamEmpty({ config }: { config: NeighborhoodStreamMoreConfig }) {
  return (
    <Link to={config.href} className="city-op-empty-action">
      <span>
        <strong>{config.emptyTitle}</strong>
        <small>{config.emptyDescription}</small>
      </span>
      <span className="city-op-empty-action-icon" aria-hidden="true">
        <ChevronRight />
      </span>
      <span className="sr-only">{config.emptyAction}</span>
    </Link>
  );
}

function NeighborhoodCommunityTabs({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: NeighborhoodCommunityTab[];
  activeTab: NeighborhoodCommunityTabId;
  onTabChange: (tab: NeighborhoodCommunityTabId) => void;
}) {
  return (
    <div className="neighborhood-community-tabs" role="tablist" aria-label="Módulos do bairro">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={isActive ? "is-active" : undefined}
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function NeighborhoodStream({
  items,
  tabs,
  activeTab,
  moreConfig,
  onTabChange,
  canInteract,
  lockedActionHref,
}: {
  items: NeighborhoodStreamItem[];
  tabs: NeighborhoodCommunityTab[];
  activeTab: NeighborhoodCommunityTabId;
  moreConfig: NeighborhoodStreamMoreConfig;
  onTabChange: (tab: NeighborhoodCommunityTabId) => void;
  canInteract: boolean;
  lockedActionHref: string;
}) {
  return (
    <section className="neighborhood-community-card neighborhood-community-stream" aria-labelledby="neighborhood-community-stream-title">
      <NeighborhoodCommunityTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      <h2 id="neighborhood-community-stream-title" className="sr-only">Tudo do bairro</h2>

      <div className="neighborhood-community-stream-list">
        {items.length > 0 ? (
          items.map((item) => {
            const FallbackIcon = item.mediaFallback;
            return (
              <article key={item.id} className={`neighborhood-community-stream-item is-${item.tone}`}>
                <Link to={item.href} className="neighborhood-community-stream-media" aria-label={item.title}>
                  {item.mediaUrl ? <img src={item.mediaUrl} alt="" loading="lazy" /> : <FallbackIcon aria-hidden="true" />}
                </Link>
                <div className="neighborhood-community-stream-copy">
                  <span>{item.label}</span>
                  <Link to={item.href}>{item.title}</Link>
                  <p>{item.description}</p>
                  <small>{item.meta}</small>
                </div>
                <div className="neighborhood-community-stream-action">
                  {item.engagementLabel ? (
                    <Link to={item.href}>
                      <MessageCircle aria-hidden="true" />
                      {item.engagementLabel}
                    </Link>
                  ) : null}
                  {item.lockedActionLabel ? (
                    <Link to={canInteract ? item.href : lockedActionHref} className={!canInteract ? "is-locked" : undefined}>
                      {!canInteract ? <Lock aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
                      {canInteract ? "Comentar" : item.lockedActionLabel}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <NeighborhoodStreamEmpty config={moreConfig} />
        )}
      </div>

      <Link to={moreConfig.href} className="neighborhood-community-more">
        {moreConfig.label}
      </Link>
    </section>
  );
}
