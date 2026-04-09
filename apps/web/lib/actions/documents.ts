"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function uploadDocument(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/documents`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.error?.message || `Upload failed: ${res.status}` };
    }

    const data = await res.json();
    revalidatePath("/dashboard/documents");
    return { success: true, data };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to upload document",
    };
  }
}

export async function deleteDocument(docId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/dashboard/documents/${docId}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.error?.message || `Delete failed: ${res.status}` };
    }

    revalidatePath("/dashboard/documents");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete document",
    };
  }
}
