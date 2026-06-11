import { Link } from "react-router-dom";

const links = [
  { title: "PRODUK", items: [
    { label: "Pulsa", to: "/products?category=pulsa" },
    { label: "Data / Kuota", to: "/products?category=data" },
    { label: "Token PLN", to: "/products?category=token-pln" },
    { label: "Voucher Game", to: "/products?category=voucher-game" },
    { label: "E-Money", to: "/products?category=e-money" },
    { label: "TV Kabel", to: "/products?category=tv-kabel" },
  ]},
  { title: "BANTUAN", items: [
    { label: "FAQ", to: "/faq" },
    { label: "Cara Top Up", to: "/topup-guide" },
    { label: "Hubungi Kami", to: "/contact" },
    { label: "Syarat & Ketentuan", to: "/terms" },
  ]},
  { title: "AKUN", items: [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Profil", to: "/profile" },
    { label: "Wallet", to: "/wallet" },
    { label: "Voucher & Promo", to: "/vouchers" },
    { label: "Notifikasi", to: "/notifications" },
    { label: "Riwayat Transaksi", to: "/history" },
  ]},
];

export default function Footer() {
  return (
    <footer className="bg-px-surface border-t-[3px] border-px-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="font-pixel text-base text-px-primary glow tracking-[3px] mb-4 block">
              PIXEL<span className="text-px-secondary">PAY</span>
            </Link>
            <div className="font-body text-lg text-px-muted mb-6 leading-relaxed">
              Platform PPOB 8-bit terdepan. Isi pulsa, token PLN, voucher game, dan produk digital lainnya.
            </div>
            <div className="flex gap-3">
              {["WA", "IG", "TW", "TK"].map((s) => (
                <div key={s} className="w-9 h-9 border-[2px] border-px-border flex items-center justify-center font-pixel text-[7px] text-px-muted hover:border-px-primary hover:text-px-primary transition-all cursor-pointer">
                  {s}
                </div>
              ))}
            </div>
          </div>
          {links.map((g) => (
            <div key={g.title}>
              <div className="font-pixel text-[8px] text-px-accent tracking-wider mb-4">{g.title}</div>
              <ul className="space-y-3">
                {g.items.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className="font-body text-lg text-px-muted hover:text-px-primary transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t-[3px] border-px-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="font-pixel text-[6px] text-px-muted tracking-wider">© 2026 PIXEL PAY. ALL RIGHTS RESERVED.</div>
          <div className="flex gap-6">
            <Link to="/terms" className="font-pixel text-[6px] text-px-muted hover:text-px-primary transition-colors tracking-wider">SYARAT & KETENTUAN</Link>
            <Link to="/faq" className="font-pixel text-[6px] text-px-muted hover:text-px-primary transition-colors tracking-wider">FAQ</Link>
            <Link to="/contact" className="font-pixel text-[6px] text-px-muted hover:text-px-primary transition-colors tracking-wider">KONTAK</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
