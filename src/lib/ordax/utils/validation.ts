/**
 * Input Validation Utilities
 * Centralized validation to prevent injection and ensure data integrity
 */

import { COMPILER_PHASES, type CompilerPhase } from "../constants";
import { VALIDATION_CONSTANTS } from "../config";
const VALIDATION_CONFIG = VALIDATION_CONSTANTS;
import { Result, Ok, Err } from "./result";

/**
 * Validate compiler phase
 */
export function validatePhase(phase: unknown): Result<CompilerPhase, Error> {
  if (typeof phase !== "string") {
    return Err(new Error("Phase must be a string"));
  }

  const validPhases = Object.values(COMPILER_PHASES);
  if (!validPhases.includes(phase as CompilerPhase)) {
    return Err(
      new Error(
        `Invalid phase: ${phase}. Valid phases: ${validPhases.join(", ")}`
      )
    );
  }

  return Ok(phase as CompilerPhase);
}

/**
 * Validate session ID
 */
export function validateSessionId(sessionId: unknown): Result<string, Error> {
  if (typeof sessionId !== "string") {
    return Err(new Error("Session ID must be a string"));
  }

  if (sessionId.trim().length === 0) {
    return Err(new Error("Session ID cannot be empty"));
  }

  // Basic format validation (can be enhanced)
  if (!/^[a-zA-Z0-9_-]+$/.test(sessionId)) {
    return Err(
      new Error("Session ID contains invalid characters")
    );
  }

  return Ok(sessionId);
}

/**
 * Validate messages array
 */
export function validateMessages(messages: unknown): Result<unknown[], Error> {
  if (!Array.isArray(messages)) {
    return Err(new Error("Messages must be an array"));
  }

  if (messages.length === 0) {
    return Err(new Error("Messages array cannot be empty"));
  }

  // Validate each message has required fields
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") {
      return Err(new Error(`Message at index ${i} is invalid`));
    }

    if (!("role" in msg) || !("content" in msg)) {
      return Err(
        new Error(`Message at index ${i} missing required fields (role, content)`)
      );
    }

    if (typeof msg.role !== "string" || typeof msg.content !== "string") {
      return Err(
        new Error(`Message at index ${i} has invalid field types`)
      );
    }
  }

  return Ok(messages);
}

/**
 * Validate game title
 */
export function validateTitle(title: unknown): Result<string, Error> {
  if (typeof title !== "string") {
    return Err(new Error("Title must be a string"));
  }

  const trimmed = title.trim();

  if (trimmed.length < VALIDATION_CONFIG.MIN_TITLE_LENGTH) {
    return Err(
      new Error(
        `Title must be at least ${VALIDATION_CONFIG.MIN_TITLE_LENGTH} character(s)`
      )
    );
  }

  if (trimmed.length > VALIDATION_CONFIG.MAX_TITLE_LENGTH) {
    return Err(
      new Error(
        `Title must be at most ${VALIDATION_CONFIG.MAX_TITLE_LENGTH} characters`
      )
    );
  }

  return Ok(trimmed);
}

/**
 * Validate game description
 */
export function validateDescription(description: unknown): Result<string, Error> {
  if (typeof description !== "string") {
    return Err(new Error("Description must be a string"));
  }

  const trimmed = description.trim();

  if (trimmed.length < VALIDATION_CONFIG.MIN_DESCRIPTION_LENGTH) {
    return Err(
      new Error(
        `Description must be at least ${VALIDATION_CONFIG.MIN_DESCRIPTION_LENGTH} character(s)`
      )
    );
  }

  if (trimmed.length > VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH) {
    return Err(
      new Error(
        `Description must be at most ${VALIDATION_CONFIG.MAX_DESCRIPTION_LENGTH} characters`
      )
    );
  }

  return Ok(trimmed);
}

/**
 * Sanitize user input to prevent injection
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}
