#!/usr/bin/env tsx
/**
 * Script para corrigir identificadores ambíguos
 * Substitui identificadores como author_id por author_profile_id
 */

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

// Mapeamento de identificadores proibidos para qualificados
const replacements: Record<string, string> = {
  // Snake case
  'author_id': 'author_profile_id',
  'owner_id': 'owner_profile_id',
  'creator_id': 'creator_profile_id',
  'driver_id': 'driver_profile_id',
  'sender_id': 'sender_profile_id',
  'recipient_id': 'recipient_profile_id',
  'moderator_id': 'moderator_profile_id',
  'reviewer_id': 'reviewer_profile_id',
  
  // Camel case
  'authorId': 'authorProfileId',
  'ownerId': 'ownerProfileId',
  'creatorId': 'creatorProfileId',
  'driverId': 'driverProfileId',
  'senderId': 'senderProfileId',
  'recipientId': 'recipientProfileId',
  'moderatorId': 'moderatorProfileId',
  'reviewerId': 'reviewerProfileId',
};

// Arquivos a processar
const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  '!src/**/*.test.ts',
  '!src/**/*.test.tsx',
  '!node_modules/**',
];

function fixFile(filePath: string): { changed: boolean; count: number } {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;
  let count = 0;
  
  // Aplicar cada substituição
  for (const [oldId, newId] of Object.entries(replacements)) {
    // Usar regex com word boundaries para evitar substituições parciais
    const regex = new RegExp(`\\b${oldId}\\b`, 'g');
    const matches = content.match(regex);
    
    if (matches) {
      content = content.replace(regex, newId);
      changed = true;
      count += matches.length;
    }
  }
  
  if (changed) {
    writeFileSync(filePath, content, 'utf-8');
  }
  
  return { changed, count };
}

function main() {
  console.log('🔍 Buscando arquivos com identificadores ambíguos...\n');
  
  const files = globSync(patterns);
  let totalFiles = 0;
  let totalReplacements = 0;
  
  for (const file of files) {
    const { changed, count } = fixFile(file);
    
    if (changed) {
      totalFiles++;
      totalReplacements += count;
      console.log(`✅ ${file}: ${count} substituições`);
    }
  }
  
  console.log(`\n📊 Resumo:`);
  console.log(`   Arquivos modificados: ${totalFiles}`);
  console.log(`   Total de substituições: ${totalReplacements}`);
  console.log(`\n✅ Correção concluída!`);
}

main();
