"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, Upload, X } from "lucide-react";
import {
  useGetDGSetByIdQuery,
  useUpdateDGSetMutation,
} from "@/store/slices/electrical-audit/dgSetApiSlice";
import { toastHandler } from "@/lib/toast";

interface EditDGSetDocumentsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  dgSetId: string;
}

type NewDocument = {
  file: File;
  preview?: string;
  fileType: "image" | "pdf";
};

type ExistingDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
};

export function EditDGSetDocumentsForm({
  open,
  onOpenChange,
  onComplete,
  dgSetId,
}: EditDGSetDocumentsFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: dgResponse, isLoading: dgLoading } =
    useGetDGSetByIdQuery(dgSetId, {
      skip: !dgSetId || !open,
    });

  const [updateDGSet, { isLoading: updatingDG }] =
    useUpdateDGSetMutation();

  const dgSet = dgResponse?.data;

  const [existingDocuments, setExistingDocuments] = useState<
    ExistingDocument[]
  >([]);
  const [newDocuments, setNewDocuments] = useState<NewDocument[]>([]);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!dgSet || !open) return;

    setExistingDocuments(dgSet.documents || []);
    setNewDocuments([]);
    setSubmitError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [dgSet, open]);

  useEffect(() => {
    return () => {
      newDocuments.forEach((doc) => {
        if (doc.preview) URL.revokeObjectURL(doc.preview);
      });
    };
  }, [newDocuments]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const uploadedDocs: NewDocument[] = files
      .map((file) => {
        const isPdf =
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf");
        const isImage = file.type.startsWith("image/");

        if (!isPdf && !isImage) return null;

        return {
          file,
          fileType: isPdf ? "pdf" : ("image" as const),
          preview: isPdf ? undefined : URL.createObjectURL(file),
        };
      })
      .filter(Boolean) as NewDocument[];

    setNewDocuments((prev) => [...prev, ...uploadedDocs]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeNewDocument = (index: number) => {
    setNewDocuments((prev) => {
      const doc = prev[index];
      if (doc?.preview) URL.revokeObjectURL(doc.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const resetLocalState = () => {
    newDocuments.forEach((doc) => {
      if (doc.preview) URL.revokeObjectURL(doc.preview);
    });
    setNewDocuments([]);
    setSubmitError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetLocalState();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!dgSetId) return;

    try {
      await toastHandler({
        action: () =>
          updateDGSet({
            id: dgSetId,
            documents: newDocuments.map((doc) => doc.file),
          }).unwrap(),
        loading: "Uploading documents...",
        success: "Documents uploaded successfully",
      });

      onComplete();
      handleClose();
    } catch (error) {
      console.error("Failed to update DG set documents:", error);
    }
  };

  const isBusy = updatingDG || dgLoading;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Documents & Images (DG Set)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-xl border border-dashed p-6">
            <label
              htmlFor="edit_dg_docs_file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">
                Upload more images and PDFs
              </span>
              <span className="text-xs text-muted-foreground">
                Supported: JPG, PNG, JPEG, WEBP, PDF
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="edit_dg_docs_file"
              type="file"
              multiple
              accept="image/*,.pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isBusy}
            />
          </div>

          {existingDocuments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Existing Documents</p>
              <div className="space-y-2">
                {existingDocuments.map((doc, index) => (
                  <div
                    key={`${doc.fileUrl}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 bg-muted/20"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {doc.fileType === "pdf" ? (
                        <FileText className="h-4 w-4 shrink-0 text-destructive" />
                      ) : (
                        <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {doc.fileName || `Document ${index + 1}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {doc.fileType}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newDocuments.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">New Documents to Upload</p>
              <div className="space-y-2">
                {newDocuments.map((doc, index) => (
                  <div
                    key={`${doc.file.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3 border-primary/20 bg-primary/5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {doc.fileType === "pdf" ? (
                        <FileText className="h-4 w-4 shrink-0 text-destructive" />
                      ) : (
                        <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {doc.file.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {doc.fileType}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => removeNewDocument(index)}
                      disabled={isBusy}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submitError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isBusy || newDocuments.length === 0}
          >
            {updatingDG ? "Uploading..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
