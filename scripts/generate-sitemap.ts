import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env", override: false });

async function main() {
  const [{ generateAndSaveSitemap }, { logger }] = await Promise.all([
    import("@/core/routing/seo/generateSitemap"),
    import("@/shared/utils/logger"),
  ]);
  await generateAndSaveSitemap();

  logger.info("scripts.generate-sitemap.success");
}

main().catch((error) => {
  console.error("[scripts.generate-sitemap] failure", error);
  process.exitCode = 1;
});
