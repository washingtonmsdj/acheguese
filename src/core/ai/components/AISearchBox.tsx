import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

interface AISearchBoxProps {
  initialQuery?: string;
  onSearch: (query: string) => void | Promise<void>;
  loading?: boolean;
}

export function AISearchBox({ initialQuery = "", onSearch, loading }: AISearchBoxProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSearch(query);
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl">
      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 shadow-lg shadow-black/5">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busque como você fala: pizzaria com delivery, farmácia perto de mim..."
          className="h-12 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
          aria-label="Busca inteligente"
        />
        <Button type="submit" disabled={loading || query.trim().length < 2} className="rounded-full">
          {loading ? "Buscando" : "Buscar"}
        </Button>
      </div>
    </form>
  );
}
