import type {
  PizzaDough,
  PizzaEdge,
  PizzaFlavor,
  PizzaFlavorSelection,
  PizzaSize,
  PizzaValidationResult,
} from "./types";

function sumFractions(selection: PizzaFlavorSelection[]): number {
  return Number(selection.reduce((total, entry) => total + entry.fraction, 0).toFixed(4));
}

export class PizzaValidationService {
  static validateBuild(params: {
    size?: PizzaSize | null;
    flavors: PizzaFlavor[];
    flavor_selection: PizzaFlavorSelection[];
    edge?: PizzaEdge | null;
    dough?: PizzaDough | null;
  }): PizzaValidationResult {
    const errors: string[] = [];
    const { size, flavor_selection: selection } = params;

    if (!size) {
      errors.push("Selecione um tamanho de pizza.");
    } else if (!size.is_available) {
      errors.push(`Tamanho indisponivel: ${size.name}.`);
    }

    if (!selection.length) {
      errors.push("Selecione pelo menos um sabor.");
    }

    if (size && selection.length > size.max_flavors) {
      errors.push(
        `${size.name} permite no maximo ${size.max_flavors} sabor(es).`,
      );
    }

    const uniqueFlavorIds = new Set(selection.map((entry) => entry.flavor_id));
    if (uniqueFlavorIds.size !== selection.length) {
      errors.push("Nao repita o mesmo sabor na mesma pizza.");
    }

    const fractionTotal = sumFractions(selection);
    if (selection.length > 0 && Math.abs(fractionTotal - 1) > 0.001) {
      errors.push("As fracoes dos sabores devem somar 1 pizza inteira.");
    }

    for (const entry of selection) {
      if (entry.fraction <= 0 || entry.fraction > 1) {
        errors.push("Cada sabor precisa ter fracao maior que zero e menor ou igual a 1.");
      }

      const flavor = params.flavors.find((candidate) => candidate.id === entry.flavor_id);
      if (!flavor) {
        errors.push(`Sabor de pizza nao encontrado: ${entry.flavor_id}.`);
      } else if (!flavor.is_available) {
        errors.push(`Sabor indisponivel: ${flavor.name}.`);
      }
    }

    if (params.edge && !params.edge.is_available) {
      errors.push(`Borda indisponivel: ${params.edge.name}.`);
    }

    if (params.dough && !params.dough.is_available) {
      errors.push(`Massa indisponivel: ${params.dough.name}.`);
    }

    return {
      is_valid: errors.length === 0,
      errors,
    };
  }
}
