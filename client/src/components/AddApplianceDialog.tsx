import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertApplianceSchema, type InsertAppliance } from "@shared/schema";
import { z } from "zod";

interface AddApplianceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  onSuccess?: (applianceId: string) => void;
}

const applianceFormSchema = insertApplianceSchema.extend({
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  installDate: z.string().optional(),
});

type ApplianceFormValues = z.infer<typeof applianceFormSchema>;

export default function AddApplianceDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: AddApplianceDialogProps) {
  const { toast } = useToast();

  const form = useForm<ApplianceFormValues>({
    resolver: zodResolver(applianceFormSchema),
    defaultValues: {
      clientId: clientId || "",
      name: "",
      model: "",
      serialNumber: "",
      location: "",
      installDate: "",
    },
  });

  useEffect(() => {
    if (clientId) {
      form.setValue("clientId", clientId);
    }
  }, [clientId, form]);

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const createApplianceMutation = useMutation({
    mutationFn: async (applianceData: InsertAppliance) => {
      const response = await apiRequest("POST", "/api/appliances", applianceData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/appliances"] });
      toast({
        title: "Success",
        description: "Appliance created successfully",
      });
      form.reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create appliance",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (values: ApplianceFormValues) => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Please select a client first",
        variant: "destructive",
      });
      return;
    }

    const applianceData: InsertAppliance = {
      clientId: values.clientId,
      name: values.name,
      model: values.model || null,
      serialNumber: values.serialNumber || null,
      location: values.location || null,
      installDate: values.installDate || null,
    };

    createApplianceMutation.mutate(applianceData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Appliance</DialogTitle>
          <DialogDescription>
            Create a new appliance for the selected client
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Appliance Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Commercial Freezer Unit"
                      data-testid="input-appliance-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Model CFU-2000"
                      data-testid="input-appliance-model"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., SN-12345"
                      data-testid="input-appliance-serial"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Kitchen, Basement"
                      data-testid="input-appliance-location"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Install Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      data-testid="input-appliance-install-date"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                className="flex-1"
                data-testid="button-cancel-appliance"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!clientId || createApplianceMutation.isPending}
                className="flex-1"
                data-testid="button-create-appliance"
              >
                {createApplianceMutation.isPending ? "Creating..." : "Create Appliance"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
