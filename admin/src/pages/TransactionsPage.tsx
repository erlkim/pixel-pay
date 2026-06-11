import { useState, useEffect, useRef } from "react";
import api from "../lib/api";
import TransactionDetailModal from "../components/TransactionDetailModal";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState("");
  const intervalRef = useRef<any>(null);

  const fetchTx = async () => {
    try {
      const body: any = { limit: 200 };
      if (dateFrom) body.date_from = dateFrom;
      if (dateTo) body.date_to = dateTo;
      if (filter !== "all") body.status = filter;
      if (category !== "all") body.category = category;

      const r = await api.post("/admin/transactions/filtered", body);
      if (r.data.success) {
        let txs = r.data.data.transactions;
        if (search) {
          txs = txs.filter((t: any) =>
            t.ref_id.toLowerCase().includes(search.toLowerCase()) ||
            t.customer_number.includes(search)
          );
        }
        setTransactions(txs);
        setTotalRevenue(r.data.data.total_revenue);
        setTotalProfit(r.data.data.total_profit);
        setLastRefresh(new Date().toLocaleTimeString("id-ID"));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    api.get("/products/categories").then((r) => {
      if (r.data.success) setCategories(r.data.data.categories);
    });
  }, []);

  useEffect(() => {
    fetchTx();
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchTx, 10000);
      return () => clearInterval(intervalRef.current);
    }
  }, [filter, dateFrom, dateTo, category, autoRefresh]);

  useEffect(() => {
    if (search) fetchTx();
  }, [search]);

  const handleExport = () => {
    window.open(`/api/admin/export-csv`, '_blank');
  };

  const statusColor = (s: string) => {
    if (s === "success") return "text-px-primary border-px-primary";
    if (s === "failed") return "text-px-secondary border-px-secondary";
    if (s === "refunded") return "text-px-purple border-px-purple";
    return "text-px-yellow border-px-yellow";
  };

  return (
    <div className="p-8 space-y-6">
      {selectedTx && <TransactionDetailModal tx={selectedTx} onClose={() => setSelectedTx(null)} onUpdate={fetchTx} />}

      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// TRANSACTIONS</div>
          <h2 className="font-pixel text-lg text-px-white">SEMUA TRANSAKSI</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-px-primary animate-pulse" : "bg-px-muted"}`} />
            <span className="font-pixel text-[6px] text-px-muted">{autoRefresh ? `LIVE (${lastRefresh})` : "PAUSED"}</span>
          </div>
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={`font-pixel text-[6px] px-3 py-1 border-[2px] transition-all ${autoRefresh ? "border-px-primary text-px-primary" : "border-px-muted text-px-muted"}`}>
            {autoRefresh ? "LIVE" : "PAUSED"}
          </button>
          <button onClick={handleExport}
            className="font-pixel text-[7px] px-4 py-2 border-[3px] border-px-yellow text-px-yellow hover:bg-px-yellow hover:text-px-bg transition-all">
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-1">TOTAL</div>
          <div className="font-pixel text-[14px] text-px-white">{transactions.length}</div>
        </div>
        <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-1">REVENUE</div>
          <div className="font-pixel text-[12px] text-px-yellow">Rp {totalRevenue.toLocaleString("id-ID")}</div>
        </div>
        <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-1">PROFIT</div>
          <div className="font-pixel text-[12px] text-px-primary">Rp {totalProfit.toLocaleString("id-ID")}</div>
        </div>
        <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-1">BERHASIL</div>
          <div className="font-pixel text-[14px] text-px-primary">{transactions.filter(t => t.status === "success").length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-px-card border-[3px] border-px-border p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {["all", "success", "pending", "processing", "failed", "refunded"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-pixel text-[6px] px-3 py-2 border-[3px] tracking-wider transition-all ${filter === f ? "bg-px-primary/10 border-px-primary text-px-primary" : "border-px-border text-px-muted hover:border-px-primary"}`}>
              {f === "all" ? "SEMUA" : f.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[6px] text-px-muted">DARI</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[6px] text-px-muted">SAMPAI</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none">
            <option value="all">Semua Kategori</option>
            {categories.map((c: any) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari ref ID / nomor..."
            className="flex-1 px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none" />
          <button onClick={() => { setDateFrom(""); setDateTo(""); setCategory("all"); setFilter("all"); setSearch(""); }}
            className="font-pixel text-[6px] px-3 py-2 border-[3px] border-px-secondary text-px-secondary hover:bg-px-secondary hover:text-px-white transition-all">
            RESET
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-px-card border-[3px] border-px-border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center font-pixel text-[9px] text-px-primary animate-blink">LOADING...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-[3px] border-px-border">
                <th className="font-pixel text-[6px] text-px-muted p-3 text-left">REF ID</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-left">NOMOR</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-right">HARGA</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-right">PROFIT</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-center">STATUS</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-left">WAKTU</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="border-b border-px-border/50 hover:bg-px-primary/5 transition-colors">
                  <td className="p-3 font-pixel text-[7px] text-px-white">{tx.ref_id}</td>
                  <td className="p-3 font-body text-lg text-px-muted">{tx.customer_number}</td>
                  <td className="p-3 font-pixel text-[8px] text-px-yellow text-right">Rp {parseFloat(tx.sell_price).toLocaleString("id-ID")}</td>
                  <td className="p-3 font-pixel text-[8px] text-px-primary text-right">Rp {parseFloat(tx.profit).toLocaleString("id-ID")}</td>
                  <td className="p-3 text-center">
                    <span className={`font-pixel text-[6px] px-2 py-1 border-[2px] ${statusColor(tx.status)}`}>{tx.status.toUpperCase()}</span>
                  </td>
                  <td className="p-3 font-body text-base text-px-muted">{new Date(tx.created_at).toLocaleString("id-ID")}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => setSelectedTx(tx)}
                      className="font-pixel text-[6px] px-3 py-1 border-[2px] border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg transition-all">
                      DETAIL
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center font-pixel text-[8px] text-px-muted">TIDAK ADA TRANSAKSI</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
