/**
 * AdRepositoryMock - Implementação mock para desenvolvimento
 *
 * Dados seed baseados na hierarquia do LocationRepositoryMock:
 * loc-salvador (city) → loc-pituba, loc-barra, loc-rio-vermelho, loc-itaigara, loc-amaralina (districts)
 */

import type { IAdRepository } from './IAdRepository';
import type { AdCampaignWithTargets, AdPlacementKey } from '../types';

export class AdRepositoryMock implements IAdRepository {
  private campaigns: AdCampaignWithTargets[] = [
    // Campanha segmentada para Pituba (district)
    {
      id: 'ad-pituba-001',
      owner_entity_type: 'business',
      owner_entity_id: 'biz-001',
      title: 'Pizzaria Bella Napoli',
      content: 'Pizza família por R$ 39,90! Delivery grátis na Pituba.',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      cta_text: 'Pedir Agora',
      cta_url: 'https://wa.me/5571999999999',
      status: 'active',
      placement_key: 'feed_sponsored',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      targets: [
        { campaign_id: 'ad-pituba-001', location_id: 'loc-pituba', target_scope: 'district' },
      ],
    },
    // Campanha segmentada para Barra (district)
    {
      id: 'ad-barra-001',
      owner_entity_type: 'business',
      owner_entity_id: 'biz-002',
      title: 'Academia FitLife Barra',
      content: 'Primeira semana grátis! Equipamentos modernos.',
      image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
      cta_text: 'Agendar Visita',
      cta_url: 'https://wa.me/5571988888888',
      status: 'active',
      placement_key: 'feed_sponsored',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      targets: [
        { campaign_id: 'ad-barra-001', location_id: 'loc-barra', target_scope: 'district' },
      ],
    },
    // Campanha segmentada para Salvador inteiro (city)
    {
      id: 'ad-salvador-001',
      owner_entity_type: 'business',
      owner_entity_id: 'biz-003',
      title: 'Supermercado Bahia',
      content: 'Ofertas da semana em toda Salvador!',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      cta_text: 'Ver Ofertas',
      cta_url: '/ofertas',
      status: 'active',
      placement_key: 'feed_sponsored',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      targets: [
        { campaign_id: 'ad-salvador-001', location_id: 'loc-salvador', target_scope: 'city' },
      ],
    },
    // Campanha com múltiplos bairros (Pituba + Rio Vermelho)
    {
      id: 'ad-multi-001',
      owner_entity_type: 'service_provider',
      owner_entity_id: 'svc-001',
      title: 'Encanador 24h',
      content: 'Atendimento emergencial na Pituba e Rio Vermelho.',
      status: 'active',
      placement_key: 'sidebar_widget',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      targets: [
        { campaign_id: 'ad-multi-001', location_id: 'loc-pituba', target_scope: 'district' },
        { campaign_id: 'ad-multi-001', location_id: 'loc-rio-vermelho', target_scope: 'district' },
      ],
    },
    // Campanha de classified segmentada para Pituba (feed_sponsored)
    {
      id: 'ad-classified-pituba-001',
      owner_entity_type: 'classified',
      owner_entity_id: 'cls-001',
      title: 'Sofá 3 lugares — R$ 350',
      content: 'Sofá usado em ótimo estado, retirar na Pituba. Aceito PIX.',
      cta_text: 'Ver anúncio',
      cta_url: '/classificados/sofa-3-lugares',
      status: 'active',
      placement_key: 'feed_sponsored',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      targets: [
        { campaign_id: 'ad-classified-pituba-001', location_id: 'loc-pituba', target_scope: 'district' },
      ],
    },
    // Campanha genérica da plataforma (sem target = fallback global)
    {
      id: 'ad-generic-001',      owner_entity_type: 'platform',
      owner_entity_id: 'platform',
      title: 'Anuncie aqui',
      content: 'Alcance moradores da sua região. Crie seu anúncio agora.',
      cta_text: 'Anunciar',
      cta_url: '/anunciar',
      status: 'active',
      placement_key: 'sidebar_widget',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      targets: [], // sem target = genérico
    },
    // Campanha genérica para feed
    {
      id: 'ad-generic-feed-001',
      owner_entity_type: 'platform',
      owner_entity_id: 'platform',
      title: 'Desconto Especial!',
      content: 'Ganhe 20% de desconto na primeira compra.',
      image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400',
      cta_text: 'Ver Oferta',
      cta_url: '/promocoes',
      status: 'active',
      placement_key: 'feed_sponsored',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      targets: [],
    },
  ];

  async findActiveCampaignsByLocationIds(
    placement_key: AdPlacementKey,
    location_ids: string[]
  ): Promise<AdCampaignWithTargets[]> {
    return this.campaigns.filter(
      (c) =>
        c.status === 'active' &&
        c.placement_key === placement_key &&
        c.targets.length > 0 &&
        c.targets.some((t) => location_ids.includes(t.location_id))
    );
  }

  async findGenericCampaigns(placement_key: AdPlacementKey): Promise<AdCampaignWithTargets[]> {
    return this.campaigns.filter(
      (c) =>
        c.status === 'active' &&
        c.placement_key === placement_key &&
        c.targets.length === 0
    );
  }

  async findById(id: string): Promise<AdCampaignWithTargets | null> {
    return this.campaigns.find((c) => c.id === id) || null;
  }
}
