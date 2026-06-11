import {
  pgTable, uuid, decimal, timestamp, varchar, text, pgEnum, index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const topupStatusEnum = pgEnum("topup_status", [
  "pending", "success", "failed", "expired",
]);

export const walletTopups = pgTable(
  "wallet_topups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletId: uuid("wallet_id").references(() => wallets.id).notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    method: varchar("method", { length: 50 }).notNull(),
    status: topupStatusEnum("status").default("pending").notNull(),
    externalRef: varchar("external_ref", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("topups_wallet_idx").on(table.walletId),
    index("topups_status_idx").on(table.status),
  ]
);

export const balanceLogs = pgTable("balance_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletId: uuid("wallet_id").references(() => wallets.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  description: text("description").notNull(),
  refId: varchar("ref_id", { length: 100 }),
  balanceBefore: decimal("balance_before", { precision: 15, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
