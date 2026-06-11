import {
  pgTable, uuid, varchar, text, integer, boolean, timestamp, index,
} from "drizzle-orm/pg-core";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    icon: varchar("icon", { length: 10 }).default("package"),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    digiflazzCmd: varchar("digiflazz_cmd", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("categories_slug_idx").on(table.slug),
    index("categories_sort_idx").on(table.sortOrder),
  ]
);
