import { formatBrl } from "@/shared/utils/currency";

export const formatAnalyticsDate = (date: string) => {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
};

export const formatAnalyticsCurrency = (value: number) =>
  formatBrl(value);
