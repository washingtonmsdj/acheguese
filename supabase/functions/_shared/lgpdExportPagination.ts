import {
  enforceSectionLimit,
  safeArray,
  type JsonRecord,
} from "./lgpdExportPolicy.ts";

export const PAGE_SIZE = 500;

export type ExportPageResult = {
  data: unknown;
  error: { code?: string } | null;
};

export type ExportPageFactory = (
  from: number,
  to: number,
) => PromiseLike<ExportPageResult>;

export async function requireAllExportRows(
  section: string,
  pageFactory: ExportPageFactory,
): Promise<JsonRecord[]> {
  const rows: JsonRecord[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await pageFactory(from, to);

    if (error) {
      console.error("[user-export-data] required section failed", {
        section,
        code: typeof error.code === "string" ? error.code : "unknown",
      });
      throw new Error(`EXPORT_SECTION_FAILED:${section}`);
    }

    const page = safeArray(data);
    rows.push(...page);
    enforceSectionLimit(section, rows);

    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}
