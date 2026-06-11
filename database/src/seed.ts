import { db } from "./client";
import { categories } from "./schema";

async function seed() {
  console.log("Seeding database...");
  const data = [
    { name: "Pulsa & Data", slug: "pulsa-data", icon: "mobile", sortOrder: 1, digiflazzCmd: "pulsa", description: "Isi ulang pulsa dan paket data" },
    { name: "Token PLN", slug: "token-pln", icon: "zap", sortOrder: 2, digiflazzCmd: "pln", description: "Token listrik PLN prabayar" },
    { name: "Pascabayar", slug: "pascabayar", icon: "file-text", sortOrder: 3, digiflazzCmd: "pascabayar", description: "Bayar tagihan pascabayar" },
    { name: "PDAM", slug: "pdam", icon: "droplets", sortOrder: 4, digiflazzCmd: "pdam", description: "Bayar tagihan air PDAM" },
    { name: "BPJS", slug: "bpjs", icon: "heart-pulse", sortOrder: 5, digiflazzCmd: "bpjs", description: "Iuran BPJS Kesehatan" },
    { name: "Voucher Game", slug: "voucher-game", icon: "gamepad-2", sortOrder: 6, digiflazzCmd: "game", description: "Diamond ML, UC PUBG" },
    { name: "TV Kabel", slug: "tv-kabel", icon: "tv", sortOrder: 7, digiflazzCmd: "tv", description: "Indihome, MNC Play" },
    { name: "E-Money", slug: "e-money", icon: "credit-card", sortOrder: 8, digiflazzCmd: "emoney", description: "Top up e-wallet" },
    { name: "Telkom", slug: "telkom", icon: "phone", sortOrder: 9, digiflazzCmd: "telkom", description: "Tagihan Telkom" },
    { name: "PGN Gas", slug: "pgn", icon: "flame", sortOrder: 10, digiflazzCmd: "pgn", description: "Tagihan gas PGN" },
  ];
  for (const cat of data) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }
  console.log("Seeding complete!");
  process.exit(0);
}
seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
