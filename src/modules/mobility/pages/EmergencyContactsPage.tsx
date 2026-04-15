import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Phone, Mail, User } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useSessionContext } from "@/core/session";
import { useEmergencyContacts } from "@/core/safety";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";

export default function EmergencyContactsPage() {
  const { activeProfile } = useSessionContext();
  const { contacts, loading, createContact, updateContact, deleteContact } = useEmergencyContacts(activeProfile?.id);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    relationship: "",
    isPrimary: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeProfile?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      if (editingId) {
        await updateContact(editingId, {
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship,
          isPrimary: formData.isPrimary,
        });
        toast.success("Contato atualizado!");
        setEditingId(null);
      } else {
        await createContact({
          profileId: activeProfile.id,
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship,
          isPrimary: formData.isPrimary,
        });
        toast.success("Contato adicionado!");
        setIsAdding(false);
      }

      setFormData({ name: "", phone: "", relationship: "", isPrimary: false });
    } catch (error) {
      logger.error("Erro ao salvar contato:", error);
      toast.error("Erro ao salvar contato");
    }
  };

  const handleEdit = (contact: any) => {
    setEditingId(contact.id);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isPrimary: contact.is_primary,
    });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este contato?")) return;

    try {
      await deleteContact(id);
      toast.success("Contato excluído!");
    } catch (error) {
      logger.error("Erro ao excluir contato:", error);
      toast.error("Erro ao excluir contato");
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", phone: "", relationship: "", isPrimary: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contatos de Emergência</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus contatos para alertas de emergência
            </p>
          </div>
          {!isAdding && !editingId && (
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          )}
        </div>

        {/* Form */}
        {(isAdding || editingId) && (
          <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-card border border-border space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email ou Telefone</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="email@exemplo.com ou (27) 99999-9999"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Relação</label>
              <input
                type="text"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                placeholder="Ex: Mãe, Amigo, Cônjuge"
                required
                className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="isPrimary" className="text-sm">
                Contato primário (será notificado primeiro)
              </label>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1 gap-2">
                <Check className="h-4 w-4" />
                {editingId ? "Atualizar" : "Adicionar"}
              </Button>
              <Button type="button" onClick={handleCancel} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-card border border-border">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum contato de emergência cadastrado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione contatos para receber alertas em caso de emergência
              </p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{contact.name}</h3>
                      {contact.is_primary && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                          Primário
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      {contact.phone}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {contact.relationship}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(contact)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(contact.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-400">
            ℹ️ Seus contatos de emergência serão notificados automaticamente quando você acionar um alerta SOS durante uma corrida.
          </p>
        </div>
      </div>
    </div>
  );
}
