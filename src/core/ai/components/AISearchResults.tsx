import { Link } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { AIActionResult } from "../domain/types";

interface AISearchResultsProps {
  result: AIActionResult | null;
  loading?: boolean;
  error?: string | null;
}

export function AISearchResults({ result, loading, error }: AISearchResultsProps) {
  if (loading) {
    return <p className="text-center text-sm text-muted-foreground">Interpretando intenção e buscando resultados reais...</p>;
  }

  if (error) {
    return <p className="text-center text-sm text-destructive">{error}</p>;
  }

  if (!result) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4" aria-live="polite">
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Intent:</span> {result.intent.type} ·{" "}
        <span className="font-medium text-foreground">JSON validado</span> · confiança{" "}
        {(result.intent.confidence * 100).toFixed(0)}%
      </div>

      <p className="text-sm text-muted-foreground">{result.message}</p>

      <div className="grid gap-3">
        {result.items.map((item) => {
          const body = (
            <Card className="transition hover:border-primary/40 hover:shadow-md">
              <CardContent className="flex gap-4 p-4">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-semibold text-muted-foreground">
                    {item.title.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold">{item.title}</h2>
                    {item.rating != null && <Badge variant="secondary">{item.rating.toFixed(1)}</Badge>}
                  </div>
                  {item.subtitle && <p className="text-sm text-muted-foreground">{item.subtitle}</p>}
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                  )}
                  {item.badges.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.badges.map((badge) => (
                        <Badge key={badge} variant="outline">{badge}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );

          return item.url ? (
            <Link key={`${item.kind}:${item.id}`} to={item.url} className="block">
              {body}
            </Link>
          ) : (
            <div key={`${item.kind}:${item.id}`}>{body}</div>
          );
        })}
      </div>
    </section>
  );
}
