import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
const connectionString = process.env.DATABASE_URL || "postgresql://u0_a333:kim@localhost:5432/pixel_pay";
const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });
