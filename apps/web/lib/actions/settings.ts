"use server";

import { getServerSession } from "@/lib/server-auth";
import { db } from "@/db";
import {
  user,
  session as sessionTable,
  apiKeys,
  usageLogs,
  usageDaily,
  playgroundSessions,
} from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateProfile(data: { name: string }) {
  const session = await getServerSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  if (!data.name || data.name.trim().length === 0) {
    return { error: "Name is required" };
  }

  try {
    await db
      .update(user)
      .set({
        name: data.name.trim(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}

export async function changePassword(_data: {
  currentPassword: string;
  newPassword: string;
}) {
  // Path A migration: password change has not been re-implemented on
  // the control plane yet. Surface a clear error so the settings UI
  // shows it instead of silently 500-ing.
  const session = await getServerSession();
  if (!session) {
    return { error: "Unauthorized" };
  }
  return {
    error:
      "Password change is temporarily unavailable while we move auth to the new backend. Please use the forgot-password flow.",
  };
}

export async function deleteAccount() {
  const session = await getServerSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  try {
    // Delete app-side data keyed off the local user.id (the CP holds
    // the canonical user row but the dashboard's per-user features
    // live here and need cleaning up too).
    await db.delete(usageLogs).where(eq(usageLogs.userId, userId));
    await db.delete(usageDaily).where(eq(usageDaily.userId, userId));
    await db
      .delete(playgroundSessions)
      .where(eq(playgroundSessions.userId, userId));
    await db.delete(apiKeys).where(eq(apiKeys.userId, userId));
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
    await db.delete(user).where(eq(user.id, userId));

    // TODO: also call the CP to delete the canonical user record once
    // /admin/v1/auth/me DELETE exists. For now the local cleanup is
    // enough to detach the user from billing/usage; the CP user can
    // be removed manually until the endpoint lands.
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to delete account",
    };
  }
}
