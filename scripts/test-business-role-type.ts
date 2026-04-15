#!/usr/bin/env tsx
/**
 * Teste para verificar o tipo do campo business_role
 */

// Simulando a estrutura do objeto business
interface Business {
  id: string;
  profile_id: string;
  business_name: string;
  business_role: string; // Este é o campo que precisamos verificar
  parent_business_id: string | null;
  location_id: string | null;
}

// Testando se o campo business_role tem os valores esperados
const testBusiness: Business = {
  id: 'test-id',
  profile_id: 'test-profile-id',
  business_name: 'Test Business',
  business_role: 'standalone', // Valor do seed
  parent_business_id: null,
  location_id: 'test-location-id'
};

console.log('🔍 Teste de tipo do campo business_role:');
console.log(`- Valor: ${testBusiness.business_role}`);
console.log(`- Tipo: ${typeof testBusiness.business_role}`);

// Verificando se o valor é um dos esperados
const validRoles = ['standalone', 'brand_hub', 'branch'] as const;
type BusinessRole = typeof validRoles[number];

// Função para verificar se o valor é válido
function isValidBusinessRole(value: string): value is BusinessRole {
  return validRoles.includes(value as BusinessRole);
}

if (isValidBusinessRole(testBusiness.business_role)) {
  console.log(`✅ business_role é válido: ${testBusiness.business_role}`);
} else {
  console.log(`❌ business_role inválido: ${testBusiness.business_role}`);
  console.log(`   Valores esperados: ${validRoles.join(', ')}`);
}

// Testando a conversão para o tipo esperado pelo NetworkTab
const businessRole: BusinessRole = testBusiness.business_role as BusinessRole;
console.log(`\n✅ Conversão para BusinessRole: ${businessRole}`);