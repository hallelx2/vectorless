/**
 * Custom Better Auth adapter that delegates all CRUD to the control
 * plane via HTTP, instead of talking to a local database.
 *
 * Better Auth's adapter contract is generic CRUD on 4 models:
 * `user`, `session`, `account`, `verification`. We map each method
 * to a control-plane endpoint under /admin/internal/identity/*.
 *
 * Why: the control plane is the single source of truth for user state.
 * Apps/web ships without a database; everything goes through the wire.
 */
import type { Adapter, BetterAuthOptions } from "better-auth";

import { controlPlane } from "./control-plane";

interface WhereClause {
  field: string;
  value: unknown;
  operator?: string;
  connector?: "AND" | "OR";
}

interface SortBy {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Returns a Better Auth Adapter that calls the control plane over HTTP.
 *
 * Pass into `betterAuth({ database: controlPlaneAdapter() })`.
 */
export function controlPlaneAdapter(
  _options?: BetterAuthOptions,
): Adapter {
  // Translate Better Auth's WhereClause[] (which may include OR
  // connectors and various operators we don't support yet) into the
  // control plane's simpler `[{field, value, operator}]` shape.
  const toCpWhere = (where: WhereClause[] | undefined) => {
    if (!where) return [];
    return where.map((w) => ({
      field: w.field,
      value: w.value,
      operator: w.operator,
    }));
  };

  return {
    id: "control-plane",

    async create({ model, data }) {
      // Better Auth occasionally passes `id` even when the schema
      // would auto-generate one — pass through; the control plane's
      // SQL builder accepts it.
      const row = await controlPlane.identity.create<Record<string, unknown>>(
        model,
        data as Record<string, unknown>,
      );
      return row as never;
    },

    async findOne({ model, where }) {
      const row = await controlPlane.identity.findOne<Record<string, unknown>>(
        model,
        toCpWhere(where as WhereClause[]),
      );
      // The control plane returns `null` for misses; Better Auth
      // expects undefined or null — both work.
      return (row ?? null) as never;
    },

    async findMany({ model, where, limit, offset, sortBy }) {
      const rows = await controlPlane.identity.findMany<
        Record<string, unknown>
      >(model, toCpWhere(where as WhereClause[]), {
        limit,
        offset,
        sortBy: sortBy as SortBy[] | undefined,
      });
      return (rows ?? []) as never;
    },

    async update({ model, where, update }) {
      const row = await controlPlane.identity.update<Record<string, unknown>>(
        model,
        toCpWhere(where as WhereClause[]),
        update as Record<string, unknown>,
      );
      return (row ?? null) as never;
    },

    async updateMany({ model, where, update }) {
      const result = await controlPlane.identity.updateMany(
        model,
        toCpWhere(where as WhereClause[]),
        update as Record<string, unknown>,
      );
      return result.count;
    },

    async delete({ model, where }) {
      await controlPlane.identity.delete(model, toCpWhere(where as WhereClause[]));
    },

    async deleteMany({ model, where }) {
      const result = await controlPlane.identity.deleteMany(
        model,
        toCpWhere(where as WhereClause[]),
      );
      return result.count;
    },

    async count({ model, where }) {
      const result = await controlPlane.identity.count(
        model,
        toCpWhere(where as WhereClause[]),
      );
      return result.count;
    },
  };
}
