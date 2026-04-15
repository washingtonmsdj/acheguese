#!/usr/bin/env node

/**
 * Criar bucket de storage para evidências de segurança
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

console.log('🗄️  Criando bucket de storage para evidências...\n');

async function createBucket() {
  try {
    // 1. Criar bucket
    console.log('1️⃣  Criando bucket safety-evidence...');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('safety-evidence', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('   ⚠️  Bucket já existe, continuando...\n');
      } else {
        throw bucketError;
      }
    } else {
      console.log('   ✅ Bucket criado com sucesso!\n');
    }

    // 2. Verificar bucket
    console.log('2️⃣  Verificando bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) throw listError;

    const safetyBucket = buckets.find(b => b.id === 'safety-evidence');
    
    if (safetyBucket) {
      console.log('   ✅ Bucket encontrado:');
      console.log(`      - ID: ${safetyBucket.id}`);
      console.log(`      - Nome: ${safetyBucket.name}`);
      console.log(`      - Público: ${safetyBucket.public}`);
      console.log('');
    } else {
      throw new Error('Bucket não encontrado após criação');
    }

    // 3. Testar upload
    console.log('3️⃣  Testando upload...');
    const testFile = new Blob(['Test evidence file'], { type: 'image/png' });
    const testFileName = `test/${Date.now()}_test.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('safety-evidence')
      .upload(testFileName, testFile);

    if (uploadError) throw uploadError;

    console.log('   ✅ Upload de teste bem-sucedido!');
    console.log(`      - Path: ${uploadData.path}\n`);

    // 4. Obter URL pública
    console.log('4️⃣  Obtendo URL pública...');
    const { data: urlData } = supabase.storage
      .from('safety-evidence')
      .getPublicUrl(testFileName);

    console.log('   ✅ URL pública gerada:');
    console.log(`      - ${urlData.publicUrl}\n`);

    // 5. Limpar arquivo de teste
    console.log('5️⃣  Limpando arquivo de teste...');
    const { error: deleteError } = await supabase.storage
      .from('safety-evidence')
      .remove([testFileName]);

    if (deleteError) {
      console.log('   ⚠️  Erro ao deletar arquivo de teste (não crítico)');
    } else {
      console.log('   ✅ Arquivo de teste removido\n');
    }

    console.log('═'.repeat(80));
    console.log('✅ BUCKET DE STORAGE CONFIGURADO COM SUCESSO!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('   1. Testar upload de evidência real via UI');
    console.log('   2. Validar compartilhamento de viagem');
    console.log('   3. Verificar auditoria de operações\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.log('\n⚠️  Se o erro persistir, execute manualmente no Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/storage/buckets\n');
    process.exit(1);
  }
}

createBucket();
