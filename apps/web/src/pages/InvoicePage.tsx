import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

interface TxData {
  id: string; ref_id: string; product_name: string; customer_number: string;
  sell_price: string; sell_price_formatted: string; status: string;
  status_label: string; sn: string | null; created_at: string;
}

export default function InvoicePage() {
  const { refId } = useParams();
  const [tx, setTx] = useState<TxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    if (!refId) { nav("/history"); return; }

    api.post("/transactions/detail", { ref_id: refId }).then((r) => {
      if (r.data.success) setTx(r.data.data.transaction);
      else setError("Transaksi tidak ditemukan");
    }).catch(() => setError("Transaksi tidak ditemukan"))
      .finally(() => setLoading(false));
  }, [refId]);

  const statusConfig: Record<string, { color: string; label: string; icon: string }> = {
    success: { color: "text-px-primary border-px-primary bg-px-primary/10", label: "BERHASIL", icon: "✓" },
    pending: { color: "text-px-yellow border-px-yellow bg-px-yellow/10", label: "MENUNGGU", icon: "..." },
    processing: { color: "text-px-accent border-px-accent bg-px-accent/10", label: "DIPROSES", icon: "..." },
    failed: { color: "text-px-secondary border-px-secondary bg-px-secondary/10", label: "GAGAL", icon: "X" },
    refunded: { color: "text-px-purple border-px-purple bg-px-purple/10", label: "DIKEMBALIKAN", icon: "↩" },
  };

  if (loading) {
    return (
      <section className="py-20 min-h-screen flex items-center justify-center">
        <div className="font-pixel text-[9px] text-px-primary animate-blink">LOADING INVOICE...</div>
      </section>
    );
  }

  if (error || !tx) {
    return (
      <section className="py-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="font-pixel text-[9px] text-px-secondary mb-4">{error || "ERROR"}</div>
          <Link to="/history" className="font-pixel text-[8px] border-[3px] border-px-primary text-px-primary px-6 py-3 hover:bg-px-primary hover:text-px-bg transition-all">
            LIHAT RIWAYAT
          </Link>
        </div>
      </section>
    );
  }

  const st = statusConfig[tx.status] || statusConfig.pending;

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-lg mx-auto px-6">
        <div className="text-center mb-8">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// INVOICE</div>
          <h2 className="font-pixel text-xl text-px-white">BUKTI TRANSAKSI</h2>
        </div>

        {/* Status Badge */}
        <div className={`text-center mb-6 p-4 border-[3px] ${st.color}`}>
          <div className="text-3xl mb-2">{st.icon}</div>
          <div className="font-pixel text-[10px] tracking-wider">{st.label}</div>
        </div>

        {/* Invoice Card */}
        <div className="bg-px-card border-[4px] border-px-border p-8 relative">
          {/* Dashed border top */}
          <div className="absolute top-0 left-4 right-4 h-[1px]" style={{background:"repeating-linear-gradient(90deg, transparent, transparent 4px, #333366 4px, #333366 8px)"}} />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="font-pixel text-lg text-px-primary glow tracking-wider mb-1">PIXEL<span className="text-px-secondary">PAY</span></div>
            <div className="font-pixel text-[6px] text-px-muted tracking-wider">PPOB PLATFORM</div>
          </div>

          {/* Ref ID */}
          <div className="text-center mb-8 py-3 border-[2px] border-dashed border-px-border">
            <div className="font-pixel text-[6px] text-px-muted tracking-wider mb-1">REF ID</div>
            <div className="font-pixel text-[12px] text-px-accent">{tx.ref_id}</div>
          </div>

          {/* Details */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-px-muted">TANGGAL</span>
              <span className="font-body text-lg text-px-white">{new Date(tx.created_at).toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-px-muted">PRODUK</span>
              <span className="font-body text-lg text-px-white text-right max-w-[200px]">{tx.product_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-px-muted">NOMOR</span>
              <span className="font-body text-lg text-px-accent">{tx.customer_number}</span>
            </div>

            {tx.sn && (
              <div className="border-[2px] border-px-primary p-3">
                <div className="font-pixel text-[6px] text-px-primary tracking-wider mb-1">SERIAL NUMBER / TOKEN</div>
                <div className="font-pixel text-[10px] text-px-primary glow">{tx.sn}</div>
              </div>
            )}
          </div>

          {/* Dashed separator */}
          <div className="h-[1px] mb-6" style={{background:"repeating-linear-gradient(90deg, transparent, transparent 4px, #333366 4px, #333366 8px)"}} />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-pixel text-[9px] text-px-muted">TOTAL BAYAR</span>
            <span className="font-pixel text-[18px] text-px-yellow glow-y">{tx.sell_price_formatted}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <Link to="/history"
            className="flex-1 font-pixel text-[8px] py-4 text-center border-[3px] border-px-muted text-px-muted hover:border-px-white hover:text-px-white transition-all">
            RIWAYAT
          </Link>
          <Link to="/transaction"
            className="flex-1 font-pixel text-[9px] py-4 text-center bg-px-primary border-4 border-px-primary text-px-bg tracking-[0.2em] hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] hover:-translate-y-0.5 transition-all">
            BELI LAGI
          </Link>
        </div>
      </div>
    </section>
  );
}
