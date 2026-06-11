import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";

interface TxItem {
  id: string; ref_id: string; customer_number: string;
  sell_price_formatted: string; status: string; serial_number: string | null; created_at: string;
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    api.get("/transactions/list").then((r) => {
      if (r.data.success) setTransactions(r.data.data.transactions);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusConfig: Record<string, { color: string; label: string }> = {
    success: { color: "text-px-primary border-px-primary", label: "BERHASIL" },
    pending: { color: "text-px-yellow border-px-yellow", label: "MENUNGGU" },
    processing: { color: "text-px-accent border-px-accent", label: "DIPROSES" },
    failed: { color: "text-px-secondary border-px-secondary", label: "GAGAL" },
    refunded: { color: "text-px-purple border-px-purple", label: "DIKEMBALIKAN" },
  };

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.status === filter);

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// QUEST LOG</div>
          <h2 className="font-pixel text-xl text-px-white">RIWAYAT TRANSAKSI</h2>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", "success", "pending", "processing", "failed"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-pixel text-[6px] px-4 py-2 border-[3px] tracking-wider transition-all ${
                filter === f
                  ? "bg-px-primary/10 border-px-primary text-px-primary"
                  : "border-px-border text-px-muted hover:border-px-primary hover:text-px-primary"
              }`}>
              {f === "all" ? "SEMUA" : f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
            <div className="font-pixel text-[7px] text-px-muted mb-1">TOTAL</div>
            <div className="font-pixel text-[14px] text-px-white">{transactions.length}</div>
          </div>
          <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
            <div className="font-pixel text-[7px] text-px-muted mb-1">BERHASIL</div>
            <div className="font-pixel text-[14px] text-px-primary">{transactions.filter(t => t.status === "success").length}</div>
          </div>
          <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
            <div className="font-pixel text-[7px] text-px-muted mb-1">GAGAL</div>
            <div className="font-pixel text-[14px] text-px-secondary">{transactions.filter(t => t.status === "failed").length}</div>
          </div>
        </div>

        {/* List */}
        <div className="bg-px-card border-[3px] border-px-border">
          <div className="p-4 border-b-[3px] border-px-border flex items-center justify-between">
            <span className="font-pixel text-[9px] text-px-accent tracking-wider">SEMUA TRANSAKSI</span>
            <span className="font-pixel text-[7px] text-px-muted">{filtered.length} transaksi</span>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="font-pixel text-[9px] text-px-primary animate-blink">LOADING...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-4xl mb-4">📦</div>
              <div className="font-pixel text-[9px] text-px-muted mb-4">BELUM ADA TRANSAKSI</div>
              <Link to="/transaction"
                className="inline-block font-pixel text-[8px] px-6 py-3 border-[3px] border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg transition-all">
                MULAI BELI
              </Link>
            </div>
          ) : (
            filtered.map((tx) => {
              const st = statusConfig[tx.status] || statusConfig.pending;
              return (
                <Link key={tx.id} to={`/invoice/${tx.ref_id}`}
                  className="flex items-center gap-4 p-5 border-b border-px-border/50 last:border-b-0 hover:bg-px-primary/5 transition-colors cursor-pointer block">
                  <div className={`w-12 h-12 flex items-center justify-center border-[3px] text-xl ${st.color}`}>
                    {tx.status === "success" ? "✓" : tx.status === "failed" ? "X" : "..."}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-[8px] text-px-white mb-1">{tx.ref_id}</div>
                    <div className="font-body text-base text-px-muted truncate">No: {tx.customer_number}</div>
                    {tx.serial_number && <div className="font-body text-base text-px-primary truncate">SN: {tx.serial_number}</div>}
                    <div className="font-body text-sm text-px-muted">{new Date(tx.created_at).toLocaleString("id-ID")}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-pixel text-[10px] text-px-yellow mb-1">{tx.sell_price_formatted}</div>
                    <span className={`font-pixel text-[6px] px-2 py-1 border-[2px] ${st.color}`}>{st.label}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
