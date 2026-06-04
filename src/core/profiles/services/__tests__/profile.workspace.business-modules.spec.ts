import { describe, expect, it, vi } from "vitest";

import { buildBusinessModuleSnapshot } from "../profile.workspace.business-modules";

const entitlementDefaults = {
  canUsePremiumPublicPage: false,
  canUseShortPremiumLink: false,
  canUseCustomQRCode: false,
  canReceiveInternalOrders: false,
  canUseOrdersPanel: false,
  canUseMotoboyNetwork: false,
  canRequestDelivery: false,
  canTrackDelivery: false,
  canConfigureDeliveryArea: false,
  canSetDeliveryFees: false,
  canUseOwnDelivery: false,
};

const business = {
  id: "biz-1",
  name: "Cafe Central",
  category: "restaurante",
  is_premium: true,
  slug: "cafe-central",
  geographic_path: "/br/ba/salvador/rio-vermelho",
};

describe("buildBusinessModuleSnapshot", () => {
  it("usa a URL publica resolvida como publicUrl e shareUrl sem entitlement premium", async () => {
    const getCanonicalUrl = vi.fn(async () => "/rio-vermelho/cafe-central");
    const getShareUrl = vi.fn(() => "/p/cafe-central");

    const snapshot = await buildBusinessModuleSnapshot({
      business,
      planTier: "free",
      subscription: null,
      entitlements: entitlementDefaults,
      gastronomyEligible: true,
      gastronomyProfile: null,
      qrCode: null,
      getCanonicalUrl,
      getShareUrl,
    });

    expect(snapshot.publicUrl).toBe("/rio-vermelho/cafe-central");
    expect(snapshot.shareUrl).toBe("/rio-vermelho/cafe-central");
    expect(getCanonicalUrl).toHaveBeenCalledWith({
      id: "biz-1",
      slug: "cafe-central",
      is_premium: true,
      geographic_path: "/br/ba/salvador/rio-vermelho",
    });
    expect(getShareUrl).not.toHaveBeenCalled();
  });

  it("usa /p/:slug como shareUrl apenas quando o entitlement permitir", async () => {
    const getCanonicalUrl = vi.fn(async () => "/rio-vermelho/cafe-central");
    const getShareUrl = vi.fn(() => "/p/cafe-central");

    const snapshot = await buildBusinessModuleSnapshot({
      business,
      planTier: "premium",
      subscription: null,
      entitlements: {
        ...entitlementDefaults,
        canUseShortPremiumLink: true,
      },
      gastronomyEligible: true,
      gastronomyProfile: null,
      qrCode: null,
      getCanonicalUrl,
      getShareUrl,
    });

    expect(snapshot.publicUrl).toBe("/rio-vermelho/cafe-central");
    expect(snapshot.shareUrl).toBe("/p/cafe-central");
  });
});
