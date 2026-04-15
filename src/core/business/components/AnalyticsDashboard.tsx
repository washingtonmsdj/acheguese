import { TrendingUp } from "lucide-react";

interface Props {
  businessId: string;
}

export default function AnalyticsDashboard({ businessId: _ }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <TrendingUp className="h-10 w-10 opacity-40" />
      <p className="text-sm">Analytics em breve</p>
    </div>
  );
}
