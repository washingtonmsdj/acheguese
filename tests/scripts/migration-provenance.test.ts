import { describe, expect, it } from "vitest";
import {
  fingerprintMigrationSql,
  splitSqlStatements,
} from "../../scripts/lib/migration-statement-fingerprint.mjs";

describe("migration statement fingerprint", () => {
  it("preserva ponto e virgula dentro de strings e blocos dollar-quoted", () => {
    const sql = `select ';'::text;
create function public.example() returns text language plpgsql as $$
begin
  return 'a;b';
end;
$$;
-- comentario final
select 2;`;

    expect(splitSqlStatements(sql)).toHaveLength(3);
  });

  it("separa artefato textual de equivalencia operacional", () => {
    const withComment = fingerprintMigrationSql(
      "-- origem perdida\nrevoke execute on function public.f() from anon;",
    );
    const withoutComment = fingerprintMigrationSql(
      "revoke execute on function public.f() from anon;",
    );

    expect(withComment.raw.sha256).not.toBe(withoutComment.raw.sha256);
    expect(withComment.operational).toEqual(withoutComment.operational);
  });
});
