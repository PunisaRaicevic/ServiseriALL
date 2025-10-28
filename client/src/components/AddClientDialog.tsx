import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (clientId: string) => void;
}

export default function AddClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddClientDialogProps) {
  const { toast } = useToast();
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  useEffect(() => {
    if (!open) {
      setClientName("");
      setClientEmail("");
      setClientPhone("");
      setClientAddress("");
    }
  }, [open]);

  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest("POST", "/api/clients", clientData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!clientName || !clientEmail || !clientPhone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createClientMutation.mutate({
      name: clientName,
      contact: clientPhone,
      address: clientAddress || null,
      pib: null,
      pdv: null,
      account: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Add a new client to the system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">
              Client Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-name"
              placeholder="Enter client name..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              data-testid="input-client-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-email"
              type="email"
              placeholder="client@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              data-testid="input-client-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-phone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client-phone"
              placeholder="e.g., +382 123 456"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              data-testid="input-client-phone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-address">Address</Label>
            <Input
              id="client-address"
              placeholder="Street address, city, state"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
              data-testid="input-client-address"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-client"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!clientName || !clientEmail || !clientPhone || createClientMutation.isPending}
              className="flex-1"
              data-testid="button-create-client"
            >
              {createClientMutation.isPending ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
