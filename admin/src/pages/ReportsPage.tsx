import { useState, useEffect } from "react";
import api from "../lib/api";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/revenue-stats").then((r) => {
      if (r.data.success) setStats(r.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 font-pixel text-[9px] text-px-primary animate-blink">LOADING REPORTS...</div>;
  if (!stats) return <div className="p-8 font-pixel text-[9px] text-px-secondary">Gagal load data</div>;

  const maxRevenue = Math.max(...stats.daily.map((d: any) => d.revenue), 1);
  const totalRevenue = stats.daily.reduce((s: number, d: any) => s + d.revenue, 0);
  const totalTx = stats.daily.reduce((s: number, d: any) => s + d.count, 0);

  return (
    <div className="p-8 space-y-8">
      <div>
        <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// REPORTS</div>
        <h2 className="font-pixel text-lg text-px-white">LAPORAN KEUANGAN</h2>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-px-card border-[3px] border-px-border p-6 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-2">TOTAL REVENUE (30 HARI)</div>
          <div className="font-pixel text-xl text-px-yellow glow-y">Rp {totalRevenue.toLocaleString("id-ID")}</div>
        </div>
        <div className="bg-px-card border-[3px] border-px-border p-6 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-2">TOTAL TRANSAKSI</div>
          <div className="font-pixel text-xl text-px-white">{totalTx}</div>
        </div>
        <div className="bg-px-card border-[3px] border-px-border p-6 text-center">
          <div className="font-pixel text-[6px] text-px-muted mb-2">RATA-RATA / HARI</div>
          <div className="font-pixel text-xl text-px-primary">Rp {(totalRevenue / Math.max(stats.daily.length, 1)).toLocaleString("id-ID")}</div>
        </div>
      </div>

      {/* Revenue Chart (text-based) */}
      <div className="bg-px-card border-[3px] border-px-border p-6">
        <div className="font-pixel text-[9px] text-px-primary mb-6 tracking-wider">REVENUE PER HARI</div>
        <div className="space-y-2">
          {stats.daily.slice(-14).map((d: any, i: number) => {
            const width = Math.max((d.revenue / maxRevenue) * 100, 2);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="font-pixel text-[6px] text-px-muted w-20 flex-shrink-0">{d.date}</span>
                <div className="flex-1 h-6 bg-px-bg border-[2px] border-px-border relative overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-px-primary/80 transition-all" style={{ width: `${width}%` }} />
                  <span className="absolute inset-0 flex items-center px-2 font-pixel text-[6px] text-px-white z-10">
                    Rp {d.revenue.toLocaleString("id-ID")} ({d.count} tx)
                  </span>
                </div>
              </div>
            );
          })}
          {stats.daily.length === 0 && (
            <div className="text-center font-pixel text-[8px] text-px-muted py-8">BELUM ADA DATA</div>
          )}
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-px-card border-[3px] border-px-border p-6">
        <div className="font-pixel text-[9px] text-px-yellow mb-6 tracking-wider">TOP KATEGORI (30 HARI)</div>
        {stats.by_category.length === 0 ? (
          <div className="text-center font-pixel text-[8px] text-px-muted py-8">BELUM ADA DATA</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats.by_category.map((c: any, i: number) => (
              <div key={i} className="bg-px-bg border-[3px] border-px-border p-4">
                <div className="font-pixel text-[7px] text-px-white mb-2">{c.category}</div>
                <div className="font-pixel text-[10px] text-px-primary mb-1">Rp {c.revenue.toLocaleString("id-ID")}</div>
                <div className="font-pixel text-[6px] text-px-muted">{c.count} transaksi</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
