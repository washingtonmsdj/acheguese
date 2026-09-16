import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");
const cadastroHook = readFileSync(
  resolve(repoRoot, "src/app/features/onboarding/hooks/useCadastro.ts"),
  "utf8",
);

describe("cadastro server error surface", () => {
  it("keeps field-bound server errors out of the global destructive banner", () => {
    expect(cadastroHook).toContain("resolveCadastroServerErrorField(raw)");
    expect(cadastroHook).toContain("if (field) {");
    expect(cadastroHook).toContain('form.setError(field, { type: "server", message });');
    expect(cadastroHook).toContain('form.setError("root.serverError", { type: "server", message });');
    expect(cadastroHook).toContain("} else {");

    const fieldBranch = cadastroHook.indexOf("if (field) {");
    const rootError = cadastroHook.indexOf('form.setError("root.serverError"', fieldBranch);
    const elseBranch = cadastroHook.indexOf("} else {", fieldBranch);

    expect(fieldBranch).toBeGreaterThan(-1);
    expect(elseBranch).toBeGreaterThan(fieldBranch);
    expect(rootError).toBeGreaterThan(elseBranch);
  });
});
