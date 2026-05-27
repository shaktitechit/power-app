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
  useGetUtilityAccountByIdQuery,
  useUpdateUtilityAccountMutation,
} from "@/store/slices/electrical-audit/utilityApiSlice";
import { toastHandler } from "@/lib/toast";

interface EditUtilityDocumentsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  utilityAccountId: string;
}

type NewUtilityDocument = {
  file: File;
  preview?: string;
  fileType: "image" | "pdf";
};

type ExistingUtilityDocument = {
  _id?: string;
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
};

export function EditUtilityDocumentsForm({
  open,
  onOpenChange,
  onComplete,
  utilityAccountId,
}: EditUtilityDocumentsFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: utilityResponse, isLoading: utilityLoading } =
    useGetUtilityAccountByIdQuery(utilityAccountId, {
      skip: !utilityAccountId || !open,
    });

  const [updateUtilityAccount, { isLoading: updatingUtility }] =
    useUpdateUtilityAccountMutation();

  const utilityAccount = utilityResponse?.data;

  const [existingDocuments, setExistingDocuments] = useState<
    ExistingUtilityDocument[]
  >([]);
  const [newDocuments, setNewDocuments] = useState<NewUtilityDocument[]>([]);
  const [removedExistingDocuments, setRemovedExistingDocuments] = useState<
    string[]
  >([]);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!utilityAccount || !open) return;

    setExistingDocuments(utilityAccount.documents || []);
    setNewDocuments([]);
    setRemovedExistingDocuments([]);
    setSubmitError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [utilityAccount, open]);

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

    const uploadedDocs: NewUtilityDocument[] = files
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
      .filter(Boolean) as NewUtilityDocument[];

    setNewDocuments((prev) => [...prev, ...uploadedDocs]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeExistingDocument = (index: number) => {
    setExistingDocuments((prev) => {
      const doc = prev[index];
      if (doc?._id) {
        setRemovedExistingDocuments((ids) => [...ids, doc._id as string]);
      }
      return prev.filter((_, i) => i !== index);
    });
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
    setRemovedExistingDocuments([]);
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
    if (!utilityAccountId) return;

    try {
      await toastHandler({
        action: () =>
          updateUtilityAccount({
            id: utilityAccountId,
            documents: newDocuments.map((doc) => doc.file),
            removed_document_ids: removedExistingDocuments,
          }).unwrap(),
        loading: "Updating documents...",
        success: "Documents updated successfully",
      });

      onComplete();
      handleClose();
    } catch (error) {
      console.error("Failed to update utility documents:", error);
    }
  };

  const isBusy = updatingUtility || utilityLoading;

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
          <DialogTitle>Add / Edit Documents & Images</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-xl border border-dashed p-6">
            <label
              htmlFor="edit_utility_docs_file"
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
              id="edit_utility_docs_file"
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => removeExistingDocument(index)}
                      disabled={isBusy}
                    >
                      <X className="h-4 w-4" />
                    </Button>
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
            disabled={isBusy || (newDocuments.length === 0 && removedExistingDocuments.length === 0)}
          >
            {updatingUtility ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
