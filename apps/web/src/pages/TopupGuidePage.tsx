import { Link } from "react-router-dom";

const steps = [
  {
    n: "01",
    title: "LOGIN KE AKUN",
    desc: "Masuk ke akun Pixel Pay kamu. Belum punya akun? Daftar terlebih dahulu.",
    detail: [
      "Klik tombol LOGIN di pojok kanan atas",
      "Masukkan email dan password",
      "Klik LOGIN",
      "Belum punya akun? Klik BELUM PUNYA AKUN? REGISTER",
    ],
    icon: "🔑",
  },
  {
    n: "02",
    title: "BUKA HALAMAN WALLET",
    desc: "Masuk ke halaman Wallet untuk melakukan top up saldo.",
    detail: [
      "Klik menu WALLET di navigasi atas",
      "Atau klik kartu SALDO di dashboard",
      "Kamu akan melihat saldo saat ini",
    ],
    icon: "💳",
  },
  {
    n: "03",
    title: "PILIH NOMINAL",
    desc: "Pilih nominal top up yang tersedia atau masukkan nominal manual.",
    detail: [
      "Klik tombol nominal cepat: 10K, 25K, 50K, 100K, 250K, 500K",
      "Atau masukkan nominal manual di kolom input",
      "Minimal top up: Rp 1.000",
    ],
    icon: "💰",
  },
  {
    n: "04",
    title: "KLIK TOP UP",
    desc: "Tekan tombol TOP UP dan saldo akan langsung masuk.",
    detail: [
      "Klik tombol TOP UP",
      "Tunggu beberapa saat",
      "Saldo akan bertambah otomatis",
      "Riwayat top up muncul di bawah",
    ],
    icon: "⚡",
  },
  {
    n: "05",
    title: "SIAP BERTRANSAKSI!",
    desc: "Saldo sudah masuk. Sekarang kamu bisa beli produk apapun.",
    detail: [
      "Pulsa & Paket Data",
      "Token PLN",
      "Voucher Game (ML, FF, PUBG)",
      "E-Wallet (GoPay, DANA, OVO)",
      "Dan masih banyak lagi!",
    ],
    icon: "🎮",
  },
];

export default function TopupGuidePage() {
  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// TUTORIAL</div>
          <h2 className="font-pixel text-xl text-px-white">CARA TOP UP</h2>
          <div className="font-pixel text-[7px] text-px-muted mt-2">IKUTI LANGKAH-LANGKAH BERIKUT</div>
        </div>

        <div className="space-y-6">
          {steps.map((s, i) => (
            <div key={i} className="bg-px-card border-[3px] border-px-border p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-px-primary" />
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 border-[3px] border-px-primary flex flex-col items-center justify-center">
                    <span className="text-2xl">{s.icon}</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="font-pixel text-[10px] text-px-primary">{s.n}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-pixel text-[10px] text-px-white mb-2 tracking-wider">{s.title}</h3>
                  <p className="font-body text-lg text-px-muted mb-4">{s.desc}</p>
                  <ul className="space-y-2">
                    {s.detail.map((d, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <span className="font-pixel text-[6px] text-px-primary mt-1">▸</span>
                        <span className="font-body text-base text-px-white">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-px-card border-[4px] border-px-yellow p-8">
          <div className="font-pixel text-[10px] text-px-yellow mb-3 glow-y">SIAP TOP UP?</div>
          <div className="font-body text-lg text-px-muted mb-4">Saldo akan langsung masuk ke akun kamu</div>
          <Link to="/wallet"
            className="inline-block font-pixel text-[9px] bg-px-primary border-4 border-px-primary text-px-bg px-8 py-3 tracking-[0.2em] hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] hover:-translate-y-0.5 transition-all">
            TOP UP SEKARANG
          </Link>
        </div>
      </div>
    </section>
  );
}
