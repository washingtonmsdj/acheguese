/**
 * GATE 2: Teste E2E do Pipeline de Publicação de Localização
 * 
 * Valida ponta a ponta:
 * - Motorista publica localização
 * - Banco persiste dados completos
 * - Passageiro consome via realtime
 * - Latência aceitável
 * - Comportamento em falhas
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { type SupabaseClient } from '@supabase/supabase-js';
import { TrackingService } from '@/core/tracking/services/TrackingService';
import {
  createOperationalAnonClient,
  describeOperational,
  requireOperationalEnv,
} from '../helpers/operational-env';


describeOperational('GATE 2: Pipeline de Publicação de Localização', {
  requireDriverCredentials: true,
}, () => {
  let supabase: SupabaseClient;
  let trackingService: TrackingService;
  let testDriverId: string;
  let testPassengerId: string;

  beforeAll(async () => {
    const env = requireOperationalEnv({ requireDriverCredentials: true });
    supabase = createOperationalAnonClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: env.driverEmail,
      password: env.driverPassword,
    });
    if (authError || !authData.user) {
      throw new Error(`Falha na autenticação E2E: ${authError?.message ?? 'sem usuário'}`);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (profileError || !profile?.id) {
      throw new Error(`Profile E2E não encontrado: ${profileError?.message ?? 'sem profile'}`);
    }

    testDriverId = profile.id;
    testPassengerId = profile.id;
    trackingService = new TrackingService(supabase);
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testDriverId) {
      await supabase.from('driver_locations').delete().eq('driver_profile_id', testDriverId);
    }
    await supabase.auth.signOut();
  });

  describe('1. PERSISTÊNCIA DE DADOS COMPLETOS', () => {
    it('deve persistir localização com todos os campos GPS', async () => {
      // Arrange
      const position = {
        latitude: -12.975,
        longitude: -38.476,
        accuracy: 10.5,
        heading: 45.0,
        speed: 60.0,
        altitude: 100.0,
      };

      // Act
      await trackingService.updatePosition(testDriverId, position, 'driver');

      // Assert - Buscar diretamente do banco
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_profile_id', testDriverId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.lat).toBe(position.latitude);
      expect(data!.lng).toBe(position.longitude);
      expect(data!.accuracy).toBe(position.accuracy);
      expect(data!.heading).toBe(position.heading);
      expect(data!.speed).toBe(position.speed);
      expect(data!.altitude).toBe(position.altitude);
    });

    it('deve converter latitude/longitude para lat/lng no banco', async () => {
      // Arrange
      const position = {
        latitude: -12.980,
        longitude: -38.480,
        accuracy: 15.0,
        heading: 90.0,
        speed: 50.0,
        altitude: 50.0,
      };

      // Act
      await trackingService.updatePosition(testDriverId, position, 'driver');

      // Assert - Verificar que banco tem lat/lng
      const { data } = await supabase
        .from('driver_locations')
        .select('lat, lng')
        .eq('driver_profile_id', testDriverId)
        .single();

      expect(data!.lat).toBe(position.latitude);
      expect(data!.lng).toBe(position.longitude);
    });
  });

  describe('2. LEITURA COM MAPEAMENTO CORRETO', () => {
    it('deve ler localização e converter lat/lng para latitude/longitude', async () => {
      // Arrange - Inserir diretamente no banco
      await supabase
        .from('driver_locations')
        .upsert({
          driver_profile_id: testDriverId,
          lat: -12.985,
          lng: -38.485,
          accuracy: 20.0,
          heading: 180.0,
          speed: 40.0,
          altitude: 75.0,
        }, { onConflict: 'driver_profile_id' });

      // Act
      const position = await trackingService.getCurrentPosition(testDriverId, 'driver');

      // Assert
      expect(position).toBeDefined();
      expect(position!.latitude).toBe(-12.985);
      expect(position!.longitude).toBe(-38.485);
      expect(position!.accuracy).toBe(20.0);
      expect(position!.heading).toBe(180.0);
      expect(position!.speed).toBe(40.0);
      expect(position!.altitude).toBe(75.0);
    });
  });

  describe('3. REALTIME PONTA A PONTA', () => {
    it('deve receber atualização via realtime com mapeamento correto', async () => {
      return new Promise<void>(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: Realtime não recebeu atualização em 10s'));
        }, 10000);

        // Arrange - Subscrever antes de publicar
        const startTime = Date.now();
        const subscription = trackingService.subscribeToPosition(
          testDriverId,
          (position) => {
            const latency = Date.now() - startTime;
            
            clearTimeout(timeout);
            
            try {
              // Assert
              expect(position.latitude).toBe(-12.990);
              expect(position.longitude).toBe(-38.490);
              expect(position.accuracy).toBe(25.0);
              expect(position.heading).toBe(270.0);
              expect(position.speed).toBe(30.0);
              expect(position.altitude).toBe(90.0);
              
              console.log(`✅ Latência do realtime: ${latency}ms`);
              
              subscription.unsubscribe();
              resolve();
            } catch (error) {
              subscription.unsubscribe();
              reject(error);
            }
          },
          'driver'
        );

        // Act - Aguardar subscription estar ativa
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Publicar localização
        await trackingService.updatePosition(
          testDriverId,
          {
            latitude: -12.990,
            longitude: -38.490,
            accuracy: 25.0,
            heading: 270.0,
            speed: 30.0,
            altitude: 90.0,
          },
          'driver'
        );
      });
    }, 15000); // Timeout de 15s para o teste

    it('deve medir latência do pipeline completo', async () => {
      return new Promise<void>(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: Latência excedeu 10s'));
        }, 10000);

        const startTime = Date.now();

        const subscription = trackingService.subscribeToPosition(
          testDriverId,
          (position) => {
            const latency = Date.now() - startTime;
            
            clearTimeout(timeout);
            subscription.unsubscribe();
            
            console.log(`📊 Latência medida: ${latency}ms`);
            
            // Assert - Latência deve ser < 5s (requisito do Gate 2)
            expect(latency).toBeLessThan(5000);
            
            resolve();
          },
          'driver'
        );

        await new Promise(resolve => setTimeout(resolve, 1000));

        await trackingService.updatePosition(
          testDriverId,
          {
            latitude: -12.995,
            longitude: -38.495,
            accuracy: 30.0,
            heading: 0.0,
            speed: 20.0,
            altitude: 110.0,
          },
          'driver'
        );
      });
    }, 15000);
  });

  describe('4. COMPORTAMENTO EM FALHAS', () => {
    it('deve retornar null quando motorista não tem localização', async () => {
      // Arrange - ID inexistente
      const fakeDriverId = '00000000-0000-0000-0000-000000000000';

      // Act
      const position = await trackingService.getCurrentPosition(fakeDriverId, 'driver');

      // Assert
      expect(position).toBeNull();
    });

    it('deve lidar com dados GPS parciais', async () => {
      // Arrange - Apenas lat/lng, sem dados GPS extras
      await supabase
        .from('driver_locations')
        .upsert({
          driver_profile_id: testDriverId,
          lat: -13.000,
          lng: -38.500,
          accuracy: null,
          heading: null,
          speed: null,
          altitude: null,
        }, { onConflict: 'driver_profile_id' });

      // Act
      const position = await trackingService.getCurrentPosition(testDriverId, 'driver');

      // Assert
      expect(position).toBeDefined();
      expect(position!.latitude).toBe(-13.000);
      expect(position!.longitude).toBe(-38.500);
      expect(position!.accuracy).toBe(0); // Default
      expect(position!.heading).toBeNull();
      expect(position!.speed).toBeNull();
      expect(position!.altitude).toBeNull();
    });
  });

  describe('5. MÉTODO getHistory() DESABILITADO', () => {
    it('deve retornar array vazio (histórico não implementado)', async () => {
      // Act
      const history = await trackingService.getHistory(testDriverId, 'driver');

      // Assert
      expect(history).toEqual([]);
    });
  });
});
