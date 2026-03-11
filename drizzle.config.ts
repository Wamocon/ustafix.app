import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  throw new Error(
    "SUPABASE_DB_URL is required for Drizzle CLI. Get it from Supabase Dashboard → Project Settings → Database → Connection string (URI)."
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
