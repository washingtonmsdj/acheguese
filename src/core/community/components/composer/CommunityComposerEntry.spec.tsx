import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CommunityComposerEntry } from "./CommunityComposerEntry";

vi.mock("@/core/session", () => ({
  useSessionContext: () => ({ activeProfile: null }),
}));

describe("CommunityComposerEntry", () => {
  it("exposes one real text field and keeps content options inside the modal", () => {
    render(
      <CommunityComposerEntry
        communityName="Pituba"
        onOpenCreatePost={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: /criar publicação em pituba/i }),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: /mídia/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /enquete/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /mais/i })).toBeNull();
  });

  it("opens the canonical discussion composer when the field is activated", () => {
    const onOpenCreatePost = vi.fn();
    render(
      <CommunityComposerEntry
        communityName="Pituba"
        onOpenCreatePost={onOpenCreatePost}
      />,
    );

    fireEvent.click(
      screen.getByRole("textbox", { name: /criar publicação em pituba/i }),
    );

    expect(onOpenCreatePost).toHaveBeenCalledWith("discussao");
  });
});
