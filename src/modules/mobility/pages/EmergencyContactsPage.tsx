import { useState, type FormEvent } from "react";
import { Check, Edit2, Mail, Phone, Plus, Trash2, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { ConfirmActionDialog } from "@/shared/components/ConfirmActionDialog";
import { useSessionContext } from "@/core/session";
import { useEmergencyContacts } from "@/core/safety";
import { logger } from "@/shared/utils/logger";

export default function EmergencyContactsPage() {
  const { activeProfile } = useSessionContext();
  const { contacts, loading, createContact, updateContact, deleteContact } = useEmergencyContacts(activeProfile?.id);
  type EmergencyContactItem = (typeof contacts)[number];
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    relationship: "",
    isPrimary: false,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!activeProfile?.id) {
      toast.error("Usuario nao autenticado");
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

  const handleEdit = (contact: EmergencyContactItem) => {
    setEditingId(contact.id);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      isPrimary: contact.is_primary,
    });
    setIsAdding(false);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    try {
      await deleteContact(contactToDelete);
      toast.success("Contato excluido!");
      setContactToDelete(null);
    } catch (error) {
      logger.error("Erro ao excluir contato:", error);
      toast.error("Erro ao excluir contato");
    } finally {
      setIsDeleting(false);
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contatos de emergencia</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seus contatos para alertas de emergencia.
            </p>
          </div>
          {!isAdding && !editingId && (
            <Button onClick={() => setIsAdding(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          )}
        </div>

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
              <label className="text-sm font-medium">Email ou telefone</label>
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
              <label className="text-sm font-medium">Relacao</label>
              <input
                type="text"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                placeholder="Ex: Mae, amigo, conjuge"
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
                Contato primario. Sera notificado primeiro.
              </label>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
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

        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-card border border-border">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum contato de emergencia cadastrado.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione contatos para receber alertas em caso de emergencia.
              </p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{contact.name}</h3>
                      {contact.is_primary && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                          Primario
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
                    <Button onClick={() => handleEdit(contact)} variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setContactToDelete(contact.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-500">
            Seus contatos de emergencia serao notificados automaticamente quando voce acionar um alerta SOS durante uma corrida.
          </p>
        </div>
      </div>

      <ConfirmActionDialog
        open={!!contactToDelete}
        onOpenChange={(open) => !open && setContactToDelete(null)}
        title="Excluir contato"
        description="Deseja realmente excluir este contato de emergencia?"
        confirmLabel="Excluir"
        onConfirm={handleDeleteConfirm}
        disabled={isDeleting}
      />
    </div>
  );
}
