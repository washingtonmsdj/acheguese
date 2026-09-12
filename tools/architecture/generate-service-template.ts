/**
 * RETIRED: generic SSOT service generator.
 *
 * This command is intentionally fail-closed. A service owner cannot be derived
 * safely from a class name because table ownership, read/write authority,
 * projections, pagination, RLS/RPC boundaries and tests are domain-specific.
 *
 * Keep this small compatibility entrypoint only while package.json still exposes
 * `generate:service`. It must never generate source files, infer table names,
 * emit direct Supabase CRUD, `select('*')`, cache policy, or placeholder tests.
 */

const requestedName = process.argv[2]?.trim();
const target = requestedName ? ` para ${requestedName}` : "";

console.error(
  [
    `generate:service foi aposentado${target}.`,
    "Crie ou evolua o owner no dominio correto depois de identificar:",
    "- contrato e responsabilidade do dominio;",
    "- owner canonico de persistencia;",
    "- read model/paginacao necessarios;",
    "- autoridade de escrita (RLS/RPC/Edge quando aplicavel);",
    "- testes reais e ratchets arquiteturais.",
    "Nao gere CRUD generico ou nomes de tabela por convencao.",
  ].join("\n"),
);

process.exitCode = 1;
