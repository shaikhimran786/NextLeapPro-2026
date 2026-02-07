"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Briefcase, Star, Edit, Trash2, Search, IndianRupee, User, ShieldAlert, ShieldCheck, Ban, Eye } from "@/lib/icons";
import { formatINR } from "@/lib/utils";
import { getImageUrl, isValidImageSrc } from "@/lib/image-utils";

interface Service {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  price: number;
  currency: string;
  deliveryType: string;
  rating: number;
  reviewCount: number;
  status: string;
  isActive: boolean;
  provider: { id: number; firstName: string; lastName: string; email: string };
  _count?: { bookings: number; reviews: number };
  createdAt: string;
}

const serviceCategories = ["Mentoring", "Consulting", "Tutoring", "Coaching", "Design", "Development", "Writing", "Marketing"];
const deliveryTypes = ["online", "offline", "hybrid"];

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch("/api/admin/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      toast.error("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteService(id: number) {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Service deleted");
        fetchServices();
      } else {
        toast.error("Failed to delete service");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function saveService() {
    if (!editingService) return;

    try {
      const res = await fetch(`/api/admin/services/${editingService.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingService),
      });

      if (res.ok) {
        toast.success("Service updated successfully");
        setIsDialogOpen(false);
        setEditingService(null);
        fetchServices();
      } else {
        toast.error("Failed to update service");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  async function toggleServiceStatus(id: number, currentStatus: string, isActive: boolean) {
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    const newIsActive = !isActive;
    const action = newStatus === "blocked" ? "block" : "unblock";
    
    if (!confirm(`Are you sure you want to ${action} this service?`)) return;

    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, isActive: newIsActive }),
      });

      if (res.ok) {
        toast.success(`Service ${action}ed successfully`);
        fetchServices();
      } else {
        toast.error(`Failed to ${action} service`);
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.provider.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.provider.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-900">Services Marketplace</h1>
          <p className="text-slate-600 mt-1">Manage all services offered by providers on the platform</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-services"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-slate-600">Service</th>
                  <th className="pb-3 font-medium text-slate-600">Provider</th>
                  <th className="pb-3 font-medium text-slate-600">Category</th>
                  <th className="pb-3 font-medium text-slate-600">Price</th>
                  <th className="pb-3 font-medium text-slate-600">Rating</th>
                  <th className="pb-3 font-medium text-slate-600">Status</th>
                  <th className="pb-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr key={service.id} className="border-b last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 rounded-lg bg-slate-100 overflow-hidden">
                          {isValidImageSrc(service.coverImage) && (
                            <img src={getImageUrl(service.coverImage)} alt={service.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{service.title}</p>
                          <p className="text-sm text-slate-500 line-clamp-1">{service.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-900">{service.provider.firstName} {service.provider.lastName}</p>
                          <p className="text-xs text-slate-500">{service.provider.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="secondary">{service.category}</Badge>
                    </td>
                    <td className="py-4">
                      <p className="text-sm font-medium" suppressHydrationWarning>{formatINR(service.price)}</p>
                      <p className="text-xs text-slate-500">{service.deliveryType}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm">{Number(service.rating).toFixed(1)}</span>
                        <span className="text-xs text-slate-500">({service.reviewCount})</span>
                      </div>
                    </td>
                    <td className="py-4">
                      {service.status === "blocked" || !service.isActive ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Blocked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                          <ShieldCheck className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/services/${service.id}`, "_blank")}
                          title="View Service"
                          data-testid={`button-view-service-${service.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingService(service);
                            setIsDialogOpen(true);
                          }}
                          title="Edit Service"
                          data-testid={`button-edit-service-${service.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleServiceStatus(service.id, service.status, service.isActive)}
                          className={service.status === "blocked" || !service.isActive ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
                          title={service.status === "blocked" || !service.isActive ? "Unblock Service" : "Block Service"}
                          data-testid={`button-toggle-service-${service.id}`}
                        >
                          {service.status === "blocked" || !service.isActive ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <ShieldAlert className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteService(service.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Service"
                          data-testid={`button-delete-service-${service.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredServices.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No services found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingService.title}
                  onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                  data-testid="input-service-title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingService.description}
                  onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                  rows={3}
                  data-testid="input-service-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={editingService.category}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                    data-testid="input-service-category"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deliveryType">Delivery Type</Label>
                  <Input
                    id="deliveryType"
                    value={editingService.deliveryType}
                    onChange={(e) => setEditingService({ ...editingService, deliveryType: e.target.value })}
                    data-testid="input-service-delivery"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (INR)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })}
                    data-testid="input-service-price"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    value={editingService.coverImage}
                    onChange={(e) => setEditingService({ ...editingService, coverImage: e.target.value })}
                    data-testid="input-service-cover"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveService} data-testid="button-save-service">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
