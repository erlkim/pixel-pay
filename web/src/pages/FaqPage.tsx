import { useState } from "react";
import { Link } from "react-router-dom";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  { q: "Apa itu Pixel Pay?", a: "Pixel Pay adalah platform PPOB (Payment Point Online Bank) dengan tema 8-bit retro. Kamu bisa beli pulsa, token PLN, voucher game, top up e-wallet, dan berbagai produk digital lainnya." },
  { q: "Bagaimana cara mendaftar?", a: "Klik tombol LOGIN di pojok kanan atas, lalu pilih REGISTER. Isi nama lengkap, nomor HP, email, dan password. Setelah itu kamu bisa langsung login dan mulai bertransaksi." },
  { q: "Bagaimana cara top up saldo?", a: "Masuk ke halaman WALLET, pilih nominal yang tersedia atau masukkan nominal manual, lalu klik TOP UP. Saldo akan langsung masuk ke akun kamu." },
  { q: "Berapa minimal top up?", a: "Minimal top up adalah Rp 1.000. Kamu bisa memilih nominal cepat seperti 10K, 25K, 50K, 100K, 250K, atau 500K." },
  { q: "Bagaimana cara beli produk?", a: "Pilih kategori produk (Pulsa, Token PLN, dll), pilih produk yang diinginkan, masukkan nomor tujuan, lalu klik CHECKOUT dan BAYAR. Transaksi akan diproses otomatis." },
  { q: "Berapa lama proses transaksi?", a: "Sebagian besar transaksi diproses secara instan (1-30 detik). Untuk beberapa produk tertentu bisa membutuhkan waktu hingga 5 menit." },
  { q: "Transaksi gagal, apakah uang hangus?", a: "Tidak! Jika transaksi gagal, saldo kamu akan otomatis dikembalikan (refund) ke wallet. Kamu bisa cek di halaman RIWAYAT atau WALLET." },
  { q: "Bagaimana cara cek status transaksi?", a: "Buka halaman RIWAYAT untuk melihat semua transaksi. Klik salah satu transaksi untuk melihat detail dan invoice lengkap." },
  { q: "Apakah ada biaya admin?", a: "Tidak ada biaya admin tambahan. Harga yang tertera sudah termasuk semua biaya." },
  { q: "Produk apa saja yang tersedia?", a: "Kami menyediakan Pulsa, Paket Data, Token PLN, Voucher Game (ML, FF, PUBG), E-Wallet (GoPay, DANA, OVO, ShopeePay), TV Kabel, dan masih banyak lagi. Total lebih dari 200 produk." },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// HELP CENTER</div>
          <h2 className="font-pixel text-xl text-px-white">FAQ</h2>
          <div className="font-pixel text-[7px] text-px-muted mt-2">PERTANYAAN YANG SERING DITANYAKAN</div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-px-card border-[3px] border-px-border overflow-hidden">
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-px-primary/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center border-[2px] font-pixel text-[8px] ${openIndex === i ? "border-px-primary text-px-primary" : "border-px-border text-px-muted"}`}>
                    Q
                  </div>
                  <span className="font-pixel text-[8px] text-px-white tracking-wider">{faq.q}</span>
                </div>
                <span className={`font-pixel text-[10px] text-px-primary transition-transform ${openIndex === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 pl-[68px]">
                  <div className="font-body text-lg text-px-muted leading-relaxed">{faq.a}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-px-card border-[3px] border-px-border p-8">
          <div className="font-pixel text-[9px] text-px-white mb-3">MASIH ADA PERTANYAAN?</div>
          <div className="font-body text-lg text-px-muted mb-4">Hubungi tim support kami</div>
          <Link to="/contact"
            className="inline-block font-pixel text-[8px] border-[3px] border-px-primary text-px-primary px-6 py-3 hover:bg-px-primary hover:text-px-bg transition-all">
            HUBUNGI KAMI
          </Link>
        </div>
      </div>
    </section>
  );
}
