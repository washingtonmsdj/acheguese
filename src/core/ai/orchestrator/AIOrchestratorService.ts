import { SearchBusinessesActionHandler } from "../actions/SearchBusinessesActionHandler";
import { SearchServicesActionHandler } from "../actions/SearchServicesActionHandler";
import type { IActionHandler } from "../actions/IActionHandler";
import type { AIActionResult, AIOrchestratorSearchInput } from "../domain/types";
import { IntentParser } from "../intent/IntentParser";

export class AIOrchestratorService {
  private readonly handlers: Map<string, IActionHandler>;

  constructor(
    private readonly intentParser = new IntentParser(),
    handlers: IActionHandler[] = [
      new SearchBusinessesActionHandler(),
      new SearchServicesActionHandler(),
    ],
  ) {
    this.handlers = new Map(handlers.map((handler) => [handler.type, handler]));
  }

  async search(input: AIOrchestratorSearchInput): Promise<AIActionResult> {
    const intent = await this.intentParser.parse({
      query: input.query,
      locationId: input.context.locationId,
    });

    if (intent.type === "unknown") {
      return {
        intent,
        items: [],
        message: "Nao consegui identificar uma busca de empresa ou servico.",
      };
    }

    const handler = this.handlers.get(intent.type);
    if (!handler) {
      return {
        intent,
        items: [],
        message: "Busca ainda nao suportada nesta fase.",
      };
    }

    const territoryFilter =
      input.context.territoryFilter ??
      (input.context.locationId
        ? { scope: "location" as const, location_id: input.context.locationId }
        : undefined);

    const items = await handler.execute(intent, {
      ...input.context,
      territoryFilter,
    });

    const territoryLabel = input.context.territoryLabel?.trim();
    const territorySuffix = territoryLabel
      ? ` em ${territoryLabel}`
      : territoryFilter
        ? " neste territorio"
        : "";

    return {
      intent,
      items,
      message: items.length > 0
        ? `${items.length} resultado(s) encontrado(s).`
        : `Nenhum resultado real encontrado para esta busca${territorySuffix}.`,
    };
  }
}

export const aiOrchestratorService = new AIOrchestratorService();
