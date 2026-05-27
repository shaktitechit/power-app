"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useGetFacilityByIdQuery,
  useUpdateFacilityMutation,
} from "@/store/slices/facilityApiSlice";
import { toastHandler } from "@/lib/toast";

interface EditBudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  facilityId: string | null;
}

export function EditBudgetForm({
  open,
  onOpenChange,
  onComplete,
  facilityId,
}: EditBudgetFormProps) {
  const { data: facilityResponse, isLoading: facilityLoading } =
    useGetFacilityByIdQuery(facilityId as string, {
      skip: !facilityId || !open,
    });

  const [updateFacility, { isLoading: updatingFacility }] =
    useUpdateFacilityMutation();

  const facility = facilityResponse?.data?.facility;

  const [formData, setFormData] = useState({
    no_of_persons: "",
    no_planned_site_visits: "",
    tentative_budget: "",
    actual_budget: "",
  });

  useEffect(() => {
    if (!facility || !open) return;

    setFormData({
      no_of_persons:
        facility.budget?.no_of_persons != null
          ? String(facility.budget.no_of_persons)
          : "",
      no_planned_site_visits:
        facility.budget?.no_planned_site_visits != null
          ? String(facility.budget.no_planned_site_visits)
          : "",
      tentative_budget:
        facility.budget?.tentative_budget != null
          ? String(facility.budget.tentative_budget)
          : "",
      actual_budget:
        facility.budget?.actual_budget != null
          ? String(facility.budget.actual_budget)
          : "",
    });
  }, [facility, open]);

  const handleSubmit = async () => {
    if (!facilityId) return;

    try {
      await toastHandler({
        action: () =>
          updateFacility({
            id: facilityId,
            budget: {
              no_of_persons:
                formData.no_of_persons !== ""
                  ? Number(formData.no_of_persons)
                  : null,
              no_planned_site_visits:
                formData.no_planned_site_visits !== ""
                  ? Number(formData.no_planned_site_visits)
                  : null,
              tentative_budget:
                formData.tentative_budget !== ""
                  ? Number(formData.tentative_budget)
                  : null,
              actual_budget:
                formData.actual_budget !== ""
                  ? Number(formData.actual_budget)
                  : null,
            },
          }).unwrap(),
        loading: "Updating budget...",
        success: "Budget updated successfully",
      });

      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update budget:", error);
    }
  };

  const isBusy = updatingFacility || facilityLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Budget Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="no_of_persons">No. of Persons</Label>
              <Input
                id="no_of_persons"
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={formData.no_of_persons}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    no_of_persons: e.target.value,
                  }))
                }
                disabled={isBusy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="no_planned_site_visits">Site Visits</Label>
              <Input
                id="no_planned_site_visits"
                type="number"
                min="0"
                placeholder="e.g. 3"
                value={formData.no_planned_site_visits}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    no_planned_site_visits: e.target.value,
                  }))
                }
                disabled={isBusy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tentative_budget">Tentative Budget (₹)</Label>
            <Input
              id="tentative_budget"
              type="number"
              min="0"
              placeholder="e.g. 50000"
              value={formData.tentative_budget}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  tentative_budget: e.target.value,
                }))
              }
              disabled={isBusy}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="actual_budget">Actual Budget (₹)</Label>
            <Input
              id="actual_budget"
              type="number"
              min="0"
              placeholder="e.g. 45000"
              value={formData.actual_budget}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  actual_budget: e.target.value,
                }))
              }
              disabled={isBusy}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isBusy}>
            {updatingFacility ? "Updating..." : "Update Budget"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
