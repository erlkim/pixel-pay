import {
  pgTable, uuid, varchar, text, decimal, boolean, integer,
  timestamp, jsonb, index,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => categories.id).notNull(),
    sku: varchar("sku", { length: 200 }).notNull().unique(),
    buyerSkuCode: varchar("buyer_sku_code", { length: 200 }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    provider: varchar("provider", { length: 100 }).notNull(),
    brand: varchar("brand", { length: 100 }),
    type: varchar("type", { length: 50 }),
    basePrice: decimal("base_price", { precision: 15, scale: 2 }).notNull(),
    sellPrice: decimal("sell_price", { precision: 15, scale: 2 }).notNull(),
    profit: decimal("profit", { precision: 15, scale: 2 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    buyerProductStatus: boolean("buyer_product_status").default(true),
    sellerProductStatus: boolean("seller_product_status").default(true),
    stock: integer("stock").default(0),
    unlimitedStock: boolean("unlimited_stock").default(false),
    multi: boolean("multi").default(false),
    cutOffStart: varchar("cut_off_start", { length: 10 }),
    cutOffEnd: varchar("cut_off_end", { length: 10 }),
    meta: jsonb("meta"),
    syncedAt: timestamp("synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("products_category_idx").on(table.categoryId),
    index("products_sku_idx").on(table.sku),
    index("products_buyer_sku_idx").on(table.buyerSkuCode),
    index("products_active_idx").on(table.isActive),
    index("products_brand_idx").on(table.brand),
  ]
);
