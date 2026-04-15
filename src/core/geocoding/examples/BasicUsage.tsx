/**
 * Exemplos de uso do Core Geocoding Module
 * 
 * Demonstra:
 * 1. Busca por CEP (postal code lookup)
 * 2. Geocoding direto (address → coordinates)
 * 3. Reverse geocoding (coordinates → address)
 * 4. Normalização de endereço
 * 5. Hooks React
 */

import React, { useState } from 'react';
import {
  usePostalCodeLookup,
  useAddressGeocoding,
  useReverseGeocoding,
  useGeocoding,
  geocodingService,
} from '@/core/geocoding';

// ============================================================================
// EXEMPLO 1: Componente React com Hook de CEP
// ============================================================================

export function PostalCodeLookupExample() {
  const [cep, setCep] = useState('');
  const { lookupPostalCode, data, isLoading, error, reset } = usePostalCodeLookup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cep.trim()) return;
    
    try {
      await lookupPostalCode({ postalCode: cep });
    } catch (err) {
      // Error já é tratado pelo hook
      console.error('CEP lookup failed:', err);
    }
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
      <h3>1. Busca por CEP</h3>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          placeholder="Digite um CEP (ex: 40000-000)"
          style={{ marginRight: '0.5rem', padding: '0.5rem' }}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Buscando...' : 'Buscar'}
        </button>
        <button type="button" onClick={reset} style={{ marginLeft: '0.5rem' }}>
          Limpar
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '0.5rem' }}>
          Erro: {error.message}
        </div>
      )}

      {data && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Resultado:</h4>
          <ul>
            <li><strong>CEP:</strong> {data.postalCode}</li>
            <li><strong>Rua:</strong> {data.street}</li>
            <li><strong>Bairro:</strong> {data.neighborhood}</li>
            <li><strong>Cidade:</strong> {data.city}</li>
            <li><strong>Estado:</strong> {data.state}</li>
            {data.coordinates && (
              <li>
                <strong>Coordenadas:</strong>{' '}
                {data.coordinates.latitude.toFixed(6)}, {data.coordinates.longitude.toFixed(6)}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: Componente com Geocoding Direto
// ============================================================================

export function AddressGeocodingExample() {
  const [address, setAddress] = useState('');
  const { geocode, data, isLoading, error } = useAddressGeocoding();

  const handleSearch = async () => {
    if (!address.trim()) return;
    
    await geocode({
      query: address,
      city: 'Salvador',
      state: 'BA',
      country: 'BR',
      limit: 3,
    });
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '1rem' }}>
      <h3>2. Geocoding de Endereço</h3>
      
      <div>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Digite um endereço (ex: Avenida Sete de Setembro)"
          style={{ width: '300px', marginRight: '0.5rem', padding: '0.5rem' }}
        />
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Buscando...' : 'Geocodificar'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginTop: '0.5rem' }}>
          Erro: {error.message}
        </div>
      )}

      {data && data.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Resultados ({data.length}):</h4>
          {data.map((result, index) => (
            <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', border: '1px solid #eee' }}>
              <div><strong>Endereço:</strong> {result.formattedAddress}</div>
              <div><strong>Confiança:</strong> {(result.confidence * 100).toFixed(0)}%</div>
              <div>
                <strong>Coordenadas:</strong>{' '}
                {result.coordinates.latitude.toFixed(6)}, {result.coordinates.longitude.toFixed(6)}
              </div>
              <div><strong>Fonte:</strong> {result.source}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXEMPLO 3: Reverse Geocoding
// ============================================================================

export function ReverseGeocodingExample() {
  const [lat, setLat] = useState('-12.975');
  const [lng, setLng] = useState('-38.476');
  const { reverseGeocode, data, isLoading, error } = useReverseGeocoding();

  const handleReverseGeocode = async () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      alert('Coordenadas inválidas');
      return;
    }

    await reverseGeocode({
      latitude,
      longitude,
      detailLevel: 'full',
    });
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '1rem' }}>
      <h3>3. Reverse Geocoding</h3>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div>
          <label>Latitude:</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            style={{ width: '120px', marginLeft: '0.5rem', padding: '0.5rem' }}
          />
        </div>
        <div>
          <label>Longitude:</label>
          <input
            type="text"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            style={{ width: '120px', marginLeft: '0.5rem', padding: '0.5rem' }}
          />
        </div>
        <button onClick={handleReverseGeocode} disabled={isLoading} style={{ alignSelf: 'flex-end' }}>
          {isLoading ? 'Buscando...' : 'Reverse Geocode'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'red', marginTop: '0.5rem' }}>
          Erro: {error.message}
        </div>
      )}

      {data && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Endereço mais próximo:</h4>
          <div><strong>Endereço:</strong> {data.address.formattedAddress}</div>
          <div><strong>Tipo de local:</strong> {data.locationType}</div>
          {data.distanceMeters && (
            <div><strong>Distância:</strong> {data.distanceMeters.toFixed(0)} metros</div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXEMPLO 4: Uso Direto do Service (Node.js/SSR)
// ============================================================================

export async function demonstrateServiceUsage() {
  console.log('=== Demonstração Core Geocoding Service ===\n');
  
  // 1. Busca por CEP
  console.log('1. Buscando CEP 40000-000...');
  const cepResult = await geocodingService.lookupPostalCode({
    postalCode: '40000-000',
  });
  
  if (cepResult) {
    console.log(`   ✅ CEP encontrado: ${cepResult.street}, ${cepResult.city} - ${cepResult.state}`);
  } else {
    console.log('   ❌ CEP não encontrado');
  }
  
  // 2. Geocoding direto
  console.log('\n2. Geocoding "Avenida Sete de Setembro, Salvador"...');
  const geocodeResults = await geocodingService.geocode({
    query: 'Avenida Sete de Setembro',
    city: 'Salvador',
    state: 'BA',
    limit: 1,
  });
  
  if (geocodeResults.length > 0) {
    const result = geocodeResults[0];
    console.log(`   ✅ Geocoding OK: ${result.formattedAddress}`);
    console.log(`      Coordenadas: ${result.coordinates.latitude}, ${result.coordinates.longitude}`);
    console.log(`      Confiança: ${(result.confidence * 100).toFixed(0)}%`);
  } else {
    console.log('   ❌ Nenhum resultado encontrado');
  }
  
  // 3. Reverse geocoding
  console.log('\n3. Reverse geocoding coordenadas de Salvador...');
  const reverseResult = await geocodingService.reverseGeocode({
    latitude: -12.975,
    longitude: -38.476,
  });
  
  if (reverseResult) {
    console.log(`   ✅ Reverse geocoding OK: ${reverseResult.address.formattedAddress}`);
  } else {
    console.log('   ❌ Reverse geocoding falhou');
  }
  
  // 4. Status do serviço
  console.log('\n4. Status do serviço:');
  const status = geocodingService.getStatus();
  const metrics = geocodingService.getMetrics();
  const providers = geocodingService.getAvailableProviders();
  
  console.log(`   ✅ Disponível: ${status.success}`);
  console.log(`   ✅ Providers: ${providers.join(', ')}`);
  console.log(`   ✅ Requisições totais: ${metrics.totalRequests}`);
  console.log(`   ✅ Taxa de sucesso: ${metrics.successfulRequests}/${metrics.totalRequests}`);
  
  console.log('\n=== Demonstração concluída ===');
}

// ============================================================================
// EXEMPLO 5: Hook Completo
// ============================================================================

export function CompleteGeocodingHookExample() {
  const {
    // Estados
    geocodeState,
    reverseGeocodeState,
    postalCodeState,
    normalizeState,
    
    // Métodos
    geocode,
    reverseGeocode,
    lookupPostalCode,
    normalizeAddress,
    
    // Utilitários
    clearLocalCache,
    resetState,
    
    // Status
    isAvailable,
    availableProviders,
  } = useGeocoding({
    enableLocalCache: true,
    localCacheTtlMs: 300000, // 5 minutos
    onError: (error) => {
      console.error('Geocoding error:', error);
    },
  });

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px', marginTop: '1rem' }}>
      <h3>4. Hook Completo (useGeocoding)</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <strong>Status:</strong> {isAvailable ? '✅ Disponível' : '❌ Indisponível'}
        <br />
        <strong>Providers:</strong> {availableProviders.join(', ')}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <h4>CEP State:</h4>
          <div>Loading: {postalCodeState.isLoading ? 'Sim' : 'Não'}</div>
          <div>Error: {postalCodeState.error ? 'Sim' : 'Não'}</div>
          <div>Data: {postalCodeState.data ? 'Presente' : 'Ausente'}</div>
        </div>
        
        <div>
          <h4>Geocoding State:</h4>
          <div>Loading: {geocodeState.isLoading ? 'Sim' : 'Não'}</div>
          <div>Error: {geocodeState.error ? 'Sim' : 'Não'}</div>
          <div>Results: {geocodeState.data?.length || 0}</div>
        </div>
        
        <div>
          <h4>Reverse State:</h4>
          <div>Loading: {reverseGeocodeState.isLoading ? 'Sim' : 'Não'}</div>
          <div>Error: {reverseGeocodeState.error ? 'Sim' : 'Não'}</div>
          <div>Data: {reverseGeocodeState.data ? 'Presente' : 'Ausente'}</div>
        </div>
        
        <div>
          <h4>Normalize State:</h4>
          <div>Loading: {normalizeState.isLoading ? 'Sim' : 'Não'}</div>
          <div>Error: {normalizeState.error ? 'Sim' : 'Não'}</div>
          <div>Data: {normalizeState.data ? 'Presente' : 'Ausente'}</div>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <button onClick={() => clearLocalCache()}>
          Limpar Cache
        </button>
        <button onClick={() => resetState('geocode')}>
          Reset Geocoding
        </button>
        <button onClick={() => resetState('postalCode')}>
          Reset CEP
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function GeocodingExamples() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Core Geocoding Module - Exemplos</h1>
      <p style={{ color: '#666' }}>
        Exemplos de uso do novo SSOT de geocoding unificado.
      </p>
      
      <PostalCodeLookupExample />
      <AddressGeocodingExample />
      <ReverseGeocodingExample />
      <CompleteGeocodingHookExample />
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Para executar a demonstração do service:</h3>
        <pre style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: '4px' }}>
          {`import { demonstrateServiceUsage } from '@/core/geocoding/examples/BasicUsage';\n\ndemonstrateServiceUsage().then(() => {\n  console.log('Demonstração completa');\n});`}
        </pre>
      </div>
    </div>
  );
}