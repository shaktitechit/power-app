"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateFacilityForm } from "@/components/facility/create-facility-form";
import { EditFacilityForm } from "@/components/facility/edit-facility-form";
import type { Facility } from "@/lib/dummy-types";
import { Plus, Search, Building2, Pencil, Trash2 } from "lucide-react";
import {
  useGetFacilitiesQuery,
  useDeleteFacilityMutation,
} from "@/store/slices/facilityApiSlice";
import { useAppSelector } from "@/store/hooks";

export default function FacilitiesPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(
    null,
  );

  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const {
    data,
    isLoading: facilitiesLoading,
    refetch: refetchFacilities,
  } = useGetFacilitiesQuery();

  const [deleteFacility, { isLoading: isDeleting }] =
    useDeleteFacilityMutation();

  const facilities = data?.data || [];

  const filteredFacilities = facilities.filter((facility: Facility) => {
    const matchesSearch =
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || facility.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleEditFacility = (
    e: React.MouseEvent<HTMLButtonElement>,
    facility: Facility,
  ) => {
    e.stopPropagation();
    setSelectedFacilityId(facility._id);
    setEditOpen(true);
  };

  const handleDeleteFacility = async (
    e: React.MouseEvent<HTMLButtonElement>,
    facility: Facility,
  ) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${facility.name}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteFacility(facility._id).unwrap();
    } catch (error) {
      console.error("Failed to delete facility:", error);
    }
  };

  const columns: Column<Facility>[] = [
    {
      key: "name",
      header: "Facility",
      render: (row) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
            <Building2 className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground sm:text-base">
              {row.name}
            </p>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {row.city}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "address",
      header: "Address",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-muted-foreground">{row.address}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "client_representative",
      header: "Client Representative",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-foreground">{row.client_representative}</span>
      ),
    },
    {
      key: "facility_type",
      header: "Facility Type",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-foreground capitalize">{row.facility_type}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: Facility) => (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => handleEditFacility(e, row)}
          >
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const handleRowClick = (facility: Facility) => {
    router.push(`/facility/${facility._id}`);
  };

  const handleCreateFacility = () => {
    setIsWizardOpen(false);
    refetchFacilities();
  };

  const handleEditComplete = () => {
    setEditOpen(false);
    setSelectedFacilityId(null);
    refetchFacilities();
  };

  return (
    <DashboardLayout
      title="Facilities"
      subtitle="Manage all audited facilities"
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search facilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-input pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full bg-input sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setIsWizardOpen(true)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Facility
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filteredFacilities}
        onRowClick={handleRowClick}
        emptyMessage={
          facilitiesLoading ? "Loading facilities..." : "No facilities found"
        }
      />

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
        <span>
          Showing {filteredFacilities.length} of {facilities.length} facilities
        </span>
      </div>

      <CreateFacilityForm
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={handleCreateFacility}
      />

      <EditFacilityForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onComplete={handleEditComplete}
        facilityId={selectedFacilityId}
      />
    </DashboardLayout>
  );
}
