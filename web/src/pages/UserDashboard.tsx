import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";

export default function UserDashboard() {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState("Rp 0");
  const [txCount, setTxCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }

    const u = localStorage.getItem("px_user");
    if (u) setUser(JSON.parse(u));

    const fetchAll = async () => {
      try {
        const [balRes, txRes, logRes] = await Promise.all([
          api.get("/wallet/balance"),
          api.get("/transactions/list"),
          api.get("/wallet/history"),
        ]);

        if (balRes.data.success) setBalance(balRes.data.data.wallet.balance_formatted);
        if (txRes.data.success) {
          const txs = txRes.data.data.transactions;
          setTxCount(txs.length);
          setSuccessCount(txs.filter((t: any) => t.status === "success").length);
          setPendingCount(txs.filter((t: any) => t.status === "pending" || t.status === "processing").length);
          setRecentTx(txs.slice(0, 5));
        }
        if (logRes.data.success) setLogs(logRes.data.data.logs.slice(0, 5));
      } catch {}
      setLoading(false);
    };

    fetchAll();
  }, []);

  const statusColor = (s: string) => {
    if (s === "success") return "text-px-primary border-px-primary";
    if (s === "failed") return "text-px-secondary border-px-secondary";
    return "text-px-yellow border-px-yellow";
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: "MENUNGGU", processing: "DIPROSES", success: "BERHASIL",
      failed: "GAGAL", refunded: "DIKEMBALIKAN",
    };
    return map[s] || s.toUpperCase();
  };

  if (loading) {
    return (
      <section className="py-20 min-h-screen flex items-center justify-center">
        <div className="font-pixel text-[9px] text-px-primary animate-blink">LOADING DASHBOARD...</div>
      </section>
    );
  }

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// PLAYER STATUS</div>
          <h2 className="font-pixel text-xl text-px-white">DASHBOARD</h2>
        </div>

        {/* Profile Card */}
        <div className="bg-px-card border-[4px] border-px-primary p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-px-primary" />
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 border-[4px] border-px-primary flex items-center justify-center bg-px-primary/10">
              <span className="font-pixel text-2xl text-px-primary">{user?.full_name?.charAt(0) || "U"}</span>
            </div>
            <div className="flex-1">
              <div className="font-pixel text-[12px] text-px-white mb-1">{user?.full_name || "USER"}</div>
              <div className="font-body text-lg text-px-muted mb-1">{user?.email}</div>
              <div className="font-body text-lg text-px-muted">{user?.phone}</div>
              <div className="mt-2">
                <span className="font-pixel text-[6px] px-3 py-1 border-[2px] border-px-accent text-px-accent tracking-wider">
                  {(user?.role || "USER").toUpperCase()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-pixel text-[6px] text-px-muted mb-2">SALDO</div>
              <div className="font-pixel text-2xl text-px-yellow glow-y">{balance}</div>
              <Link to="/wallet"
                className="inline-block mt-3 font-pixel text-[7px] border-[3px] border-px-yellow text-px-yellow px-4 py-2 hover:bg-px-yellow hover:text-px-bg transition-all">
                TOP UP
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "SALDO", value: balance, color: "text-px-yellow", icon: "💰", link: "/wallet" },
            { label: "TOTAL TRANSAKSI", value: String(txCount), color: "text-px-white", icon: "📦", link: "/history" },
            { label: "BERHASIL", value: String(successCount), color: "text-px-primary", icon: "✅", link: "/history" },
            { label: "PROSES", value: String(pendingCount), color: "text-px-yellow", icon: "⏳", link: "/history" },
          ].map((s) => (
            <Link key={s.label} to={s.link}
              className="bg-px-card border-[3px] border-px-border p-5 text-center hover:border-px-primary transition-all cursor-pointer block">
              <span className="text-2xl block mb-2">{s.icon}</span>
              <div className={`font-pixel text-[14px] ${s.color} mb-1`}>{s.value}</div>
              <div className="font-pixel text-[6px] text-px-muted tracking-wider">{s.label}</div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "BELI PRODUK", icon: "🛒", link: "/transaction", color: "border-px-primary text-px-primary hover:bg-px-primary" },
            { label: "TOP UP SALDO", icon: "💳", link: "/wallet", color: "border-px-yellow text-px-yellow hover:bg-px-yellow" },
            { label: "RIWAYAT", icon: "📋", link: "/history", color: "border-px-accent text-px-accent hover:bg-px-accent" },
            { label: "SEMUA PRODUK", icon: "📦", link: "/products", color: "border-px-purple text-px-purple hover:bg-px-purple" },
          ].map((a) => (
            <Link key={a.label} to={a.link}
              className={`bg-px-card border-[3px] ${a.color} p-5 text-center hover:text-px-bg transition-all cursor-pointer block`}>
              <span className="text-2xl block mb-2">{a.icon}</span>
              <div className="font-pixel text-[7px] tracking-wider">{a.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-px-card border-[3px] border-px-border">
            <div className="p-4 border-b-[3px] border-px-border flex items-center justify-between">
              <span className="font-pixel text-[9px] text-px-accent tracking-wider">TRANSAKSI TERAKHIR</span>
              <Link to="/history" className="font-pixel text-[6px] text-px-primary hover:text-px-yellow transition-colors">LIHAT SEMUA →</Link>
            </div>
            {recentTx.length === 0 ? (
              <div className="p-8 text-center">
                <div className="font-pixel text-[8px] text-px-muted mb-3">BELUM ADA TRANSAKSI</div>
                <Link to="/transaction"
                  className="inline-block font-pixel text-[7px] border-[3px] border-px-primary text-px-primary px-4 py-2 hover:bg-px-primary hover:text-px-bg transition-all">
                  BELI SEKARANG
                </Link>
              </div>
            ) : (
              recentTx.map((tx: any) => (
                <Link key={tx.id} to={`/invoice/${tx.ref_id}`}
                  className="flex items-center gap-4 p-4 border-b border-px-border/50 last:border-b-0 hover:bg-px-primary/5 transition-colors cursor-pointer block">
                  <div className={`w-10 h-10 flex items-center justify-center border-[3px] text-lg ${statusColor(tx.status)}`}>
                    {tx.status === "success" ? "✓" : tx.status === "failed" ? "X" : "..."}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-pixel text-[7px] text-px-white">{tx.ref_id}</div>
                    <div className="font-body text-base text-px-muted truncate">No: {tx.customer_number}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-pixel text-[9px] text-px-yellow mb-1">Rp {parseFloat(tx.sell_price).toLocaleString("id-ID")}</div>
                    <span className={`font-pixel text-[5px] px-2 py-0.5 border-[2px] ${statusColor(tx.status)}`}>{statusLabel(tx.status)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Recent Balance Activity */}
          <div className="bg-px-card border-[3px] border-px-border">
            <div className="p-4 border-b-[3px] border-px-border flex items-center justify-between">
              <span className="font-pixel text-[9px] text-px-accent tracking-wider">AKTIVITAS SALDO</span>
              <Link to="/wallet" className="font-pixel text-[6px] text-px-primary hover:text-px-yellow transition-colors">LIHAT SEMUA →</Link>
            </div>
            {logs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="font-pixel text-[8px] text-px-muted mb-3">BELUM ADA AKTIVITAS</div>
                <Link to="/wallet"
                  className="inline-block font-pixel text-[7px] border-[3px] border-px-yellow text-px-yellow px-4 py-2 hover:bg-px-yellow hover:text-px-bg transition-all">
                  TOP UP
                </Link>
              </div>
            ) : (
              logs.map((l: any, i: number) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b border-px-border/50 last:border-b-0">
                  <div className={`w-10 h-10 flex items-center justify-center border-[3px] font-pixel text-[10px] ${l.type === "credit" ? "border-px-primary text-px-primary" : "border-px-secondary text-px-secondary"}`}>
                    {l.type === "credit" ? "+" : "-"}
                  </div>
                  <div className="flex-1">
                    <div className="font-pixel text-[7px] text-px-white">{l.description}</div>
                    <div className="font-body text-base text-px-muted">{new Date(l.created_at).toLocaleString("id-ID")}</div>
                  </div>
                  <div className={`font-pixel text-[9px] ${l.type === "credit" ? "text-px-primary" : "text-px-secondary"}`}>
                    {l.type === "credit" ? "+" : "-"} Rp {parseFloat(l.amount).toLocaleString("id-ID")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
