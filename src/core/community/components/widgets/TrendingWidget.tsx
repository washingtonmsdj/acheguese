import { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Flame } from "lucide-react";
import { useTrendingTopics } from "../../hooks/useTrendingTopics";
import { WidgetSkeleton } from "./WidgetSkeleton";
import type { TerritoryFilter } from "@/core/location/types";

interface TrendingWidgetProps {
  territoryFilter?: TerritoryFilter;
  onTagClick?: (tag: string) => void;
}

function normalizeTag(value: string): string {
  return value.replace(/^#/, "").trim();
}

function buildFeedFallbackPath(pathname: string, tag: string): string {
  const normalizedPath = pathname.replace(/\/$/, "");
  const basePath = normalizedPath.endsWith("/grupos")
    ? normalizedPath.replace(/\/grupos$/, "/feed")
    : normalizedPath.endsWith("/feed")
      ? normalizedPath
      : `${normalizedPath}/feed`;
  const params = new URLSearchParams({ tag });
  return `${basePath}?${params.toString()}`;
}

export const TrendingWidget = memo(({ territoryFilter, onTagClick }: TrendingWidgetProps) => {
  const location = useLocation();
  const { data: topics, isLoading } = useTrendingTopics(3, territoryFilter);

  if (isLoading) {
    return <WidgetSkeleton hasHeader itemCount={3} />;
  }

  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <div className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 p-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
          <Flame className="h-4 w-4 text-orange-400" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.65rem] font-bold leading-tight tracking-tight text-white">
            TENDENCIAS DO BAIRRO
          </h3>
        </div>
      </div>

      <div className="space-y-1">
        {topics.map((topic) => {
          const tag = normalizeTag(topic.title);
          const content = (
            <>
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-white/10 text-[9px] font-bold text-white">
                {topic.position}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.65rem] font-bold text-white">
                  {topic.title}
                </p>
                <p className="text-[0.55rem] text-gray-400">
                  {topic.mentions} mencoes
                </p>
              </div>
            </>
          );

          return onTagClick ? (
            <button
              key={topic.id}
              type="button"
              onClick={() => onTagClick(tag)}
              className="group flex w-full items-center gap-1.5 rounded-md bg-white/5 p-1.5 text-left transition-all hover:bg-white/10"
            >
              {content}
            </button>
          ) : (
            <Link
              key={topic.id}
              to={buildFeedFallbackPath(location.pathname, tag)}
              className="group flex items-center gap-1.5 rounded-md bg-white/5 p-1.5 transition-all hover:bg-white/10"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
});

TrendingWidget.displayName = "TrendingWidget";
