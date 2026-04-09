export interface UploadOptions {
  source_type?: string;
  toc_strategy?: string;
  embed_sections?: boolean;
  title?: string;
}

export async function prepareUpload(
  source: Buffer | ArrayBuffer | Blob | string,
  options?: UploadOptions
): Promise<FormData> {
  const formData = new FormData();

  if (typeof source === "string") {
    if (source.startsWith("http://") || source.startsWith("https://")) {
      formData.append("source_url", source);
    } else {
      // File path — Node.js only
      if (typeof globalThis.process !== "undefined") {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const buffer = fs.readFileSync(source);
        const filename = path.basename(source);
        formData.append("file", new Blob([buffer]), filename);
      } else {
        throw new Error(
          "File path sources are only supported in Node.js. " +
            "In the browser, pass a Blob or ArrayBuffer."
        );
      }
    }
  } else if (source instanceof Blob) {
    formData.append(
      "file",
      source,
      (source as File).name ?? "document"
    );
  } else {
    // Buffer or ArrayBuffer
    formData.append("file", new Blob([source]), "document");
  }

  if (options?.source_type)
    formData.append("source_type", options.source_type);
  if (options?.toc_strategy)
    formData.append("toc_strategy", options.toc_strategy);
  if (options?.embed_sections != null)
    formData.append("embed_sections", String(options.embed_sections));
  if (options?.title) formData.append("title", options.title);

  return formData;
}
