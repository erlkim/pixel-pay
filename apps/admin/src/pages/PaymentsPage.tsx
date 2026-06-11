import { useState, useEffect } from "react";
import api from "../lib/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/admin/payments").then((r) => {
      if (r.data.success) setPayments(r.data.data.payments);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => {
    if (s === "paid") return "text-px-primary border-px-primary";
    if (s === "failed") return "text-px-secondary border-px-secondary";
    if (s === "refunded") return "text-px-purple border-px-purple";
    return "text-px-yellow border-px-yellow";
  };

  const filtered = payments.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !p.order_id.toLowerCase().includes(search.toLowerCase()) &&
        !(p.user_name || "").toLowerCase().includes(search.toLowerCase()) &&
        !(p.user_email || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPaid = filtered.filter(p => p.status === "paid").reduce((s, p) => s + p.total_amount, 0);
  const totalPending = filtered.filter(p => p.status === "pending").reduce((s, p) => s + p.total_amount, 0);

  if (loading) return <div className="p-8 font-pixel text-[9px] text-px-primary animate-blink">LOADING PAYMENTS...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// PAYMENT GATEWAY</div>
          <h2 className="font-pixel text-lg text-px-white">PEMBAYARAN MIDTRANS</h2>
        </div>
        <div className="font-pixel text-[8px] text-px-muted">{payments.length} transaksi</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-1">TOTAL</div>
          <div className="font-pixel text-[14px] text-px-white">{payments.length}</div>
        </div>
        <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-1">PAID</div>
          <div className="font-pixel text-[12px] text-px-primary">Rp {totalPaid.toLocaleString("id-ID")}</div>
        </div>
        <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-1">PENDING</div>
          <div className="font-pixel text-[12px] text-px-yellow">Rp {totalPending.toLocaleString("id-ID")}</div>
        </div>
        <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-1">SUCCESS RATE</div>
          <div className="font-pixel text-[12px] text-px-primary">
            {payments.length > 0 ? Math.round(payments.filter(p => p.status === "paid").length / payments.length * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {["all", "pending", "paid", "failed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-pixel text-[6px] px-3 py-2 border-[3px] tracking-wider transition-all ${filter === f ? "bg-px-primary/10 border-px-primary text-px-primary" : "border-px-border text-px-muted hover:border-px-primary"}`}>
            {f === "all" ? "SEMUA" : f.toUpperCase()}
          </button>
        ))}
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari order ID / user..."
          className="flex-1 px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none" />
      </div>

      {/* Table */}
      <div className="bg-px-card border-[3px] border-px-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-[3px] border-px-border">
              <th className="font-pixel text-[6px] text-px-muted p-3 text-left">ORDER ID</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-left">USER</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-left">METODE</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-right">AMOUNT</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-right">FEE</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-right">TOTAL</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-center">STATUS</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-left">TANGGAL</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-px-border/50 hover:bg-px-primary/5 transition-colors">
                <td className="p-3 font-pixel text-[7px] text-px-white">{p.order_id}</td>
                <td className="p-3">
                  <div className="font-pixel text-[7px] text-px-white">{p.user_name || "-"}</div>
                  <div className="font-body text-sm text-px-muted">{p.user_email || ""}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span>{p.method_icon}</span>
                    <span className="font-pixel text-[7px] text-px-muted">{p.method_name || p.payment_type}</span>
                  </div>
                </td>
                <td className="p-3 font-pixel text-[8px] text-px-white text-right">Rp {p.amount.toLocaleString("id-ID")}</td>
                <td className="p-3 font-pixel text-[7px] text-px-muted text-right">Rp {p.fee.toLocaleString("id-ID")}</td>
                <td className="p-3 font-pixel text-[8px] text-px-yellow text-right">Rp {p.total_amount.toLocaleString("id-ID")}</td>
                <td className="p-3 text-center">
                  <span className={`font-pixel text-[6px] px-2 py-1 border-[2px] ${statusColor(p.status)}`}>{p.status.toUpperCase()}</span>
                </td>
                <td className="p-3 font-body text-base text-px-muted">{new Date(p.created_at).toLocaleString("id-ID")}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center font-pixel text-[8px] text-px-muted">TIDAK ADA TRANSAKSI PEMBAYARAN</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
