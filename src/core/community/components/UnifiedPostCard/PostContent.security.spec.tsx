import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostContent } from "./PostContent";

const PROFILE_ID = "2f10a5d2-2fd8-4a52-909c-4f8a5f6d1337";
const ASSET_ID = "3410a5d2-2fd8-4a52-909c-4f8a5f6d1337";

describe("UnifiedPostCard PostContent security", () => {
  it("renders hostile markup as text without executable DOM", () => {
    const hostile =
      '<img src=x onerror="window.__postXss=1"><script>window.__postXss=2</script>';
    const { container } = render(
      <PostContent postType="discussao" content={hostile} />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(/window.__postXss=2/)).toBeInTheDocument();
    expect(
      (window as Window & { __postXss?: number }).__postXss,
    ).toBeUndefined();
  });

  it("drops external tracking images and lazily renders canonical media", () => {
    const { container, rerender } = render(
      <PostContent
        postType="discussao"
        content="Conteudo seguro para a comunidade"
        image="https://tracker.example/pixel.jpg"
      />,
    );

    expect(container.querySelector("img")).toBeNull();

    rerender(
      <PostContent
        postType="discussao"
        content="Conteudo seguro para a comunidade"
        image={`storage://media-assets/${PROFILE_ID}/post_image/v1/${ASSET_ID}.jpg`}
      />,
    );

    const image = container.querySelector("img");
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
    expect(image?.getAttribute("src")).toContain(
      `/storage/v1/object/public/media-assets/${PROFILE_ID}/post_image/v1/`,
    );
  });
});
