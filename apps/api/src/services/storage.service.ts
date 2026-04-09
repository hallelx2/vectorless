import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "../config.js";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.R2_ACCESS_KEY_ID,
    secretAccessKey: config.R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return config.R2_PUBLIC_URL
    ? `${config.R2_PUBLIC_URL}/${key}`
    : `r2://${config.R2_BUCKET_NAME}/${key}`;
}

export async function downloadFile(key: string): Promise<Buffer> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: key,
    })
  );

  const stream = response.Body;
  if (!stream) throw new Error(`File not found: ${key}`);

  const chunks: Uint8Array[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: key,
    })
  );
}

export function getStoragePath(projectId: string, docId: string, filename: string): string {
  return `${projectId}/${docId}/${filename}`;
}
