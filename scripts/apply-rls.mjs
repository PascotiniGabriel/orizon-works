// Script para aplicar RLS policies no Supabase
// Uso: node scripts/apply-rls.mjs

import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env.local") });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não configurada em .env.local");

const sql = postgres(url, { max: 1 });

try {
  const sqlContent = readFileSync(resolve(__dirname, "setup-rls.sql"), "utf-8");
  console.log("Aplicando RLS policies e trigger...");
  await sql.unsafe(sqlContent);
  console.log("✓ RLS configurado com sucesso!");
} catch (err) {
  console.error("✗ Erro:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
