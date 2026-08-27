import { spawnSync } from "node:child_process";

const steps = [
  ["npm", ["run", "security:validate"]],
  ["npm", ["run", "lint:security"]],
  ["npm", ["run", "validate:upload:ssot"]],
  ["npm", ["run", "validate:architecture:core-platform"]],
  ["npm", ["run", "generate:sitemap"]],
  ["node", ["tools/release/validate-production-sitemap.mjs", "public"]],
  ["npm", ["run", "build:vercel"]],
  ["node", ["tools/release/validate-production-sitemap.mjs", "dist"]],
];

for (const [command, args] of steps) {
  console.log(`\n[vercel-build] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    console.error(`[vercel-build] failed to start ${command}:`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
