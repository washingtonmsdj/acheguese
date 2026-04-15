/**
 * Centralized JSON Parsing Utilities
 * Handles lenient parsing for AI-generated JSON
 */

import { Result, Ok, Err } from "./result";

/**
 * Parse JSON with lenient error handling
 * Attempts to fix common AI-generated JSON issues
 */
export function parseJsonLenient<T = unknown>(text: string): Result<T, Error> {
  if (!text || typeof text !== "string") {
    return Err(new Error("Invalid input: text must be a non-empty string"));
  }

  // Try standard JSON.parse first
  try {
    const parsed = JSON.parse(text);
    return Ok(parsed as T);
  } catch {
    // Continue to lenient parsing
  }

  // Remove markdown code fences
  let cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");

  // Try parsing cleaned text
  try {
    const parsed = JSON.parse(cleaned);
    return Ok(parsed as T);
  } catch {
    // Continue to more aggressive cleaning
  }

  // Remove trailing commas (common AI mistake)
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // Try parsing again
  try {
    const parsed = JSON.parse(cleaned);
    return Ok(parsed as T);
  } catch (error) {
    return Err(
      error instanceof Error
        ? error
        : new Error(`Failed to parse JSON: ${String(error)}`)
    );
  }
}

/**
 * Extract the first JSON object from text
 * Useful for parsing AI responses with extra text
 */
export function extractFirstJsonObject<T = unknown>(
  text: string
): Result<T, Error> {
  if (!text || typeof text !== "string") {
    return Err(new Error("Invalid input: text must be a non-empty string"));
  }

  // Find first { and last }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return Err(new Error("No JSON object found in text"));
  }

  const jsonText = text.substring(firstBrace, lastBrace + 1);
  return parseJsonLenient<T>(jsonText);
}

/**
 * Parse JSON array with lenient error handling
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

/**
 * Safely stringify JSON with error handling
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
