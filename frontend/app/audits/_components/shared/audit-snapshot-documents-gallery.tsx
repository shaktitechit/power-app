"use client";

import { useState } from "react";
import { Download, FileIcon, FileText, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuditExplorerExpanded } from "../audit-snapshot-explorer-layout-context";
import { cn } from "@/lib/utils";

type DocumentRecord = {
  fileUrl: string;
  fileType: "image" | "pdf" | string;
  fileName?: string;
  uploadedAt?: string;
  utility_account_number?: string;
  sourceType?: string;
};

export function AuditSnapshotDocumentsGallery({
  documents,
}: {
  documents: DocumentRecord[];
}) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const isExpanded = useAuditExplorerExpanded();

  if (!documents || documents.length === 0) {
    return (
      <div className="flex min-h-[min(50vh,24rem)] flex-1 items-center justify-center rounded-lg border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground sm:px-4">
        No documents uploaded for this dataset.
      </div>
    );
  }

  // Group by utility account number and source type
  const groupedDocs = documents.reduce((acc, doc) => {
    let key = "";
    if (doc.utility_account_number) {
      key = `A/C: ${doc.utility_account_number}`;
    } else {
      key = "Facility Documents";
    }
    if (doc.sourceType && doc.sourceType !== "Utility Account") {
      key += ` • ${doc.sourceType}`;
    }

    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {} as Record<string, DocumentRecord[]>);

  return (
    <>
      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto",
          !isExpanded && "max-h-[min(90vh,30rem)]"
        )}
      >
        <div className="p-4 sm:p-6 space-y-8">
          {Object.entries(groupedDocs).map(([groupName, docs]) => (
            <div key={groupName} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground border-b border-border/60 pb-2">
                {groupName}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {docs.map((doc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card/50 transition-all hover:bg-card hover:shadow-sm text-left"
                  >
                    <div className="relative flex aspect-video w-full items-center justify-center bg-muted/40">
                      {doc.fileType === "image" ? (
                        <img
                          src={doc.fileUrl}
                          alt={doc.fileName || "Document"}
                          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                          loading="lazy"
                        />
                      ) : doc.fileType === "pdf" ? (
                        <FileText className="size-10 text-red-500/80 transition-transform group-hover:scale-110" />
                      ) : (
                        <FileIcon className="size-10 text-primary/60 transition-transform group-hover:scale-110" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-3 w-full">
                      <div>
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                          {doc.fileName || `Document ${idx + 1}`}
                        </p>
                      </div>
                      {doc.uploadedAt && (
                        <p className="mt-3 text-[10px] text-muted-foreground">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent
          className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-xl z-[100000]"
          overlayClassName="z-[100000]"
        >
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base truncate pr-4 text-left">
                {selectedDoc?.fileName || "Document Viewer"}
              </DialogTitle>
              <Button asChild size="sm" variant="secondary" className="gap-2 shrink-0">
                <a href={selectedDoc?.fileUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="size-4" />
                  Download
                </a>
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/10 relative flex items-center justify-center p-4">
            {selectedDoc?.fileType === "image" ? (
              <img
                src={selectedDoc.fileUrl}
                alt={selectedDoc.fileName || "Document"}
                className="max-w-full max-h-full object-contain rounded-md"
              />
            ) : selectedDoc?.fileType === "pdf" ? (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedDoc?.fileUrl || "")}&embedded=true`}
                className="w-full h-full rounded-md border-0 bg-white"
                title={selectedDoc.fileName || "PDF Document"}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <FileIcon className="size-16 opacity-50" />
                <p>No preview available for this file type.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
