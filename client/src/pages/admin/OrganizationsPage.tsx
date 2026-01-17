import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Building2, Pencil, Trash2, UserPlus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface Organization {
  id: string;
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  pib?: string;
  pdv?: string;
  isActive?: boolean;
  createdAt?: string;
}

export default function OrganizationsPage() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false);
  const [isEditOrgOpen, setIsEditOrgOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Form state for organization
  const [orgFormData, setOrgFormData] = useState({
    name: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    pib: "",
    pdv: "",
  });

  // Form state for admin user (used in combined form)
  const [adminFormData, setAdminFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
  });

  // Check if user is super_admin
  if (currentUser?.userRole !== "super_admin") {
    return (
      <AppLayout title="Organizacije">
        <div className="text-center py-8 text-muted-foreground">
          Nemate pristup ovoj stranici.
        </div>
      </AppLayout>
    );
  }

  const { data: organizations = [], isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/organizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ description: "Organizacija i admin uspješno kreirani" });
      resetAllForms();
      setIsAddOrgOpen(false);
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Greška pri kreiranju organizacije",
        variant: "destructive",
      });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/organizations/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({ description: "Organizacija uspješno ažurirana" });
      resetOrgForm();
      setIsEditOrgOpen(false);
      setSelectedOrg(null);
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Greška pri ažuriranju organizacije",
        variant: "destructive",
      });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/organizations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      toast({ description: "Organizacija uspješno obrisana" });
      setDeleteOrgId(null);
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Greška pri brisanju organizacije",
        variant: "destructive",
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (userData: any) => {
      return await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ description: "Admin korisnik uspješno kreiran" });
      resetAdminForm();
      setIsAddAdminOpen(false);
      setSelectedOrg(null);
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Greška pri kreiranju admin korisnika",
        variant: "destructive",
      });
    },
  });

  const resetOrgForm = () => {
    setOrgFormData({
      name: "",
      address: "",
      contactEmail: "",
      contactPhone: "",
      pib: "",
      pdv: "",
    });
  };

  const resetAdminForm = () => {
    setAdminFormData({
      username: "",
      password: "",
      fullName: "",
      email: "",
    });
  };

  const resetAllForms = () => {
    resetOrgForm();
    resetAdminForm();
  };

  const handleAddOrg = () => {
    // Create organization with admin in one request
    createOrgMutation.mutate({
      organization: orgFormData,
      admin: adminFormData.username ? adminFormData : null,
    });
  };

  const handleEditOrg = () => {
    if (!selectedOrg) return;
    updateOrgMutation.mutate({ id: selectedOrg.id, data: orgFormData });
  };

  const handleAddAdmin = () => {
    if (!selectedOrg) return;
    createAdminMutation.mutate({
      ...adminFormData,
      userRole: "org_admin",
      organizationId: selectedOrg.id,
    });
  };

  const openEditDialog = (org: Organization) => {
    setSelectedOrg(org);
    setOrgFormData({
      name: org.name,
      address: org.address || "",
      contactEmail: org.contactEmail || "",
      contactPhone: org.contactPhone || "",
      pib: org.pib || "",
      pdv: org.pdv || "",
    });
    setIsEditOrgOpen(true);
  };

  const openAddAdminDialog = (org: Organization) => {
    setSelectedOrg(org);
    resetAdminForm();
    setIsAddAdminOpen(true);
  };

  const handleSwitchToOrg = async (orgId: string) => {
    try {
      await apiRequest("POST", `/api/organizations/${orgId}/switch`);
      queryClient.invalidateQueries();
      toast({ description: "Prebačeno na organizaciju" });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        description: error.message || "Greška pri prebacivanju",
        variant: "destructive",
      });
    }
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Organizacije">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">Organizacije</h2>
          <Dialog open={isAddOrgOpen} onOpenChange={(open) => { setIsAddOrgOpen(open); if (!open) resetAllForms(); }}>
            <DialogTrigger asChild>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Nova organizacija
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova organizacija</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Organization Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Podaci o organizaciji</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="org-name">Naziv firme *</Label>
                      <Input
                        id="org-name"
                        value={orgFormData.name}
                        onChange={(e) =>
                          setOrgFormData({ ...orgFormData, name: e.target.value })
                        }
                        placeholder="npr. Servis Marković d.o.o."
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="org-address">Adresa</Label>
                      <Input
                        id="org-address"
                        value={orgFormData.address}
                        onChange={(e) =>
                          setOrgFormData({ ...orgFormData, address: e.target.value })
                        }
                        placeholder="Ulica i broj, grad"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-email">Email</Label>
                      <Input
                        id="org-email"
                        type="email"
                        value={orgFormData.contactEmail}
                        onChange={(e) =>
                          setOrgFormData({ ...orgFormData, contactEmail: e.target.value })
                        }
                        placeholder="info@firma.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-phone">Telefon</Label>
                      <Input
                        id="org-phone"
                        value={orgFormData.contactPhone}
                        onChange={(e) =>
                          setOrgFormData({ ...orgFormData, contactPhone: e.target.value })
                        }
                        placeholder="+382 69 123 456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-pib">PIB</Label>
                      <Input
                        id="org-pib"
                        value={orgFormData.pib}
                        onChange={(e) =>
                          setOrgFormData({ ...orgFormData, pib: e.target.value })
                        }
                        placeholder="12345678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-pdv">PDV broj</Label>
                      <Input
                        id="org-pdv"
                        value={orgFormData.pdv}
                        onChange={(e) =>
                          setOrgFormData({ ...orgFormData, pdv: e.target.value })
                        }
                        placeholder="ME12345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Admin User Details */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Administrator organizacije</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="admin-username">Korisničko ime *</Label>
                      <Input
                        id="admin-username"
                        value={adminFormData.username}
                        onChange={(e) =>
                          setAdminFormData({ ...adminFormData, username: e.target.value })
                        }
                        placeholder="marko.admin"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Lozinka *</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        value={adminFormData.password}
                        onChange={(e) =>
                          setAdminFormData({ ...adminFormData, password: e.target.value })
                        }
                        placeholder="Minimalno 6 karaktera"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-fullName">Ime i prezime *</Label>
                      <Input
                        id="admin-fullName"
                        value={adminFormData.fullName}
                        onChange={(e) =>
                          setAdminFormData({ ...adminFormData, fullName: e.target.value })
                        }
                        placeholder="Marko Marković"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={adminFormData.email}
                        onChange={(e) =>
                          setAdminFormData({ ...adminFormData, email: e.target.value })
                        }
                        placeholder="marko@firma.com"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAddOrg}
                  className="w-full"
                  disabled={
                    !orgFormData.name ||
                    !adminFormData.username ||
                    !adminFormData.password ||
                    !adminFormData.fullName ||
                    createOrgMutation.isPending
                  }
                >
                  {createOrgMutation.isPending ? "Kreiranje..." : "Kreiraj organizaciju i admina"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži organizacije..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Organizations Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Učitavanje...
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "Nema rezultata pretrage" : "Nema organizacija"}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Email / Telefon</TableHead>
                  <TableHead>PIB</TableHead>
                  <TableHead>PDV</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{org.name}</p>
                        {org.address && <p className="text-xs text-muted-foreground">{org.address}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {org.contactEmail && <p>{org.contactEmail}</p>}
                        {org.contactPhone && <p className="text-muted-foreground">{org.contactPhone}</p>}
                        {!org.contactEmail && !org.contactPhone && "-"}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{org.pib || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{org.pdv || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={org.isActive !== false ? "default" : "secondary"}>
                        {org.isActive !== false ? "Aktivna" : "Neaktivna"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchToOrg(org.id)}
                        >
                          Prebaci se
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openAddAdminDialog(org)}
                          title="Dodaj admin korisnika"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(org)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteOrgId(org.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Organization Dialog */}
        <Dialog open={isEditOrgOpen} onOpenChange={setIsEditOrgOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Uredi organizaciju</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-org-name">Naziv *</Label>
                  <Input
                    id="edit-org-name"
                    value={orgFormData.name}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, name: e.target.value })
                    }
                    placeholder="Unesite naziv organizacije"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-org-address">Adresa</Label>
                  <Input
                    id="edit-org-address"
                    value={orgFormData.address}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, address: e.target.value })
                    }
                    placeholder="Unesite adresu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-email">Email</Label>
                  <Input
                    id="edit-org-email"
                    type="email"
                    value={orgFormData.contactEmail}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, contactEmail: e.target.value })
                    }
                    placeholder="Unesite email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-phone">Telefon</Label>
                  <Input
                    id="edit-org-phone"
                    value={orgFormData.contactPhone}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, contactPhone: e.target.value })
                    }
                    placeholder="Unesite telefon"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-pib">PIB</Label>
                  <Input
                    id="edit-org-pib"
                    value={orgFormData.pib}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, pib: e.target.value })
                    }
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-org-pdv">PDV broj</Label>
                  <Input
                    id="edit-org-pdv"
                    value={orgFormData.pdv}
                    onChange={(e) =>
                      setOrgFormData({ ...orgFormData, pdv: e.target.value })
                    }
                    placeholder="ME12345678"
                  />
                </div>
              </div>
              <Button
                onClick={handleEditOrg}
                className="w-full"
                disabled={!orgFormData.name || updateOrgMutation.isPending}
              >
                {updateOrgMutation.isPending ? "Spremanje..." : "Spremi promjene"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Admin User Dialog */}
        <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Novi admin za {selectedOrg?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Korisničko ime *</Label>
                <Input
                  id="admin-username"
                  value={adminFormData.username}
                  onChange={(e) =>
                    setAdminFormData({ ...adminFormData, username: e.target.value })
                  }
                  placeholder="Unesite korisničko ime"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Lozinka *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminFormData.password}
                  onChange={(e) =>
                    setAdminFormData({ ...adminFormData, password: e.target.value })
                  }
                  placeholder="Unesite lozinku"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-fullName">Puno ime *</Label>
                <Input
                  id="admin-fullName"
                  value={adminFormData.fullName}
                  onChange={(e) =>
                    setAdminFormData({ ...adminFormData, fullName: e.target.value })
                  }
                  placeholder="Unesite puno ime"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminFormData.email}
                  onChange={(e) =>
                    setAdminFormData({ ...adminFormData, email: e.target.value })
                  }
                  placeholder="Unesite email"
                />
              </div>
              <Button
                onClick={handleAddAdmin}
                className="w-full"
                disabled={
                  !adminFormData.username ||
                  !adminFormData.password ||
                  !adminFormData.fullName ||
                  createAdminMutation.isPending
                }
              >
                {createAdminMutation.isPending ? "Kreiranje..." : "Kreiraj admin korisnika"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteOrgId}
          onOpenChange={() => setDeleteOrgId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Obriši organizaciju?</AlertDialogTitle>
              <AlertDialogDescription>
                Ova akcija se ne može poništiti. Svi podaci vezani za ovu organizaciju
                (korisnici, klijenti, uređaji, zadaci, izvještaji) će biti trajno obrisani.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Odustani</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteOrgId && deleteOrgMutation.mutate(deleteOrgId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteOrgMutation.isPending ? "Brisanje..." : "Obriši"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
