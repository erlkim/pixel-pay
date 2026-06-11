import { useState, useEffect } from "react";
import api from "../lib/api";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/admin/logs").then((r) => {
      if (r.data.success) setLogs(r.data.data.logs);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const actionColor = (action: string) => {
    if (action.includes("BLOCK") || action.includes("REFUND")) return "text-px-secondary";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "text-px-yellow";
    if (action.includes("BROADCAST") || action.includes("SYNC")) return "text-px-accent";
    return "text-px-primary";
  };

  const filtered = filter === "all" ? logs : logs.filter((l) => l.action.toLowerCase().includes(filter));

  if (loading) return <div className="p-8 font-pixel text-[9px] text-px-primary animate-blink">LOADING LOGS...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// AUDIT LOG</div>
          <h2 className="font-pixel text-lg text-px-white">LOG AKTIVITAS ADMIN</h2>
        </div>
        <div className="font-pixel text-[8px] text-px-muted">{logs.length} log</div>
      </div>

      <div className="flex flex-wrap gap-1">
        {["all", "login", "transaction", "user", "setting", "broadcast", "markup"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-pixel text-[6px] px-3 py-2 border-[3px] tracking-wider transition-all ${filter === f ? "bg-px-primary/10 border-px-primary text-px-primary" : "border-px-border text-px-muted hover:border-px-primary"}`}>
            {f === "all" ? "SEMUA" : f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-px-card border-[3px] border-px-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-[3px] border-px-border">
              <th className="font-pixel text-[6px] text-px-muted p-3 text-left">WAKTU</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-left">ADMIN</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-left">AKSI</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-left">TARGET</th>
              <th className="font-pixel text-[6px] text-px-muted p-3 text-left">DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l: any) => (
              <tr key={l.id} className="border-b border-px-border/50 hover:bg-px-primary/5 transition-colors">
                <td className="p-3 font-body text-base text-px-muted">{new Date(l.created_at).toLocaleString("id-ID")}</td>
                <td className="p-3 font-pixel text-[7px] text-px-white">{l.admin_name || "Admin"}</td>
                <td className="p-3"><span className={`font-pixel text-[7px] ${actionColor(l.action)}`}>{l.action}</span></td>
                <td className="p-3 font-pixel text-[6px] text-px-muted">{l.target_type || "-"} / {l.target_id || "-"}</td>
                <td className="p-3 font-body text-base text-px-muted max-w-[200px] truncate">{l.details || "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center font-pixel text-[8px] text-px-muted">TIDAK ADA LOG</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
