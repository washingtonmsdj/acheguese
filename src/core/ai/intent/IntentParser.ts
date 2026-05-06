import { AIIntentSchema, type AIIntent, type AIProvider, type IntentParserInput } from "../domain/types";
import { MockAIProvider } from "../providers/MockAIProvider";

export class IntentParser {
  constructor(
    private readonly provider: AIProvider = new MockAIProvider(),
    private readonly fallbackProvider: AIProvider = new MockAIProvider(),
  ) {}

  async parse(input: IntentParserInput): Promise<AIIntent> {
    const safeQuery = input.query.trim();
    if (!safeQuery) {
      return AIIntentSchema.parse({
        type: "unknown",
        query: input.query,
        normalizedQuery: "unknown",
        confidence: 0,
        filters: { tags: [] },
        source: "fallback",
      });
    }

    try {
      const providerResult = await this.provider.parseIntent({
        ...input,
        query: safeQuery,
      });
      return AIIntentSchema.parse(providerResult);
    } catch {
      const fallbackResult = await this.fallbackProvider.parseIntent({
        ...input,
        query: safeQuery,
      });
      return AIIntentSchema.parse(fallbackResult);
    }
  }
}
