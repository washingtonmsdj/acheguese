import { expect, test } from "@playwright/test";

import { openPublicRoute } from "./support/publicRouteAssertions";

const COMMUNITY_ROUTE = "/comunidade/ba/salvador/pituba";
const PROFILE_ID = "2f10a5d2-2fd8-4a52-909c-4f8a5f6d1337";
const ASSET_ID = "3410a5d2-2fd8-4a52-909c-4f8a5f6d1337";
const LOCATION_ID = "88a96045-ddb0-4f49-a25a-f7b61fe980c1";
const PAGE_SIZE = 12;
const PAGE_SIZE_WITH_SENTINEL = PAGE_SIZE + 1;
const FULL_PAGES = 8;

function makePost(pageIndex: number, itemIndex: number) {
  const sequence = pageIndex * PAGE_SIZE + itemIndex;
  const createdAt = new Date(
    Date.UTC(2026, 6, 14, 12, 0, 0) - sequence * 1000,
  ).toISOString();
  const suffix = String(sequence + 1).padStart(12, "0");
  const content =
    sequence === 0
      ? '<img src=x onerror="window.__postXss=1"><script>window.__postXss=2</script>'
      : `Publicacao territorial de teste numero ${sequence + 1}`;
  const images =
    sequence === 1
      ? [`storage://media-assets/${PROFILE_ID}/post_image/v1/${ASSET_ID}.jpg`]
      : [];

  return {
    id: `00000000-0000-4000-8000-${suffix}`,
    author_profile_id: PROFILE_ID,
    content,
    type: "discussao",
    location_id: LOCATION_ID,
    reach: "neighborhood",
    images,
    tags: [],
    likes_count: sequence % 17,
    comments_count: sequence % 9,
    confirmations_count: 0,
    is_verified: false,
    is_published: true,
    created_at: createdAt,
    updated_at: createdAt,
    author_profile: {
      id: PROFILE_ID,
      name: "Morador de teste",
      avatar_url: null,
      verified: true,
    },
    location: {
      id: LOCATION_ID,
      name: "Pituba",
      type: "neighborhood",
      parent_id: null,
    },
  };
}

test.describe("community feed resilience", () => {
  test("keeps text inert, media canonical and long mobile feeds responsive", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });

    let feedRequestCount = 0;
    const feedLimits: number[] = [];
    const requestedHosts = new Set<string>();
    page.on("request", (request) => {
      requestedHosts.add(new URL(request.url()).hostname);
    });

    await page.route("**/rest/v1/posts**", async (route) => {
      const url = new URL(route.request().url());
      const requestedLimit = Number(url.searchParams.get("limit"));
      const order = url.searchParams.get("order") ?? "";
      if (
        route.request().method() !== "GET" ||
        requestedLimit !== PAGE_SIZE_WITH_SENTINEL ||
        !order.includes("created_at.desc")
      ) {
        await route.continue();
        return;
      }

      feedLimits.push(requestedLimit);
      const pageIndex = feedRequestCount;
      feedRequestCount += 1;
      const rowCount = pageIndex < FULL_PAGES ? PAGE_SIZE_WITH_SENTINEL : 8;
      const rows = Array.from({ length: rowCount }, (_, index) =>
        makePost(pageIndex, index),
      );

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": `0-${rowCount - 1}/*` },
        body: JSON.stringify(rows),
      });
    });

    await page.route(
      "**/storage/v1/object/public/media-assets/**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "image/jpeg",
          body: Buffer.from(
            "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/AP/EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEABj8Cf//Z",
            "base64",
          ),
        });
      },
    );

    await openPublicRoute(page, COMMUNITY_ROUTE, {
      waitUntil: "domcontentloaded",
      dismissConsent: true,
    });

    const feedPosts = page.locator("[data-feed-post-id]");
    await expect(feedPosts).toHaveCount(PAGE_SIZE, { timeout: 45_000 });

    const hostilePost = feedPosts.filter({ hasText: "window.__postXss=2" });
    await expect(hostilePost).toContainText("window.__postXss=2");
    await expect(hostilePost.locator("script")).toHaveCount(0);
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as Window & { __postXss?: number }).__postXss,
        ),
      )
      .toBeUndefined();

    const canonicalImage = feedPosts
      .filter({
        has: page.locator(
          'img[src*="/storage/v1/object/public/media-assets/"]',
        ),
      })
      .locator('img[src*="/storage/v1/object/public/media-assets/"]')
      .first();
    await expect(canonicalImage).toHaveAttribute("loading", "lazy");
    await expect(canonicalImage).toHaveAttribute("decoding", "async");
    await expect(canonicalImage).toHaveAttribute(
      "src",
      new RegExp(
        `/storage/v1/object/public/media-assets/${PROFILE_ID}/post_image/v1/`,
      ),
    );

    for (
      let expectedPages = 2;
      expectedPages <= FULL_PAGES + 1;
      expectedPages += 1
    ) {
      const loadMoreButton = page.getByRole("button", {
        name: "Carregar mais",
      });
      await loadMoreButton.scrollIntoViewIfNeeded();
      await loadMoreButton.click();
      const expectedCount =
        expectedPages <= FULL_PAGES
          ? expectedPages * PAGE_SIZE
          : FULL_PAGES * PAGE_SIZE + 8;
      await expect
        .poll(() => feedPosts.count(), { timeout: 20_000 })
        .toBe(expectedCount);
    }

    const renderedIds = await feedPosts.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-feed-post-id")),
    );
    expect(new Set(renderedIds).size).toBe(renderedIds.length);
    expect(feedRequestCount).toBe(FULL_PAGES + 1);
    expect(feedLimits).toEqual(
      Array.from({ length: FULL_PAGES + 1 }, () => PAGE_SIZE_WITH_SENTINEL),
    );
    expect([...requestedHosts]).not.toContain("tracker.example");

    const layout = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      contentWidth: document.documentElement.scrollWidth,
    }));
    expect(layout.contentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  });
});
