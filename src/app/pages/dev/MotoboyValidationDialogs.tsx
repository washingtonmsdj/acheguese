import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import type { DeliveryProof } from '@/modules/mobility';

type DeliveryModalState = {
  open: boolean;
  deliveryId: string | null;
};

type MotoboyValidationDialogsProps = {
  confirmDeliveryModal: DeliveryModalState;
  failDeliveryModal: DeliveryModalState;
  proofData: DeliveryProof;
  failReason: string;
  onConfirmModalOpenChange: (open: boolean) => void;
  onFailModalOpenChange: (open: boolean) => void;
  onProofDataChange: (next: DeliveryProof) => void;
  onFailReasonChange: (next: string) => void;
  onConfirmDelivery: () => void | Promise<void>;
  onFailDelivery: () => void | Promise<void>;
};

export function MotoboyValidationDialogs({
  confirmDeliveryModal,
  failDeliveryModal,
  proofData,
  failReason,
  onConfirmModalOpenChange,
  onFailModalOpenChange,
  onProofDataChange,
  onFailReasonChange,
  onConfirmDelivery,
  onFailDelivery,
}: MotoboyValidationDialogsProps) {
  return (
    <>
      <Dialog open={confirmDeliveryModal.open} onOpenChange={onConfirmModalOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delivery</DialogTitle>
            <DialogDescription>Register proof of delivery (optional fields)</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proof-code">Verification Code</Label>
              <Input
                id="proof-code"
                placeholder="Ex: 1234"
                value={proofData.code || ''}
                onChange={(event) => onProofDataChange({ ...proofData, code: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof-photo">Photo URL</Label>
              <Input
                id="proof-photo"
                placeholder="https://..."
                value={proofData.photo_url || ''}
                onChange={(event) => onProofDataChange({ ...proofData, photo_url: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof-obs">Observation</Label>
              <Textarea
                id="proof-obs"
                placeholder="Delivered to concierge..."
                value={proofData.observation || ''}
                onChange={(event) => onProofDataChange({ ...proofData, observation: event.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onConfirmModalOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => void onConfirmDelivery()}>Confirm Delivery</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={failDeliveryModal.open} onOpenChange={onFailModalOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Delivery Failure</DialogTitle>
            <DialogDescription>Failure reason is mandatory</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fail-reason">Failure Reason *</Label>
              <Textarea
                id="fail-reason"
                placeholder="Recipient unavailable, wrong address..."
                value={failReason}
                onChange={(event) => onFailReasonChange(event.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onFailModalOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void onFailDelivery()}>
              Register Failure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
