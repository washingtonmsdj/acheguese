import React from "react";
import { memo } from "react";
import { useAdDelivery } from "@/core/business/promotions";
import { WidgetSkeleton } from "./WidgetSkeleton";
import { SafeImage, SafeLink } from "@/shared/components/security";

export const SponsoredWidget = memo(() => {
  const { campaign: ad, isLoading } = useAdDelivery("sidebar_widget");

  if (isLoading) {
    return <WidgetSkeleton hasHeader={false} itemCount={1} />;
  }

  if (!ad) {
    return null;
  }

  return (
    <div className="bg-white/5 rounded-lg p-2 border border-white/10 flex-shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <span className="text-sm">📢</span>
          <h3 className="text-[0.65rem] font-bold text-white uppercase tracking-tight leading-tight">
            Patrocinado
          </h3>
        </div>
        <span className="text-[0.55rem] text-gray-400">Ad</span>
      </div>

      <SafeLink href={ad.cta_url ?? ""} className="block group">
        <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 rounded-md mb-1.5 overflow-hidden">
          <SafeImage
            src={ad.image_url ?? ""}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h4 className="text-[0.65rem] font-bold text-white mb-0.5">
          {ad.title}
        </h4>
        <p className="text-[0.55rem] text-gray-400 line-clamp-2">
          {ad.description ?? ""}
        </p>
      </SafeLink>

      <button className="w-full mt-1.5 px-2 py-1 bg-gradient-to-r from-teal-400 to-cyan-400 text-white text-[9px] font-semibold rounded-md hover:shadow-lg transition-all">
        Anunciar aqui
      </button>
    </div>
  );
});

SponsoredWidget.displayName = "SponsoredWidget";
