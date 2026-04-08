"use client";

import { useRef, useState } from "react";
import { WizardModal } from "@/components/ui/wizard-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateFacilityWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type FacilityImage = {
  file: File;
  preview: string;
};

const steps = [
  { id: "basic", title: "Basic Info", description: "Facility details" },
  { id: "location", title: "Location", description: "Address and place" },
  { id: "client", title: "Client Info", description: "Representative details" },
  {
    id: "media",
    title: "Images & Review",
    description: "Upload facility photos and notes",
  },
  { id: "confirm", title: "Confirm", description: "Review and submit" },
];

const facilityTypes = [
  "industrial",
  "commercial",
  "residential",
  "hospital",
  "educational",
  "government",
];

const facilityStatuses = [
  "draft",
  "active",
  "in-progress",
  "completed",
  "archived",
];

export function CreateFacilityWizard({
  open,
  onOpenChange,
  onComplete,
}: CreateFacilityWizardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    address: "",
    client_representative: "",
    client_contact_number: "",
    client_email: "",
    facility_type: "",
    status: "draft",
    review_notes: "",
    overall_review: "",
  });

  const [images, setImages] = useState<FacilityImage[]>([]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const imageToRemove = prev[index];
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetForm = () => {
    images.forEach((image) => {
      if (image.preview) URL.revokeObjectURL(image.preview);
    });

    setFormData({
      name: "",
      location: "",
      address: "",
      client_representative: "",
      client_contact_number: "",
      client_email: "",
      facility_type: "",
      status: "draft",
      review_notes: "",
      overall_review: "",
    });

    setImages([]);
  };

  const handleComplete = () => {
    const payload = {
      owner_user_id: "current-user-id",
      created_by: "current-user-id",
      name: formData.name,
      location: formData.location,
      address: formData.address,
      client_representative: formData.client_representative,
      client_contact_number: formData.client_contact_number,
      client_email: formData.client_email,
      facility_type: formData.facility_type,
      status: formData.status,
      review_notes: formData.review_notes,
      overall_review: formData.overall_review,
      images: images.map((img) => img.file),
      created_at: new Date(),
      updated_at: new Date(),
    };

    console.log("Creating facility:", payload);

    onComplete();
    resetForm();
  };

  return (
    <WizardModal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Facility"
      steps={steps}
      onComplete={handleComplete}
      contentClassName="max-w-5xl"
    >
      {/* Step 1: Basic Info */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground">
            Facility Name
          </Label>
          <Input
            id="name"
            placeholder="Enter facility name"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="bg-input"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="facility_type" className="text-foreground">
              Facility Type
            </Label>
            <Select
              value={formData.facility_type}
              onValueChange={(value) => updateField("facility_type", value)}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select facility type" />
              </SelectTrigger>
              <SelectContent>
                {facilityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="capitalize">{type}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-foreground">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => updateField("status", value)}
            >
              <SelectTrigger className="bg-input">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {facilityStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    <span className="capitalize">{status}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Step 2: Location */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="location" className="text-foreground">
            Location
          </Label>
          <Input
            id="location"
            placeholder="Enter city / area / site name"
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
            className="bg-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-foreground">
            Address
          </Label>
          <Input
            id="address"
            placeholder="Enter full facility address"
            value={formData.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="bg-input"
          />
        </div>
      </div>

      {/* Step 3: Client Info */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="client_representative" className="text-foreground">
            Client Representative
          </Label>
          <Input
            id="client_representative"
            placeholder="Enter representative name"
            value={formData.client_representative}
            onChange={(e) =>
              updateField("client_representative", e.target.value)
            }
            className="bg-input"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="client_contact_number" className="text-foreground">
              Client Contact Number
            </Label>
            <Input
              id="client_contact_number"
              type="tel"
              placeholder="Enter contact number"
              value={formData.client_contact_number}
              onChange={(e) =>
                updateField("client_contact_number", e.target.value)
              }
              className="bg-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_email" className="text-foreground">
              Client Email
            </Label>
            <Input
              id="client_email"
              type="email"
              placeholder="Enter client email"
              value={formData.client_email}
              onChange={(e) => updateField("client_email", e.target.value)}
              className="bg-input"
            />
          </div>
        </div>
      </div>

      {/* Step 4: Images & Review */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-foreground">Facility Images</Label>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Upload multiple images
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, JPEG, WEBP supported
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Choose Files
              </button>
            </div>

            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={`${image.file.name}-${index}`}
                    className="relative overflow-hidden rounded-lg border border-border bg-background"
                  >
                    <img
                      src={image.preview}
                      alt={image.file.name}
                      className="h-28 w-full object-cover"
                    />

                    <div className="p-2">
                      <p className="truncate text-xs text-muted-foreground">
                        {image.file.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 rounded-md bg-foreground/80 px-2 py-1 text-xs text-background"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="review_notes" className="text-foreground">
            Review Notes
          </Label>
          <Textarea
            id="review_notes"
            placeholder="Add inspection observations, site notes, or remarks"
            value={formData.review_notes}
            onChange={(e) => updateField("review_notes", e.target.value)}
            className="min-h-[120px] bg-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="overall_review" className="text-foreground">
            Overall Review
          </Label>
          <Select
            value={formData.overall_review}
            onValueChange={(value) => updateField("overall_review", value)}
          >
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="Select overall review" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Step 5: Confirmation */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Please review the information before creating the facility.
        </p>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Facility Name
              </p>
              <p className="text-sm text-foreground">{formData.name || "-"}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Facility Type
              </p>
              <p className="text-sm capitalize text-foreground">
                {formData.facility_type || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Status
              </p>
              <p className="text-sm capitalize text-foreground">
                {formData.status || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Location
              </p>
              <p className="text-sm text-foreground">
                {formData.location || "-"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Address
              </p>
              <p className="text-sm text-foreground">
                {formData.address || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Client Representative
              </p>
              <p className="text-sm text-foreground">
                {formData.client_representative || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Client Contact Number
              </p>
              <p className="text-sm text-foreground">
                {formData.client_contact_number || "-"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Client Email
              </p>
              <p className="text-sm text-foreground">
                {formData.client_email || "-"}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Review Notes
              </p>
              <p className="text-sm text-foreground">
                {formData.review_notes || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Overall Review
              </p>
              <p className="text-sm capitalize text-foreground">
                {formData.overall_review || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Images Uploaded
              </p>
              <p className="text-sm text-foreground">{images.length}</p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {images.map((image, index) => (
                <div
                  key={`${image.file.name}-preview-${index}`}
                  className="overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="h-24 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WizardModal>
  );
}
