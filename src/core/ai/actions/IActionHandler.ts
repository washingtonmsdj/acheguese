import type { AIActionContext, AIActionResultItem, AIIntent, AIIntentType } from "../domain/types";

export interface IActionHandler {
  readonly type: AIIntentType;
  execute(intent: AIIntent, context: AIActionContext): Promise<AIActionResultItem[]>;
}
