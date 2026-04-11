"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  FileUp,
  Link2,
  X,
  FileText,
  Loader2,
} from "lucide-react";

export default function UploadDocumentPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [tocStrategy, setTocStrategy] = useState("extract");
  const [embedSections, setEmbedSections] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUrl("");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUrl("");
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      let res: Response;

      if (selectedFile) {
        // File upload via multipart/form-data
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (title.trim()) formData.append("title", title.trim());
        formData.append("toc_strategy", tocStrategy);
        if (embedSections) formData.append("embed_sections", "true");

        res = await fetch("/api/dashboard/documents", {
          method: "POST",
          body: formData,
        });
      } else if (url.trim()) {
        // URL-based ingestion via JSON
        res = await fetch("/api/dashboard/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: url.trim(),
            title: title.trim() || undefined,
            toc_strategy: tocStrategy,
            embed_sections: embedSections,
          }),
        });
      } else {
        setIsUploading(false);
        return;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setUploadError(errBody?.error || `Upload failed: ${res.status}`);
        setIsUploading(false);
        return;
      }

      const data = await res.json();
      // Redirect to the new document page
      const newDocId = data.doc_id || data.id;
      if (newDocId) {
        router.push(`/dashboard/documents/${newDocId}`);
      } else {
        router.push("/dashboard/documents");
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
      setIsUploading(false);
    }
  };

  const canUpload = selectedFile || url.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/documents">
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Upload Document
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a file or provide a URL to ingest a new document.
        </p>
      </div>

      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source</CardTitle>
          <CardDescription>
            Drag and drop a file or enter a URL to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag and drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            {selectedFile ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <FileUp className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  Drag and drop your file here
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF, DOCX, or TXT up to 50MB
                </p>
                <label htmlFor="file-upload">
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <span>Browse Files</span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileSelect}
                  />
                </label>
              </>
            )}
          </div>

          <div className="relative flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              or
            </span>
            <Separator className="flex-1" />
          </div>

          {/* URL input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5" />
              URL
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/document.pdf"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (e.target.value) setSelectedFile(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Enter a direct link to a PDF, web page, or document
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Options</CardTitle>
          <CardDescription>
            Configure how the document should be processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title (optional)</Label>
            <Input
              id="title"
              placeholder="Auto-detected from document"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toc-strategy">ToC Strategy</Label>
            <Select value={tocStrategy} onValueChange={setTocStrategy}>
              <SelectTrigger id="toc-strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extract">
                  Extract - Use existing table of contents
                </SelectItem>
                <SelectItem value="generate">
                  Generate - AI-generated structure
                </SelectItem>
                <SelectItem value="hybrid">
                  Hybrid - Extract and enhance with AI
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how the document&apos;s structure should be determined
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="embed-sections" className="cursor-pointer">
                Embed Sections
              </Label>
              <p className="text-xs text-muted-foreground">
                Generate embeddings for each section after processing
              </p>
            </div>
            <Switch
              id="embed-sections"
              checked={embedSections}
              onCheckedChange={setEmbedSections}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {uploadError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{uploadError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard/documents">Cancel</Link>
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!canUpload || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
