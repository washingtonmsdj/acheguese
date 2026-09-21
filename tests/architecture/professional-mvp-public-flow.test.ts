import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("MVP Professional public flow", () => {
  const migration = read(
    "supabase/migrations/20260921101717_enforce_professional_public_slug_routability_mvp.sql",
  );
  const edge = read("supabase/functions/profile-rpc/index.ts");
  const landing = read(
    "src/modules/professionals/services/pages/ServicosLandingPage.tsx",
  );
  const serviceUrls = read("src/core/professional/hooks/useServiceUrls.ts");
  const queries = read("src/core/professional/services/professional.queries.ts");
  const centralModel = read("src/modules/central/pages/CentralProfissionalPage.model.ts");
  const profileServices = read("src/modules/profile/components/UserServicesSection.tsx");
  const searchProviders = read("src/core/search/providers/searchProviders.ts");
  const mapServices = read("src/core/maps/services/MapServicesLayerRuntimeService.ts");
  const mapProjection = read("src/core/maps/services/MapEntityProjectionService.ts");
  const probe = read(
    "tests/security/professional-mvp-public-flow-remote-probe.sql",
  );

  it("keeps public Professional discovery routable by slug", () => {
    expect(migration).toContain(
      "professional_public_visibility_requires_slug",
    );
    expect(migration).toContain(
      "visibility = 'private'::public.professional_profile_visibility",
    );
    expect(migration).toContain("professional.slug IS NOT NULL");
    expect(migration).toContain("WITH (security_invoker = true)");
    expect(migration).toContain("GRANT SELECT ON TABLE public.public_professional_search");
    expect(edge).toContain('RequestValidationError("slug cannot be cleared")');
  });

  it("keeps list to detail on the canonical professional URL owner", () => {
    expect(landing).toContain("appUrls.services.detail({");
    expect(landing).toContain("slug: pro.slug");
    expect(serviceUrls).toContain(
      "ProfessionalUrlService.getCanonicalUrlFromTarget(target)",
    );
    expect(serviceUrls).not.toContain("?? listUrl");
    expect(serviceUrls).not.toContain('typeof target === "string"');
    expect(landing).toContain("if (!detailUrl) return;");
    expect(centralModel).not.toContain("professionalPublicRoutes.home()");
    expect(profileServices).not.toContain("professionalPublicRoutes.home()");
    expect(searchProviders).toContain("if");
    expect(searchProviders).toContain("target_url: targetUrl");
    expect(mapServices).toContain("if (!url) return [];");
    expect(mapProjection).toContain("if (!publicUrl) return null;");
    expect(queries).toContain(
      '.from<ProfessionalQueryRow>("public_professional_search")',
    );
    expect(queries).toContain(
      '.in("visibility", ["public_listed", "public_unlisted"])',
    );
  });

  it("keeps a rollback-only authorization and routability probe", () => {
    expect(probe).toContain("BEGIN;");
    expect(probe).toContain("ROLLBACK;");
    expect(probe).toContain("SET LOCAL ROLE anon;");
    expect(probe).toContain("professional_public_slug_constraint_not_enforced");
    expect(probe).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f-]{27,}/i);
    expect(probe).not.toContain("antonio");
    expect(probe).not.toContain("joao");
    expect(probe).toContain("private_professional_visible_to_anon");
    expect(probe).toContain(
      "private_professional_visible_in_public_read_model",
    );
  });
});
