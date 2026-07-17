import { describe, expect, it } from "vitest";
import { createPostMutationSchema, updatePostSchema } from "./postSchemas";

const postId = "11111111-1111-4111-8111-111111111111";

describe("updatePostSchema", () => {
  it("accepts the canonical text-only edit contract", () => {
    expect(
      updatePostSchema.parse({ id: postId, content: "  Texto atualizado  " }),
    ).toEqual({ id: postId, content: "Texto atualizado" });
  });

  it("rejects legacy media fields and invalid identifiers", () => {
    expect(
      updatePostSchema.safeParse({
        id: postId,
        content: "Texto atualizado",
        image_url: "https://tracker.example/pixel.jpg",
      }).success,
    ).toBe(false);
    expect(
      updatePostSchema.safeParse({ id: "invalid", content: "Texto atualizado" })
        .success,
    ).toBe(false);
  });
});

describe("createPostMutationSchema", () => {
  const base = {
    author_profile_id: postId,
    location_id: "22222222-2222-4222-8222-222222222222",
    content: "Conteudo comunitario valido",
  };

  it("accepts semantic post types and rejects the obsolete storage enum", () => {
    expect(
      createPostMutationSchema.safeParse({ ...base, type: "discussao" })
        .success,
    ).toBe(true);
    expect(
      createPostMutationSchema.safeParse({ ...base, type: "text" }).success,
    ).toBe(false);
  });
});
