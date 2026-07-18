import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { loadEnv } from "vite";

function loadClientEnv(mode: string) {
  return {
    ...loadEnv("example", process.cwd(), "VITE_"),
    ...loadEnv(mode, process.cwd(), "VITE_"),
  };
}

export default defineConfig(({ mode }) => {
  const isOperational = mode === "operational";
  const configuredMaxWorkers = Number.parseInt(
    process.env.VITEST_MAX_WORKERS ?? "",
    10,
  );
  const deterministicMaxWorkers =
    Number.isInteger(configuredMaxWorkers) && configuredMaxWorkers > 0
      ? configuredMaxWorkers
      : 4;

  return {
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: isOperational
        ? ["./src/test/setup.ts"]
        : [
            "./src/test/setup.ts",
            "./tests/helpers/deterministic-network-guard.ts",
          ],
      ...(isOperational
        ? { globalSetup: ["./tests/helpers/operational-suite-setup.ts"] }
        : {}),
      ...(isOperational ? { include: ["tests/operational/**/*.test.ts"] } : {}),
      // Fixtures remotas compartilham estado e precisam de execução serial.
      fileParallelism: !isOperational,
      maxWorkers: isOperational ? 1 : deterministicMaxWorkers,
      testTimeout: isOperational ? 120000 : 30000,
      hookTimeout: isOperational ? 30000 : 10000,
      env: loadClientEnv(mode),
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/tmp/**",
        "tmp/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
        "e2e/**",
        "tests/e2e/**",
        ...(isOperational ? [] : ["tests/operational/**"]),
      ],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/test/",
          "**/*.d.ts",
          "**/*.config.*",
          "**/dist/**",
        ],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
  };
});
