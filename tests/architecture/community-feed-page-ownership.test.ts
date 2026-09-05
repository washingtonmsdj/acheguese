import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G6 Community feed page ownership", () => {
  it("owns NovoPostPage in core/community-feed and keeps legacy direction one-way", () => {
    const canonical = read("src/core/community-feed/pages/NovoPostPage.tsx");
    const legacy = read("src/core/community/pages/NovoPostPage.tsx");
    const lazyImports = read("src/app/routes/lazyImports.ts");

    expect(canonical).toContain(
      'from "@/core/community-feed/components/CreatePostModal"',
    );
    expect(canonical).toContain(
      'from "@/core/community-experience/access"',
    );
    expect(canonical).not.toContain(
      '@/core/community/components/composer/CreatePostModal',
    );
    expect(canonical).not.toContain('from "@/core/community/access"');

    expect(legacy.trim()).toBe(
      'export { default } from "@/core/community-feed/pages/NovoPostPage";',
    );
    expect(lazyImports).toContain(
      'import("@/core/community-feed/pages/NovoPostPage")',
    );
    expect(
      existsSync(
        resolve(
          ROOT,
          "src/core/community-feed/pages/NovoPostPage.spec.tsx",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        resolve(ROOT, "src/core/community/pages/NovoPostPage.spec.tsx"),
      ),
    ).toBe(false);
  });
});
