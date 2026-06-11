import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../components/home/Hero";
import api from "../lib/api";

interface Category {
  id: string; name: string; slug: string; description: string;
  parent_slug?: string;
}

const catIcons: Record<string, string> = {
  "pulsa": "📱",
  "data": "📶",
  "token-pln": "⚡",
  "voucher-game": "🎮",
  "tv-kabel": "📺",
  "e-money": "💳",
  "pgn": "🔥",
};

const steps = [
  { n: "01", t: "DAFTAR & TOP UP", d: "Buat akun dan isi saldo wallet kamu.", c: "text-px-primary" },
  { n: "02", t: "PILIH PRODUK", d: "Pilih kategori dan masukkan nomor tujuan.", c: "text-px-accent" },
  { n: "03", t: "SELESAI!", d: "Transaksi diproses otomatis. Instan!", c: "text-px-yellow" },
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/products/categories").then((r) => {
      if (r.data.success) {
        const mainCats = r.data.data.categories.filter((c: Category) => !c.parent_slug);
        setCategories(mainCats);
      }
    }).catch(() => {});
  }, []);

  const handleClick = (slug: string) => {
    nav(`/products?category=${slug}`);
  };

  return (
    <>
      <Hero />
      <div className="bg-px-surface border-y-[3px] border-px-border py-3 overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-marquee" style={{ width: "max-content" }}>
          {[0, 1].map((i) => (
            <span key={i} className="font-pixel text-[8px] text-px-muted tracking-wider">
              PIXEL PAY - PPOB 8-BIT PLATFORM - ISI PULSA, TOKEN PLN, VOUCHER GAME, E-WALLET, DAN LAGI - PIXEL PAY - PPOB 8-BIT PLATFORM - ISI PULSA, TOKEN PLN, VOUCHER GAME, E-WALLET, DAN LAGI -
            </span>
          ))}
        </div>
      </div>
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// PILIH QUEST</div>
            <h2 className="font-pixel text-xl text-px-white">KATEGORI PRODUK</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {categories.map((c) => (
              <div key={c.id} onClick={() => handleClick(c.slug)}
                className="bg-px-card border-[3px] border-px-border p-8 text-center cursor-pointer hover:border-px-primary hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-px-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
                <span className="text-4xl block mb-4">{catIcons[c.slug] || "📦"}</span>
                <div className="font-pixel text-[8px] text-px-white mb-2 tracking-wider">{c.name.toUpperCase()}</div>
                <div className="font-body text-lg text-px-muted">{c.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-px-surface border-y-[3px] border-px-border py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[{ v: "50K+", l: "TRANSAKSI" }, { v: "12K", l: "PENGGUNA" }, { v: "222", l: "PRODUK" }, { v: "99.8%", l: "SUCCESS RATE" }].map((s) => (
            <div key={s.l} className="text-center py-5">
              <div className="font-pixel text-2xl md:text-3xl text-px-primary glow mb-2">{s.v}</div>
              <div className="font-pixel text-[7px] text-px-muted tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// TUTORIAL</div>
            <h2 className="font-pixel text-xl text-px-white">CARA BERMAIN</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="bg-px-card border-[3px] border-px-border p-8 text-center">
                <div className={`font-pixel text-4xl mb-5 ${s.c}`}>{s.n}</div>
                <div className="font-pixel text-[9px] text-px-white mb-3 tracking-wider">{s.t}</div>
                <div className="font-body text-xl text-px-muted">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
