import { describe, expect, it, vi } from "vitest";

import {
  SUPABASE_CLI_ENTRYPOINT,
  createSupabaseCliInvocation,
  runSupabaseCli,
} from "../../tools/supabase/supabase-cli-runner.mjs";

describe("Supabase CLI runner", () => {
  it("passes spaces, special characters and project refs as literal arguments", () => {
    const args = [
      "db",
      "query",
      "--project-ref",
      "xhdowzacfujckjelqhtd",
      "--file",
      "C:\\Temp\\Achegue Se & Poll\\probe $(whoami).sql",
      "--output",
      "json",
    ];

    const invocation = createSupabaseCliInvocation(args, {
      cwd: "C:\\Workspace with spaces\\acheguese",
    });

    expect(invocation.executable).toBe(process.execPath);
    expect(invocation.args).toEqual([SUPABASE_CLI_ENTRYPOINT, ...args]);
    expect(invocation.options).toEqual({
      cwd: "C:\\Workspace with spaces\\acheguese",
      encoding: "utf8",
      shell: false,
    });
  });

  it("preserves JSON stdout, stderr and the CLI exit code without a shell", () => {
    const result = {
      error: undefined,
      status: 7,
      stderr: "remote warning",
      stdout: '{"rows":[{"ready":true}]}',
    };
    const spawn = vi.fn(() => result);

    expect(
      runSupabaseCli(["db", "query", "--output", "json"], {
        cwd: "C:\\repo",
        spawn,
      }),
    ).toBe(result);
    expect(spawn).toHaveBeenCalledOnce();
    expect(spawn).toHaveBeenCalledWith(
      process.execPath,
      [SUPABASE_CLI_ENTRYPOINT, "db", "query", "--output", "json"],
      { cwd: "C:\\repo", encoding: "utf8", shell: false },
    );
  });

  it("rejects non-string arguments before process creation", () => {
    expect(() =>
      createSupabaseCliInvocation(["projects", 123] as unknown as string[]),
    ).toThrow("Supabase CLI args must be an array of strings.");
  });
});