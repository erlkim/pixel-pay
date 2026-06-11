import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Voucher {
  id: string; code: string; description: string; discount_type: string;
  discount_value: string; min_transaction: string; max_discount: string | null;
  expires_at: string | null;
}

export default function VoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    api.get("/vouchers/available").then((r) => {
      if (r.data.success) setVouchers(r.data.data.vouchers);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  const formatDiscount = (v: Voucher) => {
    if (v.discount_type === "percentage") return `${parseFloat(v.discount_value)}%`;
    return `Rp ${parseFloat(v.discount_value).toLocaleString("id-ID")}`;
  };

  const daysLeft = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} hari lagi` : "Hari ini";
  };

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// PROMO</div>
          <h2 className="font-pixel text-xl text-px-white">VOUCHER & PROMO</h2>
          <div className="font-pixel text-[7px] text-px-muted mt-2">Gunakan voucher untuk mendapatkan diskon!</div>
        </div>

        {loading ? (
          <div className="text-center py-16 font-pixel text-[9px] text-px-primary animate-blink">LOADING...</div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🎫</div>
            <div className="font-pixel text-[9px] text-px-muted mb-2">TIDAK ADA VOUCHER TERSEDIA</div>
            <div className="font-body text-lg text-px-muted">Cek lagi nanti ya!</div>
          </div>
        ) : (
          <div className="space-y-4">
            {vouchers.map((v) => (
              <div key={v.id} className="bg-px-card border-[3px] border-px-yellow p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-px-yellow" />
                {/* Dashed separator left */}
                <div className="absolute left-[30%] top-4 bottom-4 w-[1px]" style={{background:"repeating-linear-gradient(180deg, transparent, transparent 4px, #555566 4px, #555566 8px)"}} />

                <div className="flex gap-6">
                  {/* Discount */}
                  <div className="w-[28%] flex flex-col items-center justify-center text-center">
                    <div className="font-pixel text-[10px] text-px-muted mb-1">DISKON</div>
                    <div className="font-pixel text-2xl text-px-yellow glow-y">{formatDiscount(v)}</div>
                    {v.max_discount && v.discount_type === "percentage" && (
                      <div className="font-pixel text-[6px] text-px-muted mt-1">Maks Rp {parseFloat(v.max_discount).toLocaleString("id-ID")}</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="font-pixel text-[10px] text-px-white mb-2">{v.description || v.code}</div>
                    <div className="font-body text-lg text-px-muted mb-3">
                      Min. transaksi Rp {parseFloat(v.min_transaction).toLocaleString("id-ID")}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => copyCode(v.code)}
                        className={`font-pixel text-[9px] px-5 py-2 border-[3px] tracking-[0.15em] transition-all ${
                          copied === v.code
                            ? "border-px-primary text-px-primary bg-px-primary/10"
                            : "border-px-yellow text-px-yellow hover:bg-px-yellow hover:text-px-bg"
                        }`}>
                        {copied === v.code ? "DISALIN!" : v.code}
                      </button>
                      {v.expires_at && (
                        <span className="font-pixel text-[6px] text-px-secondary">{daysLeft(v.expires_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button onClick={() => nav("/transaction")}
            className="font-pixel text-[8px] border-[3px] border-px-primary text-px-primary px-6 py-3 hover:bg-px-primary hover:text-px-bg transition-all">
            GUNAKAN VOUCHER SEKARANG
          </button>
        </div>
      </div>
    </section>
  );
}
