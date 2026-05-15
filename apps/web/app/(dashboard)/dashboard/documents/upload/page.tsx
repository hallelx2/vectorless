"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  FileUp,
  Link2,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/PageHeader";

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
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUrl("");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setUrl("");
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      // Upload goes straight to the control plane with the user's
      // session cookie — Vercel's serverless functions cap request
      // bodies at 4.5 MB, but Cloud Run handles up to 32 MB. The CP
      // needs to know which org to attribute the doc to, so we look
      // up the user's first org first.
      const cpBase =
        process.env.NEXT_PUBLIC_API_URL || "https://api.vectorless.store";

      const orgsRes = await fetch(`${cpBase}/admin/v1/orgs`, {
        credentials: "include",
      });
      if (!orgsRes.ok) {
        setUploadError(
          orgsRes.status === 401
            ? "Your session expired. Please sign in again."
            : `Couldn't load your orgs (${orgsRes.status}).`,
        );
        setIsUploading(false);
        return;
      }
      const orgs = (await orgsRes.json()) as Array<{ id: string }> | null;
      const orgId = orgs?.[0]?.id;
      if (!orgId) {
        setUploadError(
          "No org found on your account. Create one before uploading documents.",
        );
        setIsUploading(false);
        return;
      }

      let res: Response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (title.trim()) formData.append("title", title.trim());
        formData.append("toc_strategy", tocStrategy);
        if (embedSections) formData.append("embed_sections", "true");
        res = await fetch(`${cpBase}/v1/documents`, {
          method: "POST",
          credentials: "include",
          headers: { "X-Vectorless-Org": orgId },
          body: formData,
        });
      } else if (url.trim()) {
        res = await fetch(`${cpBase}/v1/documents`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Vectorless-Org": orgId,
          },
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
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string | { message?: string };
        };
        const msg =
          typeof errBody.error === "string"
            ? errBody.error
            : errBody.error?.message;
        setUploadError(msg || `Upload failed: ${res.status}`);
        setIsUploading(false);
        return;
      }

      const data = (await res.json()) as {
        doc_id?: string;
        id?: string;
        document_id?: string;
      };
      const newDocId = data.doc_id || data.id || data.document_id;
      router.push(
        newDocId
          ? `/dashboard/documents/${newDocId}`
          : "/dashboard/documents",
      );
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
      );
      setIsUploading(false);
    }
  };

  const canUpload = !!selectedFile || url.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <div>
        <Button variant="ghost" size="sm" className="h-7 -ml-2 mb-2 text-muted-foreground text-[12.5px]" asChild>
          <Link href="/dashboard/documents">
            <ArrowLeft className="size-3" />
            Documents
          </Link>
        </Button>
        <PageHeader
          eyebrow="New document"
          title="Add a source"
          description="Upload a file or point at a URL. We'll structure it into a navigable map your agent can query."
        />
      </div>

      {/* Source picker (Tabs) */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-[15px]">Source</CardTitle>
          <CardDescription className="text-[12.5px]">
            Drop a file or paste a public URL. PDFs, DOCX, TXT supported up to 50 MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger value="file" className="text-[13px]">
                <FileUp className="size-3.5" />
                Upload file
              </TabsTrigger>
              <TabsTrigger value="url" className="text-[13px]">
                <Link2 className="size-3.5" />
                From URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-5">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-xl border border-dashed transition-colors p-10 ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : selectedFile
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/40"
                }`}
              >
                {selectedFile ? (
                  <div className="flex w-full items-center gap-3 max-w-sm">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {selectedFile.name}
                      </p>
                      <p className="font-data text-[11px] text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · ready to upload
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="inline-flex size-12 items-center justify-center rounded-full border border-border bg-background mb-4">
                      <FileUp className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-[14px] font-medium text-foreground">
                      Drop a file here
                    </p>
                    <p className="font-data text-[11px] text-muted-foreground mt-1">
                      PDF · DOCX · TXT · up to 50 MB
                    </p>
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="sm" className="mt-5 h-8" asChild>
                        <span>Browse files</span>
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
            </TabsContent>

            <TabsContent value="url" className="mt-5 space-y-2">
              <Label htmlFor="url" className="text-[13px]">Public URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/whitepaper.pdf"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (e.target.value) setSelectedFile(null);
                }}
              />
              <p className="text-[12px] text-muted-foreground">
                Direct PDF link, marked-up HTML page, or raw text URL.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Options */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-[15px]">Processing options</CardTitle>
          <CardDescription className="text-[12.5px]">
            How should we structure this document?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-[13px]">Title <span className="font-data text-[10px] text-muted-foreground uppercase tracking-[0.18em] ml-1">optional</span></Label>
            <Input
              id="title"
              placeholder="Auto-detected from document"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="toc-strategy" className="text-[13px]">Table of contents strategy</Label>
            <Select value={tocStrategy} onValueChange={setTocStrategy}>
              <SelectTrigger id="toc-strategy" className="text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extract">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium">Extract</span>
                    <span className="text-[11px] text-muted-foreground">Use the document&apos;s existing headings</span>
                  </div>
                </SelectItem>
                <SelectItem value="generate">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium">Generate</span>
                    <span className="text-[11px] text-muted-foreground">AI-built structure for unstructured docs</span>
                  </div>
                </SelectItem>
                <SelectItem value="hybrid">
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="font-medium">Hybrid</span>
                    <span className="text-[11px] text-muted-foreground">Extract then enhance with AI</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start justify-between rounded-lg border border-border/60 p-4 gap-4">
            <div className="space-y-1 flex-1">
              <Label htmlFor="embed-sections" className="cursor-pointer text-[13px]">
                Generate fallback embeddings
              </Label>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Vectorless doesn&apos;t need them, but keep the option open for hybrid retrieval on noisy sections.
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

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="font-data text-[11px] text-muted-foreground">
          Processing takes ~10s per 100 pages
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9" asChild>
            <Link href="/dashboard/documents">Cancel</Link>
          </Button>
          <Button
            size="sm"
            className="h-9"
            onClick={handleUpload}
            disabled={!canUpload || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                Upload document
                <ArrowRight className="size-3" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
