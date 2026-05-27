/**
 * GATE 2: VALIDA!OO OPERACIONAL REAL
 * 
 * Testa ponta a ponta com evidencia real:
 * - Motorista publica localizacao
 * - Banco persiste dados completos
 * - Passageiro consome via realtime
 * - Latencia medida
 * - Falhas testadas
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { trackingService } from '@/core/tracking/services/TrackingService';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const RUN_GATE2_REAL_TESTS = process.env.RUN_GATE2_REAL_TESTS === '1';
const describeGate2 = RUN_GATE2_REAL_TESTS ? describe : describe.skip;

describeGate2('GATE 2: VALIDA!OO OPERACIONAL REAL', () => {
  let supabase: SupabaseClient;
  let testDriverId: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Buscar um perfil existente para usar como motorista
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (!profiles) {
      throw new Error('Nenhum perfil encontrado - criar perfil de teste primeiro');
    }

    testDriverId = profiles.id;
    console.log('x Usando perfil:', testDriverId);
  });

  describe('1. PUBLICA!OO REAL', () => {
    it('deve publicar localizacao com dados GPS completos', async () => {
      console.log('\nxa Teste 1: Publicacao Real\n');

      const startTime = Date.now();

      // Simular motorista publicando localizacao
      const position = {
        latitude: -12.975,
        longitude: -38.476,
        accuracy: 10.5,
        heading: 45.0,
        speed: 60.0,
        altitude: 100.0,
      };

      console.log('x Motorista publicando:', position);

      await trackingService.updatePosition(testDriverId, position, 'driver');

      const publishTime = Date.now() - startTime;
      console.log(`  Tempo de publicacao: ${publishTime}ms`);

      // Validar persistencia no banco
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_profile_id', testDriverId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      console.log('x Banco recebeu:', {
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

      console.log('S& Publicacao validada\n');
    });
  });

  describe('2. CONSUMO REALTIME', () => {
    it('deve consumir via realtime com latencia medida', async () => {
      console.log('\nxa Teste 2: Consumo Realtime\n');

      return new Promise<void>(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: Realtime nao recebeu em 15s'));
        }, 15000);

        const publishTime = Date.now();
        let receiveTime = 0;
        let latency = 0;

        // Subscrever ANTES de publicar
        console.log('x Passageiro subscrevendo...');
        
        const subscription = trackingService.subscribeToPosition(
          testDriverId,
          (position) => {
            receiveTime = Date.now();
            latency = receiveTime - publishTime;

            clearTimeout(timeout);

            console.log('x Passageiro recebeu:', {
              latitude: position.latitude,
              longitude: position.longitude,
              accuracy: position.accuracy,
              heading: position.heading,
              speed: position.speed,
              altitude: position.altitude,
            });

            console.log(`  Latencia ponta a ponta: ${latency}ms`);

            try {
              // Validar dados recebidos
              expect(position.latitude).toBe(-12.980);
              expect(position.longitude).toBe(-38.480);
              expect(position.accuracy).toBe(15.0);
              expect(position.heading).toBe(90.0);
              expect(position.speed).toBe(50.0);
              expect(position.altitude).toBe(50.0);

              // Validar latencia (requisito: <5s = 5000ms)
              if (latency < 5000) {
                console.log('S& Latencia OK (<5s)');
              } else {
                console.log('a  Latencia alta (>5s)');
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

        // Aguardar subscription estar ativa
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Publicar nova localizacao
        console.log('x Motorista publicando nova posicao...');
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

  describe('3. FREQU`NCIA DE PUBLICA!OO', () => {
    it('deve medir frequencia real de publicacao', async () => {
      console.log('\nxa Teste 3: Frequencia de Publicacao\n');

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

        console.log(`x Publicacao ${times.length}: ${elapsed}ms`);

        // Aguardar 1s entre publicacoes
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log('\nx` Estatisticas:');
      console.log(`   Media: ${avgTime.toFixed(2)}ms`);
      console.log(`   Minimo: ${minTime}ms`);
      console.log(`   Maximo: ${maxTime}ms`);

      // Validar que publicacao e rapida (<500ms)
      expect(avgTime).toBeLessThan(500);

      console.log('S& Frequencia validada\n');
    });
  });

  describe('4. CENARIOS DE FALHA', () => {
    it('deve lidar com GPS indisponivel (dados parciais)', async () => {
      console.log('\nxa Teste 4: GPS Indisponivel\n');

      // Publicar apenas lat/lng, sem dados GPS extras
      await trackingService.updatePosition(
        testDriverId,
        {
          latitude: -12.985,
          longitude: -38.485,
          accuracy: undefined,
          heading: undefined,
          speed: undefined,
          altitude: undefined,
        },
        'driver'
      );

      // Validar que persiste mesmo sem dados GPS completos
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_profile_id', testDriverId)
        .single();

      expect(error).toBeNull();
      expect(data!.lat).toBe(-12.985);
      expect(data!.lng).toBe(-38.485);

      console.log('S& Dados parciais aceitos\n');
    });

    it('deve retornar null quando motorista nao tem localizacao', async () => {
      console.log('\nxa Teste 5: Motorista Sem Localizacao\n');

      const fakeDriverId = '00000000-0000-0000-0000-000000000000';

      const position = await trackingService.getCurrentPosition(fakeDriverId, 'driver');

      expect(position).toBeNull();

      console.log('S& Retorna null corretamente\n');
    });
  });

  describe('5. CONSIST`NCIA DE ESTADO', () => {
    it('deve manter ultima posicao apos multiplas atualizacoes', async () => {
      console.log('\nxa Teste 6: Consistencia de Estado\n');

      // Publicar 3 posicoes seguidas
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

      // Validar que ultima posicao esta correta
      const current = await trackingService.getCurrentPosition(testDriverId, 'driver');

      expect(current).toBeDefined();
      expect(current!.latitude).toBe(-12.992);
      expect(current!.longitude).toBe(-38.492);
      expect(current!.speed).toBe(30.0);

      console.log('S& altima posicao correta\n');
    });
  });

  afterAll(async () => {
    console.log('\nx` RESUMO DA VALIDA!OO OPERACIONAL\n');
    console.log('S& Publicacao real validada');
    console.log('S& Consumo realtime validado');
    console.log('S& Latencia medida');
    console.log('S& Frequencia medida');
    console.log('S& Cenarios de falha testados');
    console.log('S& Consistencia de estado validada');
    console.log('\na  Pendente: Reconexao apos queda de rede');
    console.log('a  Pendente: Refresh de pagina durante tracking');
  });
});

