import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n";
import type { Client } from "@shared/schema";

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export default function EditClientDialog({
  open,
  onOpenChange,
  client,
}: EditClientDialogProps) {
  const t = useTranslation();
  const { toast } = useToast();
  const [clientName, setClientName] = useState(client.name || "");
  const [contactName, setContactName] = useState(client.contactName || "");
  const [contactEmail, setContactEmail] = useState(client.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(client.contactPhone || "");
  const [clientAddress, setClientAddress] = useState(client.address || "");
  const [clientPib, setClientPib] = useState(client.pib || "");
  const [clientPdv, setClientPdv] = useState(client.pdv || "");
  const [clientAccount, setClientAccount] = useState(client.account || "");

  useEffect(() => {
    if (open && client) {
      setClientName(client.name || "");
      setContactName(client.contactName || "");
      setContactEmail(client.contactEmail || "");
      setContactPhone(client.contactPhone || "");
      setClientAddress(client.address || "");
      setClientPib(client.pib || "");
      setClientPdv(client.pdv || "");
      setClientAccount(client.account || "");
    }
  }, [open, client]);

  const updateClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      return await apiRequest("PATCH", `/api/clients/${client.id}`, clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", client.id] });
      toast({
        description: t.clients.updateSuccess,
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        description: error.message || t.clients.updateError,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!clientName) {
      toast({
        description: t.clients.fillRequired,
        variant: "destructive",
      });
      return;
    }

    updateClientMutation.mutate({
      name: clientName,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      address: clientAddress || null,
      pib: clientPib || null,
      pdv: clientPdv || null,
      account: clientAccount || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.clients.editClient}</DialogTitle>
          <DialogDescription>
            {t.clients.editClientDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-client-name">
              {t.clients.name} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-client-name"
              placeholder={t.clients.namePlaceholder}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              data-testid="input-edit-client-name"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-contact-name">
                {t.clients.contactName}
              </Label>
              <Input
                id="edit-contact-name"
                placeholder={t.clients.contactNamePlaceholder}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                data-testid="input-edit-contact-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-contact-phone">
                {t.clients.contactPhone}
              </Label>
              <Input
                id="edit-contact-phone"
                placeholder={t.clients.contactPhonePlaceholder}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                data-testid="input-edit-contact-phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact-email">
              {t.clients.contactEmail}
            </Label>
            <Input
              id="edit-contact-email"
              type="email"
              placeholder={t.clients.contactEmailPlaceholder}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              data-testid="input-edit-contact-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-address">{t.clients.address}</Label>
            <Input
              id="edit-client-address"
              placeholder={t.clients.addressPlaceholder}
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              data-testid="input-edit-client-address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-client-pib">{t.clients.pib}</Label>
              <Input
                id="edit-client-pib"
                placeholder="12345678"
                value={clientPib}
                onChange={(e) => setClientPib(e.target.value)}
                data-testid="input-edit-client-pib"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-client-pdv">{t.clients.pdv}</Label>
              <Input
                id="edit-client-pdv"
                placeholder="PDV broj"
                value={clientPdv}
                onChange={(e) => setClientPdv(e.target.value)}
                data-testid="input-edit-client-pdv"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-client-account">{t.clients.account}</Label>
              <Input
                id="edit-client-account"
                placeholder="510-123456-78"
                value={clientAccount}
                onChange={(e) => setClientAccount(e.target.value)}
                data-testid="input-edit-client-account"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-edit-client"
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!clientName || updateClientMutation.isPending}
              className="flex-1"
              data-testid="button-save-client"
            >
              {updateClientMutation.isPending ? t.clients.updating : t.clients.saveChanges}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
