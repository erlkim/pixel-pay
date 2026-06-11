import { useState, useEffect } from "react";
import api from "../lib/api";

interface DashboardData {
  revenue_today: string;
  transactions_today: number;
  total_users: number;
}

interface SyncStatus {
  category: string;
  status: string;
  count: number;
  error?: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [txCount, setTxCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const dashRes = await api.get("/admin/dashboard");
      if (dashRes.data.success) {
        setStats(dashRes.data.data);
      }

      const txRes = await api.get("/admin/transactions");
      if (txRes.data.success) {
        const txs = txRes.data.data.transactions;
        setTxCount(txs.length);
        setRecentTx(txs.slice(0, 10));
      }

      const uRes = await api.get("/admin/users");
      if (uRes.data.success) {
        setUserCount(uRes.data.data.users.length);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await api.post("/admin/sync-products");
      if (r.data.success) {
        setSyncStatus(r.data.data.per_category || []);
        setProductCount(r.data.data.total_in_db || 0);
      }
    } catch {}
    setSyncing(false);
  };

  const statusColor = (s: string) => {
    if (s === "success") return "text-px-primary border-px-primary";
    if (s === "failed") return "text-px-secondary border-px-secondary";
    if (s === "processing") return "text-px-accent border-px-accent";
    return "text-px-yellow border-px-yellow";
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="font-pixel text-[9px] text-px-primary animate-blink">LOADING DASHBOARD...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// OVERVIEW</div>
          <h2 className="font-pixel text-lg text-px-white">DASHBOARD</h2>
        </div>
        <button onClick={fetchAll}
          className="font-pixel text-[7px] border-[3px] border-px-primary text-px-primary px-4 py-2 hover:bg-px-primary hover:text-px-bg transition-all">
          REFRESH
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "PENDAPATAN HARI INI", value: stats?.revenue_today || "Rp 0", color: "text-px-primary", icon: "💰" },
          { label: "TRANSAKSI HARI INI", value: String(stats?.transactions_today || 0), color: "text-px-yellow", icon: "📊" },
          { label: "TOTAL USER", value: String(userCount), color: "text-px-accent", icon: "👥" },
          { label: "TOTAL PRODUK", value: String(productCount || 222), color: "text-px-secondary", icon: "📦" },
        ].map((s) => (
          <div key={s.label} className="bg-px-card border-[3px] border-px-border p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-px-primary" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <div className={`font-pixel text-2xl ${s.color} mb-1`}>{s.value}</div>
            <div className="font-pixel text-[6px] text-px-muted tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sync Products */}
      <div className="bg-px-card border-[3px] border-px-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-pixel text-[9px] text-px-primary mb-1">DIGIFLAZZ SYNC</div>
            <div className="font-pixel text-[6px] text-px-muted">Sinkronisasi produk dari Digiflazz</div>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="font-pixel text-[7px] border-[3px] border-px-yellow text-px-yellow px-5 py-2 hover:bg-px-yellow hover:text-px-bg transition-all disabled:opacity-50">
            {syncing ? "SYNCING..." : "SYNC NOW"}
          </button>
        </div>
        {syncStatus.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {syncStatus.map((s, i) => (
              <div key={i} className={`p-3 border-[3px] ${s.status === "ok" ? "border-px-primary" : "border-px-secondary"}`}>
                <div className="font-pixel text-[7px] text-px-white mb-1">{s.category}</div>
                <div className={`font-pixel text-[10px] ${s.status === "ok" ? "text-px-primary" : "text-px-secondary"}`}>
                  {s.status === "ok" ? `${s.count} produk` : "ERROR"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-px-card border-[3px] border-px-border">
        <div className="p-5 border-b-[3px] border-px-border flex items-center justify-between">
          <div>
            <div className="font-pixel text-[9px] text-px-accent tracking-wider">TRANSAKSI TERAKHIR</div>
            <div className="font-pixel text-[6px] text-px-muted mt-1">{txCount} total transaksi</div>
          </div>
        </div>
        {recentTx.length === 0 ? (
          <div className="p-8 text-center font-pixel text-[8px] text-px-muted">BELUM ADA TRANSAKSI</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-[3px] border-px-border">
                  <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-left">REF ID</th>
                  <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-left">NOMOR</th>
                  <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-right">HARGA</th>
                  <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-right">PROFIT</th>
                  <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-center">STATUS</th>
                  <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-left">WAKTU</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-px-border/50 hover:bg-px-primary/5 transition-colors">
                    <td className="p-4 font-pixel text-[8px] text-px-white">{tx.ref_id}</td>
                    <td className="p-4 font-body text-lg text-px-muted">{tx.customer_number}</td>
                    <td className="p-4 font-pixel text-[9px] text-px-yellow text-right">Rp {parseFloat(tx.sell_price).toLocaleString("id-ID")}</td>
                    <td className="p-4 font-pixel text-[9px] text-px-primary text-right">Rp {parseFloat(tx.profit).toLocaleString("id-ID")}</td>
                    <td className="p-4 text-center">
                      <span className={`font-pixel text-[6px] px-2 py-1 border-[2px] ${statusColor(tx.status)}`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 font-body text-base text-px-muted">{new Date(tx.created_at).toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
