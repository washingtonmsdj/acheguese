export interface ReportReasonOption<TReason extends string = string> {
  id: TReason;
  label: string;
}

export const COMMUNITY_REPORT_REASON_OPTIONS = [
  { id: "spam", label: "Spam ou propaganda abusiva" },
  { id: "harassment", label: "Assedio ou ataque pessoal" },
  { id: "hate", label: "Odio ou discriminacao" },
  { id: "violence", label: "Violencia ou ameaca" },
  { id: "misinformation", label: "Informacao falsa ou enganosa" },
  { id: "malicious_link", label: "Link malicioso ou fraude" },
  { id: "other", label: "Outro motivo" },
] as const satisfies readonly ReportReasonOption[];

export type CommunityReportReason =
  (typeof COMMUNITY_REPORT_REASON_OPTIONS)[number]["id"];

export function isReportReason<TReason extends string>(
  options: readonly ReportReasonOption<TReason>[],
  value: string,
): value is TReason {
  return options.some((option) => option.id === value);
}

export function reportReasonOptionsFromLabels<TReason extends string>(
  labels: Readonly<Record<TReason, string>>,
): readonly ReportReasonOption<TReason>[] {
  return (Object.keys(labels) as TReason[]).map((id) => ({
    id,
    label: labels[id],
  }));
}
