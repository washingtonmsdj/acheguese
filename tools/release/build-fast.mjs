#!/usr/bin/env node

import { spawn } from "node:child_process";

console.log("Build rapido (desenvolvimento)\n");
console.log("Otimizacoes pesadas desabilitadas para velocidade");
console.log("Para build de producao, use: npm run build\n");

const startTime = Date.now();
const child = spawn(
  "node",
  ["node_modules/vite/bin/vite.js", "build", "--mode", "development", "--minify", "false", "--sourcemap", "false"],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_SKIP_SOURCEMAP: "true",
      VITE_SKIP_COMPRESSED_SIZE: "true",
    },
  },
);

child.on("exit", (code) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  if (code === 0) {
    console.log(`\nBuild concluido em ${duration}s\n`);
    console.log("Este build e apenas para testes locais");
    console.log("Para producao, use: npm run build\n");
    process.exit(0);
  }

  console.error(`\nBuild falhou apos ${duration}s\n`);
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.error(`\nBuild falhou apos ${duration}s`);
  console.error(error);
  process.exit(1);
});
