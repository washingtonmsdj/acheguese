import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { BusinessSlugSection } from "@/modules/business/components/identity/BusinessSlugSection";

describe("BusinessSlugSection", () => {
  it("mostra preview publico curto e separa o link premium /p", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BusinessSlugSection
          slug="padaria-x"
          onSlugChange={vi.fn()}
          businessName="Padaria X"
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/:comunidade\/seu-link/)).toBeInTheDocument();
    expect(screen.getByText(/:comunidade\/padaria-x/)).toBeInTheDocument();
    expect(screen.getByText(/\/p\/padaria-x/)).toBeInTheDocument();
    expect(screen.queryByText(/\/empresas\/uf\/cidade\/bairro/)).not.toBeInTheDocument();
  });
});
