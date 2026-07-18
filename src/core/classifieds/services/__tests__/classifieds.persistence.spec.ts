import { describe, expect, it } from "vitest";
import {
  CLASSIFIED_READ_SELECT,
  mapClassifiedReadModel,
  type ClassifiedReadRow,
} from "../classifieds.read-model";
import { toClassifiedInsert, toClassifiedUpdate } from "../classifieds.write-model";
import type { CreateClassifiedInput, UpdateClassifiedInput } from "../types";

const row: ClassifiedReadRow = {
  id: "classified-1",
  title: "Mesa de madeira",
  titulo: null,
  description: "Mesa em bom estado",
  price: 350,
  category: "moveis",
  category_id: "category-1",
  subcategory_id: "subcategory-1",
  condition: "good",
  photos: ["https://cdn.example.com/mesa.jpg"],
  seller_id: "seller-1",
  profile_id: null,
  slug: "mesa-de-madeira",
  public_id: "abc12345",
  location_id: "location-1",
  status: "active",
  is_active: true,
  is_featured: false,
  latitude: -12.99,
  longitude: -38.45,
  point: null,
  reach: "local",
  created_at: "2026-07-17T10:00:00Z",
  updated_at: "2026-07-17T10:00:00Z",
  seller: {
    name: "Ana",
    avatar_url: "https://cdn.example.com/ana.jpg",
    phone: null,
    whatsapp: "5571999999999",
  },
  territory: {
    id: "location-1",
    name: "Pituba",
    slug: "pituba",
    type: "district",
    parent_id: "salvador-1",
    geographic_path: "/br/ba/salvador/pituba",
  },
  classified_categories: { slug: "moveis" },
  classified_subcategories: { slug: "mesas" },
};

describe("Classifieds persistence models", () => {
  it("maps the canonical territory without exposing legacy labels", () => {
    const classified = mapClassifiedReadModel({
      ...row,
      neighborhood: "Label legado injetado em runtime",
    } as ClassifiedReadRow);

    expect(classified.territory).toEqual(row.territory);
    expect(classified.location_id).toBe(row.territory?.id);
    expect(classified).not.toHaveProperty("neighborhood");
    expect(classified).not.toHaveProperty("location");
    expect(classified).not.toHaveProperty("geographic_path");
  });

  it("requires a relation that matches location_id", () => {
    expect(() => mapClassifiedReadModel({ ...row, territory: null })).toThrow(
      "has no canonical territory",
    );
    expect(() => mapClassifiedReadModel({
      ...row,
      territory: { ...row.territory!, id: "other-location" },
    })).toThrow("has no canonical territory");
  });

  it("rejects unknown persisted statuses", () => {
    expect(() => mapClassifiedReadModel({ ...row, status: "approved" })).toThrow(
      "Classified status is invalid",
    );
  });

  it("keeps the territorial relation in the shared projection", () => {
    expect(CLASSIFIED_READ_SELECT).toContain(
      "territory:locations!fk_classifieds_location_id",
    );
    expect(CLASSIFIED_READ_SELECT).toContain("geographic_path");
  });

  it("allowlists create fields and discards injected legacy properties", () => {
    const input = {
      title: "Mesa",
      description: "Descricao",
      price: 350,
      category: "moveis",
      condition: "good",
      photos: [],
      location_id: "location-1",
      neighborhood: "Bairro forjado",
      seller_id: "attacker",
      is_active: false,
      status: "sold",
    } as unknown as CreateClassifiedInput;

    const insert = toClassifiedInsert("seller-1", input, "mesa");

    expect(insert.seller_id).toBe("seller-1");
    expect(insert.status).toBe("active");
    expect(insert.location_id).toBe("location-1");
    expect(insert).not.toHaveProperty("neighborhood");
  });

  it("allowlists update fields and discards injected ownership properties", () => {
    const input = {
      title: "Mesa atualizada",
      neighborhood: "Bairro forjado",
      seller_id: "attacker",
      is_active: false,
    } as unknown as UpdateClassifiedInput;

    const update = toClassifiedUpdate(input);

    expect(update).toEqual({ title: "Mesa atualizada" });
  });
});
