import { Link } from "react-router-dom";
const colors = ["#00ff88", "#ff2e63", "#08d9d6", "#ffcc00"];
const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: (i * 5.1) % 100,
  size: 2 + (i % 3) * 2,
  color: colors[i % 4],
  duration: 8 + (i % 5) * 3,
  delay: (i % 7) * 1.4,
}));
export default function Hero() {
  return (
    <section className="relative py-40 text-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute animate-float opacity-0"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="inline-block font-pixel text-[7px] text-px-accent border-[2px] border-px-accent px-5 py-2 mb-8 tracking-[3px] animate-fadeUp">
          // PPOB TERLENGKAP 2024
        </div>
        <h1
          className="font-pixel text-3xl md:text-5xl text-px-white leading-[1.4] mb-4 animate-fadeUp"
          style={{
            animationDelay: "100ms",
            opacity: 0,
            textShadow: "4px 4px 0 #00ff88, 8px 8px 0 rgba(0,255,136,0.15)",
          }}
        >
          BAYAR <span className="text-px-primary">TAGIHAN</span>
          <br />
          ALA <span className="text-px-secondary">RETRO!</span>
        </h1>
        <p
          className="font-body text-2xl md:text-3xl text-px-muted mb-12 animate-fadeUp"
          style={{ animationDelay: "200ms", opacity: 0 }}
        >
          Pulsa, Listrik, PDAM, BPJS, Game - semua dalam genggaman 8-bit
          <span className="inline-block w-3 h-8 bg-px-primary ml-1 align-middle animate-blink" />
        </p>
        <div
          className="flex gap-5 justify-center animate-fadeUp"
          style={{ animationDelay: "300ms", opacity: 0 }}
        >
          <Link
            to="/transaction"
            className="font-pixel text-[11px] px-10 py-4 bg-px-primary border-4 border-px-primary text-px-bg tracking-[0.2em] hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            MULAI BAYAR
          </Link>
          <Link
            to="/products"
            className="font-pixel text-[11px] px-10 py-4 border-4 border-px-yellow text-px-yellow tracking-[0.2em] hover:bg-px-yellow hover:text-px-bg hover:shadow-[0_0_40px_rgba(255,204,0,0.3)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            LIHAT KATEGORI
          </Link>
        </div>
      </div>
    </section>
  );
}
