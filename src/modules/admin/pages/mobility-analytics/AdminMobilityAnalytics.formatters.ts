export const formatAnalyticsDate = (date: string) => {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
};

export const formatAnalyticsCurrency = (value: number) =>
  `R$ ${value.toFixed(2).replace(".", ",")}`;
