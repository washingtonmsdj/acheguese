import { describe, expect, it } from "vitest";
import { shouldHydrateBusinessEditForm, type BusinessEditHydrationState } from "../shouldHydrateBusinessEditForm";

const current: BusinessEditHydrationState = {
  routeProfileId: "company-a",
  loadedProfileId: "company-a",
  initializedProfileId: "company-a",
  hasUnsavedFields: false,
  hasUnsavedSlug: false,
  hasPendingUploads: false,
};

describe("Business edit form hydration", () => {
  it("initializes after loading the company selected by the route", () => {
    expect(shouldHydrateBusinessEditForm({
      ...current,
      initializedProfileId: null,
    })).toBe(true);
  });

  it("never populates a new route with a previous company's cached data", () => {
    expect(shouldHydrateBusinessEditForm({
      ...current,
      routeProfileId: "company-b",
    })).toBe(false);
  });

  it("reinitializes when switching companies even if the previous form was dirty", () => {
    expect(shouldHydrateBusinessEditForm({
      ...current,
      routeProfileId: "company-b",
      loadedProfileId: "company-b",
      hasUnsavedFields: true,
      hasUnsavedSlug: true,
    })).toBe(true);
  });

  it.each([
    { hasUnsavedFields: true },
    { hasUnsavedSlug: true },
    { hasPendingUploads: true },
  ])("preserves unsaved state on a same-company refetch (%o)", (state) => {
    expect(shouldHydrateBusinessEditForm({ ...current, ...state })).toBe(false);
  });

  it("allows a fresh read model to hydrate a pristine form", () => {
    expect(shouldHydrateBusinessEditForm(current)).toBe(true);
  });

  it("does not hydrate without a valid company route", () => {
    expect(shouldHydrateBusinessEditForm({ ...current, routeProfileId: "" })).toBe(false);
    expect(shouldHydrateBusinessEditForm({ ...current, loadedProfileId: null })).toBe(false);
  });
});
