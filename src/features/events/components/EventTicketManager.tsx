/**
 * 🎫 EVENT TICKET MANAGER
 * 
 * Componente para gerenciar tipos de ingressos
 * Adicionar, editar e remover ingressos
 * 
 * @version 1.0.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { useConfirmActionDialog } from '@/shared/hooks/useConfirmActionDialog';
import { useToast } from '@/shared/hooks/use-toast';
import { formatBrl } from '@/shared/utils/currency';

interface Ticket {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  sale_start_date?: string;
  sale_end_date?: string;
}

interface EventTicketManagerProps {
  tickets: Ticket[];
  onChange: (tickets: Ticket[]) => void;
  className?: string;
}

export function EventTicketManager({
  tickets,
  onChange,
  className,
}: EventTicketManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState<Partial<Ticket>>({
    name: '',
    description: '',
    price: 0,
    quantity_available: 0,
    sale_start_date: '',
    sale_end_date: '',
  });
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { toast } = useToast();

  // Handle add ticket
  const handleAddTicket = () => {
    setEditingTicket(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      quantity_available: 0,
      sale_start_date: '',
      sale_end_date: '',
    });
    setIsDialogOpen(true);
  };

  // Handle edit ticket
  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData(ticket);
    setIsDialogOpen(true);
  };

  // Handle save ticket
  const handleSaveTicket = () => {
    const price = formData.price ?? 0;
    const quantity = formData.quantity_available ?? 0;

    if (!formData.name?.trim() || price < 0 || quantity <= 0) {
      toast({
        title: 'Revise o ingresso',
        description: 'Informe nome, preco valido e quantidade maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    if (editingTicket) {
      // Update existing ticket
      const updatedTickets = tickets.map(t =>
        t.id === editingTicket.id
          ? { ...t, ...formData, name: formData.name!.trim(), price, quantity_available: quantity }
          : t
      );
      onChange(updatedTickets);
    } else {
      // Add new ticket
      const newTicket: Ticket = {
        id: `ticket-${Date.now()}`,
        name: formData.name!.trim(),
        description: formData.description || '',
        price,
        quantity_available: quantity,
        quantity_sold: 0,
        sale_start_date: formData.sale_start_date,
        sale_end_date: formData.sale_end_date,
      };
      onChange([...tickets, newTicket]);
    }

    setIsDialogOpen(false);
  };

  // Handle delete ticket
  const handleDeleteTicket = async (ticketId: string) => {
    const confirmed = await confirm({
      title: 'Excluir ingresso?',
      description: 'Este tipo de ingresso sera removido da configuracao do evento.',
      confirmLabel: 'Excluir ingresso',
      variant: 'destructive',
    });

    if (confirmed) {
      onChange(tickets.filter(t => t.id !== ticketId));
    }
  };

  // Calculate totals
  const totals = {
    revenue: tickets.reduce((sum, t) => sum + (t.quantity_sold * t.price), 0),
    sold: tickets.reduce((sum, t) => sum + t.quantity_sold, 0),
    available: tickets.reduce((sum, t) => sum + t.quantity_available, 0),
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Tipos de Ingressos
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure os diferentes tipos de ingressos disponíveis
          </p>
        </div>
        <Button onClick={handleAddTicket} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Ingresso
        </Button>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <DollarSign className="mb-3 h-12 w-12 text-muted-foreground" />
          <h4 className="mb-1 text-sm font-semibold text-foreground">
            Nenhum ingresso configurado
          </h4>
          <p className="mb-4 text-xs text-muted-foreground">
            Adicione tipos de ingressos para começar a vender
          </p>
          <Button onClick={handleAddTicket} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Primeiro Ingresso
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tickets.map((ticket, index) => {
              const soldPercentage = (ticket.quantity_sold / ticket.quantity_available) * 100;
              const isAlmostSoldOut = soldPercentage >= 80;
              const isSoldOut = ticket.quantity_sold >= ticket.quantity_available;

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="group rounded-lg border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">
                          {ticket.name}
                        </h4>
                        {isSoldOut && (
                          <Badge variant="destructive">Esgotado</Badge>
                        )}
                        {isAlmostSoldOut && !isSoldOut && (
                          <Badge variant="outline" className="border-amber-500 text-amber-600">
                            Últimas unidades
                          </Badge>
                        )}
                      </div>

                      {ticket.description && (
                        <p className="mb-3 text-sm text-muted-foreground">
                          {ticket.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">
                            {formatBrl(ticket.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {ticket.quantity_sold}/{ticket.quantity_available} vendidos
                          </span>
                        </div>
                        {ticket.sale_end_date && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Até {new Date(ticket.sale_end_date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${soldPercentage}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={cn(
                              "h-full",
                              isSoldOut ? "bg-red-500" :
                              isAlmostSoldOut ? "bg-amber-500" :
                              "bg-green-500"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTicket(ticket)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTicket(ticket.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Summary */}
      {tickets.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            Resumo de Vendas
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Receita Total</p>
              <p className="text-lg font-bold text-green-600">
                {formatBrl(totals.revenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ingressos Vendidos</p>
              <p className="text-lg font-bold text-foreground">
                {totals.sold}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disponíveis</p>
              <p className="text-lg font-bold text-foreground">
                {totals.available - totals.sold}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTicket ? 'Editar Ingresso' : 'Adicionar Ingresso'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="ticket-name">Nome do Ingresso *</Label>
              <Input
                id="ticket-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pista, VIP, Camarote"
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="ticket-description">Descrição</Label>
              <Textarea
                id="ticket-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que está incluído neste ingresso"
                rows={2}
                className="mt-2"
              />
            </div>

            {/* Price & Quantity */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ticket-price">Preço (R$) *</Label>
                <Input
                  id="ticket-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="ticket-quantity">Quantidade *</Label>
                <Input
                  id="ticket-quantity"
                  type="number"
                  min="1"
                  value={formData.quantity_available}
                  onChange={(e) => setFormData({ ...formData, quantity_available: parseInt(e.target.value) || 0 })}
                  placeholder="100"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Sale Period */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ticket-start">Início das Vendas</Label>
                <Input
                  id="ticket-start"
                  type="datetime-local"
                  value={formData.sale_start_date}
                  onChange={(e) => setFormData({ ...formData, sale_start_date: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="ticket-end">Fim das Vendas</Label>
                <Input
                  id="ticket-end"
                  type="datetime-local"
                  value={formData.sale_end_date}
                  onChange={(e) => setFormData({ ...formData, sale_end_date: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTicket} className="gap-2">
              <Check className="h-4 w-4" />
              {editingTicket ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}
