import {
  pgTable, uuid, varchar, text, decimal, jsonb, timestamp,
  pgEnum, integer, index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { products } from "./products";

export const txStatusEnum = pgEnum("tx_status", [
  "pending", "processing", "success", "failed", "refunded", "expired",
]);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id).notNull(),
    productId: uuid("product_id").references(() => products.id).notNull(),
    refId: varchar("ref_id", { length: 100 }).notNull().unique(),
    customerNumber: varchar("customer_number", { length: 50 }).notNull(),
    basePrice: decimal("base_price", { precision: 15, scale: 2 }).notNull(),
    sellPrice: decimal("sell_price", { precision: 15, scale: 2 }).notNull(),
    profit: decimal("profit", { precision: 15, scale: 2 }).notNull(),
    status: txStatusEnum("status").default("pending").notNull(),
    digiflazzRefId: varchar("digiflazz_ref_id", { length: 200 }),
    digiflazzStatus: varchar("digiflazz_status", { length: 50 }),
    digiflazzMessage: text("digiflazz_message"),
    serialNumber: text("sn"),
    responsePayload: jsonb("response_payload"),
    retryCount: integer("retry_count").default(0),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("tx_user_idx").on(table.userId),
    index("tx_status_idx").on(table.status),
    index("tx_ref_idx").on(table.refId),
    index("tx_created_idx").on(table.createdAt),
    index("tx_product_idx").on(table.productId),
  ]
);
