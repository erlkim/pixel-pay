import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://u0_a333:kim@localhost:5432/pixel_pay",
  },
  verbose: true,
  strict: true,
});
