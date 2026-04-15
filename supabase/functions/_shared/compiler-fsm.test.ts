/**
 * Testes Unitários: Compiler FSM
 * 
 * Valida o comportamento do FSM do compilador Ordax.
 */

import { assertEquals, assertThrows } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  assertTransition,
  canTransition,
  getValidNextPhases,
  isValidPhase,
  getAllPhases,
  isFinalPhase,
  getPhaseDistance,
  getPhasePath,
  type CompilerPhase,
} from "./compiler-fsm.ts";

Deno.test("FSM: assertTransition - transições válidas", () => {
  // Não deve lançar erro
  assertTransition("interpretation", "plan");
  assertTransition("plan", "validation");
  assertTransition("validation", "confirmation");
  assertTransition("confirmation", "compilation");
});

Deno.test("FSM: assertTransition - transições inválidas", () => {
  assertThrows(
    () => assertTransition("interpretation", "validation"),
    Error,
    "FSM_VIOLATION"
  );
  
  assertThrows(
    () => assertTransition("plan", "interpretation"),
    Error,
    "FSM_VIOLATION"
  );
  
  assertThrows(
    () => assertTransition("compilation", "plan"),
    Error,
    "FSM_VIOLATION"
  );
});

Deno.test("FSM: canTransition - transições válidas", () => {
  assertEquals(canTransition("interpretation", "plan"), true);
  assertEquals(canTransition("plan", "validation"), true);
  assertEquals(canTransition("validation", "confirmation"), true);
  assertEquals(canTransition("confirmation", "compilation"), true);
});

Deno.test("FSM: canTransition - transições inválidas", () => {
  assertEquals(canTransition("interpretation", "validation"), false);
  assertEquals(canTransition("plan", "interpretation"), false);
  assertEquals(canTransition("compilation", "plan"), false);
  assertEquals(canTransition("interpretation", "compilation"), false);
});

Deno.test("FSM: getValidNextPhases", () => {
  assertEquals(getValidNextPhases("interpretation"), ["plan"]);
  assertEquals(getValidNextPhases("plan"), ["validation"]);
  assertEquals(getValidNextPhases("validation"), ["confirmation"]);
  assertEquals(getValidNextPhases("confirmation"), ["compilation"]);
  assertEquals(getValidNextPhases("compilation"), []);
});

Deno.test("FSM: isValidPhase", () => {
  assertEquals(isValidPhase("interpretation"), true);
  assertEquals(isValidPhase("plan"), true);
  assertEquals(isValidPhase("validation"), true);
  assertEquals(isValidPhase("confirmation"), true);
  assertEquals(isValidPhase("compilation"), true);
  assertEquals(isValidPhase("invalid"), false);
  assertEquals(isValidPhase("spec"), false);
});

Deno.test("FSM: getAllPhases", () => {
  const phases = getAllPhases();
  assertEquals(phases.length, 5);
  assertEquals(phases.includes("interpretation"), true);
  assertEquals(phases.includes("plan"), true);
  assertEquals(phases.includes("validation"), true);
  assertEquals(phases.includes("confirmation"), true);
  assertEquals(phases.includes("compilation"), true);
});

Deno.test("FSM: isFinalPhase", () => {
  assertEquals(isFinalPhase("interpretation"), false);
  assertEquals(isFinalPhase("plan"), false);
  assertEquals(isFinalPhase("validation"), false);
  assertEquals(isFinalPhase("confirmation"), false);
  assertEquals(isFinalPhase("compilation"), true);
});

Deno.test("FSM: getPhaseDistance - mesma fase", () => {
  assertEquals(getPhaseDistance("interpretation", "interpretation"), 0);
  assertEquals(getPhaseDistance("plan", "plan"), 0);
});

Deno.test("FSM: getPhaseDistance - fases adjacentes", () => {
  assertEquals(getPhaseDistance("interpretation", "plan"), 1);
  assertEquals(getPhaseDistance("plan", "validation"), 1);
  assertEquals(getPhaseDistance("validation", "confirmation"), 1);
  assertEquals(getPhaseDistance("confirmation", "compilation"), 1);
});

Deno.test("FSM: getPhaseDistance - fases distantes", () => {
  assertEquals(getPhaseDistance("interpretation", "validation"), 2);
  assertEquals(getPhaseDistance("interpretation", "confirmation"), 3);
  assertEquals(getPhaseDistance("interpretation", "compilation"), 4);
  assertEquals(getPhaseDistance("plan", "compilation"), 3);
});

Deno.test("FSM: getPhaseDistance - caminho inválido (volta)", () => {
  assertEquals(getPhaseDistance("plan", "interpretation"), -1);
  assertEquals(getPhaseDistance("compilation", "interpretation"), -1);
  assertEquals(getPhaseDistance("validation", "plan"), -1);
});

Deno.test("FSM: getPhasePath - mesma fase", () => {
  assertEquals(getPhasePath("interpretation", "interpretation"), ["interpretation"]);
});

Deno.test("FSM: getPhasePath - caminho válido", () => {
  assertEquals(getPhasePath("interpretation", "plan"), ["interpretation", "plan"]);
  assertEquals(getPhasePath("interpretation", "validation"), ["interpretation", "plan", "validation"]);
  assertEquals(getPhasePath("interpretation", "compilation"), [
    "interpretation",
    "plan",
    "validation",
    "confirmation",
    "compilation",
  ]);
  assertEquals(getPhasePath("plan", "confirmation"), ["plan", "validation", "confirmation"]);
});

Deno.test("FSM: getPhasePath - caminho inválido", () => {
  assertEquals(getPhasePath("plan", "interpretation"), null);
  assertEquals(getPhasePath("compilation", "interpretation"), null);
  assertEquals(getPhasePath("validation", "plan"), null);
});

Deno.test("FSM: Fluxo completo interpretation → compilation", () => {
  const phases: CompilerPhase[] = ["interpretation", "plan", "validation", "confirmation", "compilation"];
  
  for (let i = 0; i < phases.length - 1; i++) {
    const current = phases[i];
    const next = phases[i + 1];
    
    // Deve permitir avançar
    assertEquals(canTransition(current, next), true);
    assertTransition(current, next);
    
    // Não deve permitir voltar
    if (i > 0) {
      const previous = phases[i - 1];
      assertEquals(canTransition(current, previous), false);
    }
  }
});

Deno.test("FSM: Compilation é estado final", () => {
  assertEquals(isFinalPhase("compilation"), true);
  assertEquals(getValidNextPhases("compilation"), []);
  
  // Não pode sair de compilation
  assertThrows(() => assertTransition("compilation", "interpretation"));
  assertThrows(() => assertTransition("compilation", "plan"));
  assertThrows(() => assertTransition("compilation", "validation"));
  assertThrows(() => assertTransition("compilation", "confirmation"));
});
