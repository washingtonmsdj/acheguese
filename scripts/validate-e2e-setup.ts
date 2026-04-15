#!/usr/bin/env tsx
/**
 * Script para validar setup E2E real do projeto.
 * Alinhado ao fluxo atual:
 * - login pode usar E2E_* ou TEST_DRIVER_*
 * - recovery usa E2E_RECOVERY_EMAIL opcional, com fallback sintatico valido
 * - admin/service role e opcional para asserts de banco
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env.local" });

interface ValidationResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
}

const results: ValidationResult[] = [];

function addResult(name: string, status: ValidationResult["status"], message: string) {
  results.push({ name, status, message });
}

function logResult(result: ValidationResult) {
  const icon =
    result.status === "PASS" ? "✅" : result.status === "FAIL" ? "❌" : "⚠️";
  console.log(`   ${icon} ${result.name}: ${result.message}`);
}

function getLoginCredential() {
  const email = process.env.E2E_USER_EMAIL || process.env.TEST_DRIVER_EMAIL || null;
  const password = process.env.E2E_USER_PASSWORD || process.env.TEST_DRIVER_PASSWORD || null;

  return { email, password };
}

async function validateEnvironment() {
  console.log("Validando configuracao E2E\n");
  console.log("=".repeat(60));

  console.log("\n1. Variaveis de ambiente");
  console.log("-".repeat(60));

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const loginCredential = getLoginCredential();
  const adminEmail = process.env.E2E_ADMIN_EMAIL || null;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || null;
  const recoveryEmail = process.env.E2E_RECOVERY_EMAIL || "e2e-recovery@example.com";

  const envChecks: ValidationResult[] = [
    {
      name: "VITE_SUPABASE_URL",
      status: supabaseUrl ? "PASS" : "FAIL",
      message: supabaseUrl ? "Configurada" : "Nao configurada",
    },
    {
      name: "VITE_SUPABASE_PUBLISHABLE_KEY",
      status: anonKey ? "PASS" : "FAIL",
      message: anonKey ? "Configurada" : "Nao configurada",
    },
    {
      name: "Credencial de login",
      status: loginCredential.email && loginCredential.password ? "PASS" : "FAIL",
      message:
        loginCredential.email && loginCredential.password
          ? `Usando ${loginCredential.email}`
          : "Informe E2E_USER_* ou TEST_DRIVER_*",
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      status: serviceRoleKey ? "PASS" : "WARN",
      message: serviceRoleKey
        ? "Disponivel para asserts administrativos"
        : "Ausente. Asserts de banco e recovery por @usuario ficam limitados",
    },
    {
      name: "Credencial admin",
      status: adminEmail && adminPassword ? "PASS" : "WARN",
      message:
        adminEmail && adminPassword
          ? `Usando ${adminEmail}`
          : "Opcional. Informe E2E_ADMIN_* apenas se houver testes administrativos",
    },
    {
      name: "E2E_RECOVERY_EMAIL",
      status: "PASS",
      message: `Usando ${recoveryEmail}`,
    },
  ];

  envChecks.forEach((result) => {
    addResult(result.name, result.status, result.message);
    logResult(result);
  });

  console.log("\n2. Servidor de desenvolvimento");
  console.log("-".repeat(60));

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || process.env.BASE_URL || "http://localhost:8080";

  try {
    const response = await fetch(baseUrl, { method: "HEAD" });
    const result: ValidationResult = response.ok
      ? { name: "Dev Server", status: "PASS", message: `Respondendo em ${baseUrl}` }
      : { name: "Dev Server", status: "WARN", message: `Status ${response.status} em ${baseUrl}` };
    addResult(result.name, result.status, result.message);
    logResult(result);
  } catch {
    const result: ValidationResult = {
      name: "Dev Server",
      status: "FAIL",
      message: `Nao esta rodando em ${baseUrl}`,
    };
    addResult(result.name, result.status, result.message);
    logResult(result);
  }

  console.log("\n3. Auth anonimo");
  console.log("-".repeat(60));

  if (!supabaseUrl || !anonKey) {
    const result: ValidationResult = {
      name: "Cliente anonimo",
      status: "FAIL",
      message: "Credenciais anonimas ausentes",
    };
    addResult(result.name, result.status, result.message);
    logResult(result);
  } else {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    if (loginCredential.email && loginCredential.password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginCredential.email,
        password: loginCredential.password,
      });

      const result: ValidationResult = error
        ? {
            name: "Login anonimo",
            status: "FAIL",
            message: error.message,
          }
        : {
            name: "Login anonimo",
            status: "PASS",
            message: `Sessao valida para ${data.user?.email ?? loginCredential.email}`,
          };
      addResult(result.name, result.status, result.message);
      logResult(result);

      if (data.session) {
        await supabase.auth.signOut();
      }
    }

    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${baseUrl}/reset-password?mode=recovery`,
    });

    const recoveryResult: ValidationResult = recoveryError
      ? {
          name: "Recovery anonimo",
          status: "FAIL",
          message: recoveryError.message,
        }
      : {
          name: "Recovery anonimo",
          status: "PASS",
          message: `Provider aceitou o email ${recoveryEmail}`,
        };
    addResult(recoveryResult.name, recoveryResult.status, recoveryResult.message);
    logResult(recoveryResult);
  }

  console.log("\n4. Camada administrativa");
  console.log("-".repeat(60));

  if (!supabaseUrl || !serviceRoleKey) {
    const result: ValidationResult = {
      name: "Admin checks",
      status: "WARN",
      message: "Pulados. SUPABASE_SERVICE_ROLE_KEY ausente",
    };
    addResult(result.name, result.status, result.message);
    logResult(result);
  } else {
    try {
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const { error } = await admin.from("profiles").select("id").limit(1);
      const result: ValidationResult = error
        ? {
            name: "Admin connection",
            status: "FAIL",
            message: error.message,
          }
        : {
            name: "Admin connection",
            status: "PASS",
            message: "Service role funcional",
          };
      addResult(result.name, result.status, result.message);
      logResult(result);
    } catch (error) {
      const result: ValidationResult = {
        name: "Admin connection",
        status: "FAIL",
        message: error instanceof Error ? error.message : "Falha desconhecida",
      };
      addResult(result.name, result.status, result.message);
      logResult(result);
    }
  }

  console.log("\nResumo");
  console.log("=".repeat(60));

  const passed = results.filter((result) => result.status === "PASS").length;
  const failed = results.filter((result) => result.status === "FAIL").length;
  const warnings = results.filter((result) => result.status === "WARN").length;

  console.log(`\n   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   ⚠️ Avisos: ${warnings}`);
  console.log(`   📝 Total: ${results.length}`);

  if (failed > 0) {
    console.log("\nProblemas bloqueantes detectados:");
    results
      .filter((result) => result.status === "FAIL")
      .forEach((result) => console.log(`   • ${result.name}: ${result.message}`));
    process.exit(1);
  }

  if (warnings > 0) {
    console.log("\nSetup usavel com ressalvas.");
    process.exit(0);
  }

  console.log("\nSetup pronto para E2E.");
  process.exit(0);
}

validateEnvironment().catch((error) => {
  console.error("\n❌ Erro fatal:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
