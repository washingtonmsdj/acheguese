import { describe, expect, it } from "vitest";

import {
  isPostImageReference,
  parsePostImageReference,
  resolvePostImageReference,
  resolvePostImageSource,
  toPostImageReference,
} from "./postImageReference";

const PROFILE_ID = "2f10a5d2-2fd8-4a52-909c-4f8a5f6d1337";
const PATH = `${PROFILE_ID}/posts/1720950000000-AbCdEfGhIjKlMnOp.jpg`;
const REFERENCE = `storage://post_images/${PATH}`;

describe("postImageReference", () => {
  it("creates and resolves a canonical profile-owned reference", () => {
    expect(toPostImageReference(PATH, PROFILE_ID)).toBe(REFERENCE);
    expect(parsePostImageReference(REFERENCE)).toEqual({
      path: PATH,
      profileId: PROFILE_ID,
    });
    expect(
      resolvePostImageReference(REFERENCE, "https://project.supabase.co/"),
    ).toBe(
      `https://project.supabase.co/storage/v1/object/public/post_images/${PATH}`,
    );
  });

  it("rejects foreign profiles, traversal, external URLs and executable types", () => {
    expect(() =>
      toPostImageReference(
        PATH,
        "48f5ca58-05cd-4cd5-8f1c-98337f1c07d2",
      ),
    ).toThrow(/does not belong/);
    expect(isPostImageReference("storage://post_images/../payload.jpg")).toBe(
      false,
    );
    expect(
      isPostImageReference(
        `storage://post_images/${PROFILE_ID}/posts/payload-script.html`,
      ),
    ).toBe(false);
    expect(resolvePostImageSource("https://tracker.example/pixel.jpg")).toBeNull();
    expect(resolvePostImageSource("//tracker.example/pixel.jpg")).toBeNull();
  });

  it("allows only root-relative assets as non-database visual fixtures", () => {
    expect(resolvePostImageSource("/assets/community-fixture.jpg")).toBe(
      "/assets/community-fixture.jpg",
    );
  });
});
