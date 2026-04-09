"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, session as sessionTable, apiKeys, usageLogs, usageDaily, playgroundSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateProfile(data: { name: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
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

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  if (!data.currentPassword || !data.newPassword) {
    return { error: "Both current and new passwords are required" };
  }

  if (data.newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }

  try {
    // Delegate password change to Better Auth
    const res = await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
    });

    if (!res) {
      return { error: "Failed to change password. Please verify your current password." };
    }

    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to change password. Please verify your current password.",
    };
  }
}

export async function deleteAccount() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  try {
    // Delete associated data in order (respecting foreign key constraints)
    // Usage logs reference api_keys and user
    await db.delete(usageLogs).where(eq(usageLogs.userId, userId));

    // Daily aggregates
    await db.delete(usageDaily).where(eq(usageDaily.userId, userId));

    // Playground sessions
    await db
      .delete(playgroundSessions)
      .where(eq(playgroundSessions.userId, userId));

    // API keys
    await db.delete(apiKeys).where(eq(apiKeys.userId, userId));

    // Sessions (Better Auth)
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId));

    // Finally delete the user (account table cascades)
    await db.delete(user).where(eq(user.id, userId));

    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to delete account",
    };
  }
}
