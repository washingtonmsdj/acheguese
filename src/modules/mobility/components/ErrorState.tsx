import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

interface ErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  title?: string;
  description?: string;
}

export function ErrorState({
  error,
  onRetry,
  title = "Erro ao carregar dados",
  description,
}: ErrorStateProps) {
  return (
    <Card className="bg-card border-border p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
        {description || error?.message || "Ocorreu um erro ao carregar os dados."}
      </p>
      <Button
        onClick={onRetry}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Tentar novamente
      </Button>
    </Card>
  );
}
