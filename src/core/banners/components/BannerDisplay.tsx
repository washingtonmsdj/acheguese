import React, { useEffect, useState, useCallback } from "react";
import { BannerService } from "@/core/banners";
import { SafeImage, SafeLink } from "@/shared/components/security";
import { logger } from "@/shared/utils/logger";

interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  background_color?: string;
  text_color?: string;
}

interface BannerDisplayProps {
  page: "home" | "community" | "mobility" | "business" | "events" | "all";
  position: "top" | "middle" | "bottom" | "sidebar";
  className?: string;
  dismissible?: boolean;
}

export function BannerDisplay({
  page,
  position,
  className = "",
  dismissible = true,
}: BannerDisplayProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(
    new Set(),
  );

  const loadBanners = useCallback(async () => {
    try {
      const data = await BannerService.getActiveBanners(position);
      setBanners(data.slice(0, 3));
    } catch (error) {
      logger.error("Error loading banners", error as Error);
    }
  }, [position]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  async function trackView(bannerId: string) {
    try {
      logger.debug("Banner view tracked:", bannerId);
    } catch (error) {
      // Silently fail
    }
  }

  async function trackClick(bannerId: string) {
    try {
      logger.debug("Banner click tracked:", bannerId);
    } catch (error) {
      // Silently fail
    }
  }

  function dismissBanner(bannerId: string) {
    setDismissedBanners((prev) => new Set(prev).add(bannerId));
    const dismissed = JSON.parse(
      localStorage.getItem("dismissedBanners") || "[]",
    );
    dismissed.push(bannerId);
    localStorage.setItem("dismissedBanners", JSON.stringify(dismissed));
  }

  useEffect(() => {
    if (dismissible) {
      const dismissed = JSON.parse(
        localStorage.getItem("dismissedBanners") || "[]",
      );
      setDismissedBanners(new Set(dismissed));
    }
    banners.forEach((banner) => trackView(banner.id));
  }, [banners, dismissible]);

  const visibleBanners = banners.filter((b) => !dismissedBanners.has(b.id));

  if (visibleBanners.length === 0) return null;

  return (
    <div className={`h-full ${className}`}>
      {visibleBanners.map((banner) => (
        <div
          key={banner.id}
          className="relative overflow-hidden h-full"
          style={{
            backgroundColor: banner.background_color,
            color: banner.text_color,
          }}
        >
          {banner.link_url ? (
            <SafeLink
              href={banner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(banner.id)}
              className="block"
            >
              <BannerContent banner={banner} position={position} />
            </SafeLink>
          ) : (
            <BannerContent banner={banner} position={position} />
          )}
        </div>
      ))}
    </div>
  );
}

function BannerContent({
  banner,
  position,
}: {
  banner: Banner;
  position: string;
}) {
  return (
    <div className="relative w-full h-full">
      <SafeImage
        src={banner.image_url}
        alt={banner.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
