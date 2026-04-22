/**
 * OrderService — SSOT canônico de pedidos
 *
 * Centraliza toda a lógica de negócio de pedidos.
 * Hooks e componentes NÃO acessam Supabase diretamente — consomem este service.
 *
 * Responsabilidades:
 * - CRUD de pedidos
 * - Gerenciamento de status
 * - Cálculo de totais
 * - Validações de negócio
 */

import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';

// ── Tipos ─────────────────────────────────────────────────────────────────

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export type OrderType = 'pickup' | 'delivery' | 'dine_in';

export type PaymentMethod = 'cash' | 'debit_card' | 'credit_card' | 'pix' | 'online';

export interface Order {
  id: string;
  business_id: string;
  customer_id: string | null;
  delivery_area_id: string | null;
  order_number: number;
  order_type: OrderType;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  delivery_neighborhood: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_complement: string | null;
  delivery_reference: string | null;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod | null;
  payment_status: string;
  change_for: number | null;
  notes: string | null;
  internal_notes: string | null;
  estimated_preparation_time: number | null;
  estimated_delivery_time: number | null;
  scheduled_for: string | null;
  confirmed_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  item_description: string | null;
  item_image_url: string | null;
  variation_id: string | null;
  variation_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  notes: string | null;
  created_at: string;
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  addon_id: string | null;
  addon_name: string;
  addon_price: number;
  quantity: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { addons: OrderItemAddon[] })[];
  status_history: OrderStatusHistory[];
}

// ── Service ───────────────────────────────────────────────────────────────

export const OrderService = {
  
  // ══════════════════════════════════════════════════════════════════════════
  // PEDIDOS
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Lista pedidos de uma empresa
   */
  async listOrders(
    businessId: string,
    filters?: {
      status?: OrderStatus;
      order_type?: OrderType;
      date_from?: string;
      date_to?: string;
      limit?: number;
    }
  ): Promise<ServiceResult<Order[]>> {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.order_type) {
        query = query.eq('order_type', filters.order_type);
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[OrderService] listOrders error', error);
        return { data: null, error: error.message };
      }

      return { data: data as Order[], error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Busca um pedido específico com itens
   */
  async getOrder(orderId: string): Promise<ServiceResult<OrderWithItems>> {
    try {
      // Busca pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) {
        logger.error('[OrderService] getOrder error', orderError);
        return { data: null, error: orderError.message };
      }

      // Busca itens
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        logger.error('[OrderService] getOrder items error', itemsError);
        return { data: null, error: itemsError.message };
      }

      // Busca adicionais de cada item
      const itemsWithAddons = await Promise.all(
        (items || []).map(async (item) => {
          const { data: addons } = await supabase
            .from('order_item_addons')
            .select('*')
            .eq('order_item_id', item.id);

          return {
            ...item,
            addons: (addons || []) as OrderItemAddon[],
          };
        })
      );

      // Busca histórico de status
      const { data: history } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      return {
        data: {
          ...(order as Order),
          items: itemsWithAddons as (OrderItem & { addons: OrderItemAddon[] })[],
          status_history: (history || []) as OrderStatusHistory[],
        },
        error: null,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cria um novo pedido
   */
  async createOrder(input: {
    business_id: string;
    customer_id?: string;
    order_type: OrderType;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    delivery_address?: string;
    delivery_neighborhood?: string;
    delivery_city?: string;
    delivery_state?: string;
    delivery_complement?: string;
    delivery_reference?: string;
    delivery_area_id?: string;
    delivery_fee?: number;
    discount?: number;
    payment_method?: PaymentMethod;
    change_for?: number;
    notes?: string;
    estimated_preparation_time?: number;
    estimated_delivery_time?: number;
    scheduled_for?: string;
    items: Array<{
      menu_item_id: string;
      item_name: string;
      item_description?: string;
      item_image_url?: string;
      variation_id?: string;
      variation_name?: string;
      quantity: number;
      unit_price: number;
      notes?: string;
      addons?: Array<{
        addon_id: string;
        addon_name: string;
        addon_price: number;
        quantity: number;
      }>;
    }>;
  }): Promise<ServiceResult<OrderWithItems>> {
    try {
      // Busca próximo número de pedido
      const { data: nextNumber, error: numberError } = await supabase.rpc(
        'get_next_order_number',
        { p_business_id: input.business_id }
      );

      if (numberError) {
        logger.error('[OrderService] get_next_order_number error', numberError);
        return { data: null, error: numberError.message };
      }

      // Calcula subtotal dos itens
      const subtotal = input.items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unit_price;
        const addonsTotal = (item.addons || []).reduce(
          (addonSum, addon) => addonSum + addon.addon_price * addon.quantity,
          0
        );
        return sum + itemTotal + addonsTotal;
      }, 0);

      const deliveryFee = input.delivery_fee || 0;
      const discount = input.discount || 0;
      const total = subtotal + deliveryFee - discount;

      // Cria pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          business_id: input.business_id,
          customer_id: input.customer_id || null,
          order_number: nextNumber,
          order_type: input.order_type,
          customer_name: input.customer_name,
          customer_phone: input.customer_phone,
          customer_email: input.customer_email || null,
          delivery_address: input.delivery_address || null,
          delivery_neighborhood: input.delivery_neighborhood || null,
          delivery_city: input.delivery_city || null,
          delivery_state: input.delivery_state || null,
          delivery_complement: input.delivery_complement || null,
          delivery_reference: input.delivery_reference || null,
          delivery_area_id: input.delivery_area_id || null,
          subtotal,
          delivery_fee: deliveryFee,
          discount,
          total,
          payment_method: input.payment_method || null,
          change_for: input.change_for || null,
          notes: input.notes || null,
          estimated_preparation_time: input.estimated_preparation_time || null,
          estimated_delivery_time: input.estimated_delivery_time || null,
          scheduled_for: input.scheduled_for || null,
        })
        .select()
        .single();

      if (orderError) {
        logger.error('[OrderService] createOrder error', orderError);
        return { data: null, error: orderError.message };
      }

      // Cria itens
      const itemsToInsert = input.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        item_name: item.item_name,
        item_description: item.item_description || null,
        item_image_url: item.item_image_url || null,
        variation_id: item.variation_id || null,
        variation_name: item.variation_name || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
        notes: item.notes || null,
      }));

      const { data: createdItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        logger.error('[OrderService] createOrder items error', itemsError);
        return { data: null, error: itemsError.message };
      }

      // Cria adicionais
      const addonsToInsert: any[] = [];
      input.items.forEach((item, index) => {
        if (item.addons && item.addons.length > 0) {
          const orderItemId = createdItems[index].id;
          item.addons.forEach((addon) => {
            addonsToInsert.push({
              order_item_id: orderItemId,
              addon_id: addon.addon_id,
              addon_name: addon.addon_name,
              addon_price: addon.addon_price,
              quantity: addon.quantity,
            });
          });
        }
      });

      if (addonsToInsert.length > 0) {
        await supabase.from('order_item_addons').insert(addonsToInsert);
      }

      // Retorna pedido completo
      return this.getOrder(order.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza status de um pedido
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string
  ): Promise<ServiceResult<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        logger.error('[OrderService] updateOrderStatus error', error);
        return { data: null, error: error.message };
      }

      // Adiciona nota ao histórico se fornecida
      if (notes) {
        await supabase
          .from('order_status_history')
          .update({ notes })
          .eq('order_id', orderId)
          .eq('to_status', status)
          .order('created_at', { ascending: false })
          .limit(1);
      }

      return { data: data as Order, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Cancela um pedido
   */
  async cancelOrder(
    orderId: string,
    reason: string
  ): Promise<ServiceResult<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        logger.error('[OrderService] cancelOrder error', error);
        return { data: null, error: error.message };
      }

      return { data: data as Order, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  /**
   * Atualiza notas internas de um pedido
   */
  async updateInternalNotes(
    orderId: string,
    notes: string
  ): Promise<ServiceResult<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ internal_notes: notes })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        logger.error('[OrderService] updateInternalNotes error', error);
        return { data: null, error: error.message };
      }

      return { data: data as Order, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ESTATÍSTICAS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Retorna estatísticas de pedidos
   */
  async getOrderStats(
    businessId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<ServiceResult<{
    total_orders: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    total_revenue: number;
    average_order_value: number;
  }>> {
    try {
      let query = supabase
        .from('orders')
        .select('status, total')
        .eq('business_id', businessId);

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('[OrderService] getOrderStats error', error);
        return { data: null, error: error.message };
      }

      const stats = {
        total_orders: data.length,
        pending_orders: data.filter((o) => o.status === 'pending').length,
        completed_orders: data.filter((o) => o.status === 'completed').length,
        cancelled_orders: data.filter((o) => o.status === 'cancelled').length,
        total_revenue: data
          .filter((o) => o.status === 'completed')
          .reduce((sum, o) => sum + o.total, 0),
        average_order_value:
          data.length > 0
            ? data.reduce((sum, o) => sum + o.total, 0) / data.length
            : 0,
      };

      return { data: stats, error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { data: null, error: msg };
    }
  },
};

