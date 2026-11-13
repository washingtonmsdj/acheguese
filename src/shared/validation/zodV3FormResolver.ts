import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import { z } from "zod/v3";

/**
 * React Hook Form models use the parsed Zod output type. Some legacy-v3
 * schemas intentionally preprocess unknown form values before producing that
 * output, while @hookform/resolvers correctly exposes the wider input type.
 * This adapter keeps that one compatibility cast at the integration boundary.
 */
export function zodV3FormResolver<
  TValues extends FieldValues,
  TInput = unknown,
>(
  schema: z.ZodType<TValues, z.ZodTypeDef, TInput>,
): Resolver<TValues> {
  return zodResolver(schema) as unknown as Resolver<TValues>;
}
