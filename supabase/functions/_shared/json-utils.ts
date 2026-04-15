/**
 * JSON Utilities for Deno
 * Lenient JSON parsing for AI-generated content
 */

// ============================================================================
// TYPES
// ============================================================================

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

const Ok = <T>(data: T): Result<T, never> => ({ success: true, data });
const Err = <E>(error: E): Result<never, E> => ({ success: false, error });

// ============================================================================
// JSON PARSING
// ============================================================================

/**
 * Extract first JSON object from text
 */
export function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let braceCount = 0;
  let jsonStart = -1;
  let jsonEnd = -1;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      if (braceCount === 0) jsonStart = i;
      braceCount++;
    } else if (ch === "}") {
      braceCount--;
      if (braceCount === 0) {
        jsonEnd = i;
        break;
      }
    }
  }

  if (jsonStart === -1 || jsonEnd === -1) return null;
  return text.slice(jsonStart, jsonEnd + 1);
}

/**
 * Parse JSON with lenient error handling
 */
export function parseJsonLenient<T = unknown>(text: string): Result<T, Error> {
  if (!text || typeof text !== "string") {
    return Err(new Error("Invalid input: text must be a non-empty string"));
  }

  const sanitize = (input: string): string =>
    input
      // Remove code fences
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      // Remove control chars
      .replace(/[\x00-\x1F\x7F]/g, "")
      .trim();

  const tryParse = (candidate: string): T | null => {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Fix common JSON issues: trailing commas
      const fixed = candidate
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .trim();
      try {
        return JSON.parse(fixed) as T;
      } catch {
        return null;
      }
    }
  };

  const cleaned = sanitize(text);

  // 1) Direct parse
  const direct = tryParse(cleaned);
  if (direct !== null) return Ok(direct);

  // 2) Best-effort substring from first '{' to last '}'
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const sliced = cleaned.slice(start, end + 1);
    const slicedParsed = tryParse(sliced);
    if (slicedParsed !== null) return Ok(slicedParsed);
  }

  // 3) First balanced JSON object
  const extracted = extractFirstJsonObject(cleaned);
  if (extracted) {
    const extractedParsed = tryParse(extracted);
    if (extractedParsed !== null) return Ok(extractedParsed);
  }

  return Err(new Error("Failed to parse JSON after all attempts"));
}

/**
 * Stringify JSON with error handling
 */
export function stringifyJson(
  value: unknown,
  pretty: boolean = false
): Result<string, Error> {
  try {
    const json = pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
    return Ok(json);
  } catch (error) {
    return Err(
      error instanceof Error
        ? error
        : new Error(`Failed to stringify JSON: ${String(error)}`)
    );
  }
}

/**
 * Parse JSON array with validation
 */
export function parseJsonArray<T = unknown>(text: string): Result<T[], Error> {
  const result = parseJsonLenient<T[]>(text);
  
  if (!result.success) {
    return result;
  }
  
  if (!Array.isArray(result.data)) {
    return Err(new Error("Parsed value is not an array"));
  }
  
  return Ok(result.data);
}
