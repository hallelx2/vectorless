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
import type {
  BetterAuthOptions,
  DBAdapter,
  DBAdapterInstance,
  Where,
} from "better-auth";

import { controlPlane } from "./control-plane";

// Translate Better Auth's Where[] (which may include OR connectors and
// various operators we don't support yet) into the control plane's
// simpler `[{field, value, operator}]` shape.
function toCpWhere(where: Where[] | undefined) {
  if (!where) return [];
  return where.map((w) => ({
    field: w.field,
    value: w.value,
    operator: w.operator,
  }));
}

/**
 * Returns a Better Auth `DBAdapterInstance` (factory) that calls the
 * control plane over HTTP. Pass into `betterAuth({ database: ... })`.
 */
export function controlPlaneAdapter(): DBAdapterInstance<BetterAuthOptions> {
  return (_options: BetterAuthOptions): DBAdapter<BetterAuthOptions> => ({
    id: "control-plane",

    async create({ model, data }) {
      const row = await controlPlane.identity.create<Record<string, unknown>>(
        model,
        data as Record<string, unknown>,
      );
      return row as never;
    },

    async findOne({ model, where }) {
      const row = await controlPlane.identity.findOne<Record<string, unknown>>(
        model,
        toCpWhere(where),
      );
      return (row ?? null) as never;
    },

    async findMany({ model, where, limit, offset, sortBy }) {
      const rows = await controlPlane.identity.findMany<
        Record<string, unknown>
      >(model, toCpWhere(where), {
        limit,
        offset,
        // Better Auth passes a single sort spec; the control plane
        // accepts an array.
        sortBy: sortBy ? [sortBy] : undefined,
      });
      return (rows ?? []) as never;
    },

    async count({ model, where }) {
      const result = await controlPlane.identity.count(
        model,
        toCpWhere(where),
      );
      return result.count;
    },

    async update({ model, where, update }) {
      const row = await controlPlane.identity.update<Record<string, unknown>>(
        model,
        toCpWhere(where),
        update,
      );
      return (row ?? null) as never;
    },

    async updateMany({ model, where, update }) {
      const result = await controlPlane.identity.updateMany(
        model,
        toCpWhere(where),
        update,
      );
      return result.count;
    },

    async delete({ model, where }) {
      await controlPlane.identity.delete(model, toCpWhere(where));
    },

    async deleteMany({ model, where }) {
      const result = await controlPlane.identity.deleteMany(
        model,
        toCpWhere(where),
      );
      return result.count;
    },

    /**
     * Transactions are not supported over HTTP. Run the callback with
     * the same adapter — operations execute sequentially without
     * isolation. This matches Better Auth's documented fallback
     * (the docs note: "if the adapter doesn't support transactions,
     * operations will be executed sequentially").
     */
    async transaction(callback) {
      const adapter = controlPlaneAdapter()(_options);
      // The adapter we pass into the callback omits `transaction` itself
      // (DBTransactionAdapter type). Cast accordingly.
      return callback(adapter as never);
    },
  });
}
