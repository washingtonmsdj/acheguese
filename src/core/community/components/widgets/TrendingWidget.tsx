import React from "react";
import { memo } from "react";
import { useTrendingTopics } from "../../hooks/useTrendingTopics";
import { WidgetSkeleton } from "./WidgetSkeleton";
export const TrendingWidget = memo(() => {
  const { data: topics, isLoading } = useTrendingTopics(3);

  if (isLoading) {
    return <WidgetSkeleton hasHeader itemCount={3} />;
  }

  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 rounded-lg p-2 border border-white/10 flex-shrink-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
          <span className="text-sm">🔥</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[0.65rem] font-bold text-white tracking-tight leading-tight">
            TENDÊNCIAS DO BAIRRO
          </h3>
        </div>
      </div>

      <div className="space-y-1">
        {topics.map((topic) => (
          <a
            key={topic.id}
            href="#"
            className="flex items-center gap-1.5 p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-all group"
          >
            <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-bold text-white text-[9px] flex-shrink-0">
              {topic.position}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.65rem] font-bold text-white truncate">
                {topic.title}
              </p>
              <p className="text-[0.55rem] text-gray-400">
                {topic.mentions} menções
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
});

TrendingWidget.displayName = "TrendingWidget";
