"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, Loader2, X } from "@/lib/icons";
import { toast } from "sonner";
import {
  CV_MAX_SIZE_BYTES,
  CV_ALLOWED_EXTENSIONS,
  isAllowedCvFile,
  getFileExtension,
} from "@/lib/referral-hires";

export interface UploadedCvInfo {
  objectPath: string;
  fileName: string;
  fileType: string;
}

interface CvUploaderProps {
  onChange: (cv: UploadedCvInfo | null) => void;
  /** Name of an existing CV the user can reuse instead of uploading. */
  className?: string;
}

const ACCEPT = CV_ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",");

export function CvUploader({ onChange, className }: CvUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [fileName, setFileName] = useState<string>("");

  async function handleFile(file: File) {
    if (!isAllowedCvFile(file.name, file.type)) {
      toast.error("Please upload a PDF, DOC, or DOCX file.");
      return;
    }
    if (file.size > CV_MAX_SIZE_BYTES) {
      toast.error("File is too large. Maximum size is 5 MB.");
      return;
    }

    setStatus("uploading");
    setFileName(file.name);
    try {
      // 1) ask the server for a signed upload URL
      const res = await fetch("/api/referral-hires/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not prepare upload");
      }
      const { uploadURL, objectPath } = await res.json();

      // 2) PUT the file directly to object storage
      const put = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed. Please try again.");

      setStatus("done");
      onChange({
        objectPath,
        fileName: file.name,
        fileType: file.type || `application/${getFileExtension(file.name)}`,
      });
      toast.success("CV uploaded.");
    } catch (e) {
      setStatus("idle");
      setFileName("");
      onChange(null);
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  function clearFile() {
    setStatus("idle");
    setFileName("");
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {status === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input bg-muted/30 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          <Upload className="text-muted-foreground" size={22} />
          <span className="text-sm font-medium">Upload your CV</span>
          <span className="text-xs text-muted-foreground">PDF, DOC, or DOCX • up to 5 MB</span>
        </button>
      )}

      {status === "uploading" && (
        <div className="flex items-center gap-2 rounded-lg border border-input px-4 py-3 text-sm">
          <Loader2 className="animate-spin text-primary" size={18} />
          <span className="truncate">Uploading {fileName}…</span>
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <CheckCircle className="text-emerald-600" size={18} />
          <FileText className="text-emerald-700" size={16} />
          <span className="flex-1 truncate text-emerald-800">{fileName}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-emerald-700 hover:text-emerald-900"
            onClick={clearFile}
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
