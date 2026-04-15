import { BarChart3 } from "lucide-react";

interface Props {
  businessId: string;
}

export default function EmpresaDashboardTab({ businessId: _ }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <BarChart3 className="h-10 w-10 opacity-40" />
      <p className="text-sm">Visão geral em breve</p>
    </div>
  );
}
