/**
 * GATE 2: VALIDAÇÃO OPERACIONAL COM AUTENTICAÇÃO
 * 
 * Usa credenciais E2E para autenticar e validar operacionalmente
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TrackingService } from '@/core/tracking/services/TrackingService';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;

if (!E2E_USER_EMAIL || !E2E_USER_PASSWORD) {
  throw new Error(
    '[GATE 2] E2E_USER_EMAIL e E2E_USER_PASSWORD são obrigatórios. ' +
    'Configure em .env.local ou .env.test (não commitado).',
  );
}

describe('GATE 2: VALIDAÇÃO OPERACIONAL AUTENTICADA', () => {
  let supabase: SupabaseClient;
  let trackingService: TrackingService;
  let testDriverId: string;
  let userId: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('\n🔐 Autenticando usuário E2E...');
    
    // Autenticar com usuário E2E
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: E2E_USER_EMAIL,
      password: E2E_USER_PASSWORD,
    });

    if (authError) {
      console.error('❌ Erro ao autenticar:', authError.message);
      throw new Error(`Falha na autenticação: ${authError.message}`);
    }

    userId = authData.user!.id;
    trackingService = new TrackingService(supabase);
    console.log('✅ Autenticado como:', E2E_USER_EMAIL);
    console.log('📍 User ID:', userId);

    // Buscar ou criar perfil do motorista
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profile) {
      testDriverId = profile.id;
      console.log('✅ Perfil encontrado:', testDriverId);
    } else {
      // Criar perfil se não existir
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: `e2e_driver_${Date.now()}`,
          full_name: 'E2E Test Driver',
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      testDriverId = newProfile!.id;
      console.log('✅ Perfil criado:', testDriverId);
    }

    console.log('');
  });

  describe('1. PUBLICAÇÃO REAL AUTENTICADA', () => {
    it('deve publicar localização com dados GPS completos', async () => {
      console.log('\n🚀 Teste 1: Publicação Real Autenticada\n');

      const startTime = Date.now();

      const position = {
        latitude: -12.975,
        longitude: -38.476,
        accuracy: 10.5,
        heading: 45.0,
        speed: 60.0,
        altitude: 100.0,
      };

      console.log('📤 Motorista publicando:', position);

      await trackingService.updatePosition(testDriverId, position, 'driver');

      const publishTime = Date.now() - startTime;
      console.log(`⏱️  Tempo de publicação: ${publishTime}ms`);

      // Validar persistência
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_profile_id', testDriverId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      console.log('📥 Banco recebeu:', {
        lat: data!.lat,
        lng: data!.lng,
        accuracy: data!.accuracy,
        heading: data!.heading,
        speed: data!.speed,
        altitude: data!.altitude,
      });

      // Validar dados completos
      expect(data!.lat).toBe(position.latitude);
      expect(data!.lng).toBe(position.longitude);
      expect(data!.accuracy).toBe(position.accuracy);
      expect(data!.heading).toBe(position.heading);
      expect(data!.speed).toBe(position.speed);
      expect(data!.altitude).toBe(position.altitude);

      console.log('✅ Publicação validada\n');
    });
  });

  describe('2. CONSUMO REALTIME AUTENTICADO', () => {
    it('deve consumir via realtime com latência medida', async () => {
      console.log('\n🚀 Teste 2: Consumo Realtime Autenticado\n');

      return new Promise<void>(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: Realtime não recebeu em 15s'));
        }, 15000);

        const publishTime = Date.now();
        let receiveTime = 0;
        let latency = 0;

        console.log('👂 Passageiro subscrevendo...');
        
        const subscription = trackingService.subscribeToPosition(
          testDriverId,
          (position) => {
            receiveTime = Date.now();
            latency = receiveTime - publishTime;

            clearTimeout(timeout);

            console.log('📥 Passageiro recebeu:', {
              latitude: position.latitude,
              longitude: position.longitude,
              accuracy: position.accuracy,
              heading: position.heading,
              speed: position.speed,
              altitude: position.altitude,
            });

            console.log(`⏱️  Latência ponta a ponta: ${latency}ms`);

            try {
              expect(position.latitude).toBe(-12.980);
              expect(position.longitude).toBe(-38.480);
              expect(position.accuracy).toBe(15.0);
              expect(position.heading).toBe(90.0);
              expect(position.speed).toBe(50.0);
              expect(position.altitude).toBe(50.0);

              if (latency < 5000) {
                console.log('✅ Latência OK (<5s)');
              } else {
                console.log('⚠️  Latência alta (>5s)');
              }

              subscription.unsubscribe();
              resolve();
            } catch (error) {
              subscription.unsubscribe();
              reject(error);
            }
          },
          'driver'
        );

        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('📤 Motorista publicando nova posição...');
        await trackingService.updatePosition(
          testDriverId,
          {
            latitude: -12.980,
            longitude: -38.480,
            accuracy: 15.0,
            heading: 90.0,
            speed: 50.0,
            altitude: 50.0,
          },
          'driver'
        );
      });
    }, 20000);
  });

  describe('3. FREQUÊNCIA DE PUBLICAÇÃO', () => {
    it('deve medir frequência real de publicação', async () => {
      console.log('\n🚀 Teste 3: Frequência de Publicação\n');

      const positions = [
        { lat: -12.975, lng: -38.476, speed: 60.0 },
        { lat: -12.976, lng: -38.477, speed: 55.0 },
        { lat: -12.977, lng: -38.478, speed: 50.0 },
      ];

      const times: number[] = [];

      for (const pos of positions) {
        const start = Date.now();
        
        await trackingService.updatePosition(
          testDriverId,
          {
            latitude: pos.lat,
            longitude: pos.lng,
            accuracy: 10.0,
            heading: 45.0,
            speed: pos.speed,
            altitude: 100.0,
          },
          'driver'
        );

        const elapsed = Date.now() - start;
        times.push(elapsed);

        console.log(`📤 Publicação ${times.length}: ${elapsed}ms`);

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log('\n📊 Estatísticas:');
      console.log(`   Média: ${avgTime.toFixed(2)}ms`);
      console.log(`   Mínimo: ${minTime}ms`);
      console.log(`   Máximo: ${maxTime}ms`);

      expect(avgTime).toBeLessThan(500);

      console.log('✅ Frequência validada\n');
    });
  });

  describe('4. CONSISTÊNCIA DE ESTADO', () => {
    it('deve manter última posição após múltiplas atualizações', async () => {
      console.log('\n🚀 Teste 4: Consistência de Estado\n');

      const positions = [
        { lat: -12.990, lng: -38.490, speed: 40.0 },
        { lat: -12.991, lng: -38.491, speed: 35.0 },
        { lat: -12.992, lng: -38.492, speed: 30.0 },
      ];

      for (const pos of positions) {
        await trackingService.updatePosition(
          testDriverId,
          {
            latitude: pos.lat,
            longitude: pos.lng,
            accuracy: 10.0,
            heading: 45.0,
            speed: pos.speed,
            altitude: 100.0,
          },
          'driver'
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const current = await trackingService.getCurrentPosition(testDriverId, 'driver');

      expect(current).toBeDefined();
      expect(current!.latitude).toBe(-12.992);
      expect(current!.longitude).toBe(-38.492);
      expect(current!.speed).toBe(30.0);

      console.log('✅ Última posição correta\n');
    });
  });

  afterAll(async () => {
    console.log('\n📊 RESUMO DA VALIDAÇÃO OPERACIONAL AUTENTICADA\n');
    console.log('✅ Publicação real validada');
    console.log('✅ Consumo realtime validado');
    console.log('✅ Latência medida');
    console.log('✅ Frequência medida');
    console.log('✅ Consistência de estado validada');
    console.log('\n⚠️  Pendente: Reconexão após queda de rede');
    console.log('⚠️  Pendente: Refresh de página durante tracking');

    // Logout
    await supabase.auth.signOut();
  });
});
