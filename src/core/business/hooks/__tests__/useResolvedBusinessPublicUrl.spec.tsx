import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useResolvedBusinessPublicUrl } from "../useResolvedBusinessPublicUrl";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";

vi.mock("@/core/business/services/BusinessUrlService", () => ({
  BusinessUrlService: {
    getCanonicalUrl: vi.fn(),
  },
}));

const context = {
  id: "business-1",
  slug: "padaria-x",
  is_premium: false,
  geographic_path: "/br/ba/salvador/pituba",
};

function Probe() {
  const { url, fallbackUrl, isResolving } = useResolvedBusinessPublicUrl(context);

  return (
    <div>
      <span data-testid="url">{url}</span>
      <span data-testid="fallback">{fallbackUrl}</span>
      <span data-testid="resolving">{String(isResolving)}</span>
    </div>
  );
}

describe("useResolvedBusinessPublicUrl", () => {
  it("uses the public canonical URL without upgrading to community alias", () => {
    vi.mocked(BusinessUrlService.getCanonicalUrl).mockReturnValue(
      "/empresas/ba/salvador/pituba/padaria-x",
    );

    render(<Probe />);

    expect(screen.getByTestId("fallback")).toHaveTextContent(
      "/empresas/ba/salvador/pituba/padaria-x",
    );
    expect(screen.getByTestId("url")).toHaveTextContent(
      "/empresas/ba/salvador/pituba/padaria-x",
    );
    expect(screen.getByTestId("resolving")).toHaveTextContent("false");
  });
});
