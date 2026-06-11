import { useState, useEffect } from "react";
import api from "../lib/api";

interface SyncResult {
  category: string; status: string; count: number; error?: string;
}

export default function DigiflazzPage() {
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [totalSynced, setTotalSynced] = useState(0);
  const [totalInDb, setTotalInDb] = useState(0);
  const [errors, setErrors] = useState(0);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/products/categories").then(async (r) => {
      if (r.data.success) {
        let total = 0;
        const cats = r.data.data.categories;
        for (const cat of cats) {
          try {
            const pr = await api.get(`/products/category/${cat.slug}`);
            if (pr.data.success) total += pr.data.data.products.length;
          } catch {}
        }
        setTotalInDb(total);
      }
    });
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMsg("");
    try {
      const r = await api.post("/admin/sync-products");
      if (r.data.success) {
        const d = r.data.data;
        setResults(d.per_category || []);
        setTotalSynced(d.synced_this_run || 0);
        setTotalInDb(d.total_in_db || 0);
        setErrors(d.errors || 0);
        setMsg(`Sync berhasil! ${d.synced_this_run} produk di-sync. Total di DB: ${d.total_in_db}`);
      }
    } catch (e: any) {
      setMsg("Sync gagal: " + (e.response?.data?.error?.message || e.message));
    }
    setSyncing(false);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// INTEGRATION</div>
          <h2 className="font-pixel text-lg text-px-white">DIGIFLAZZ MANAGEMENT</h2>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-px-card border-[4px] border-px-primary p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-px-primary" />
        <div className="grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="font-pixel text-[6px] text-px-muted mb-2">STATUS KONEKSI</div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-px-primary rounded-full animate-pulse" />
              <span className="font-pixel text-[9px] text-px-primary">CONNECTED</span>
            </div>
          </div>
          <div>
            <div className="font-pixel text-[6px] text-px-muted mb-2">TOTAL PRODUK</div>
            <div className="font-pixel text-2xl text-px-yellow glow-y">{totalInDb}</div>
          </div>
          <div>
            <div className="font-pixel text-[6px] text-px-muted mb-2">SYNC TERAKHIR</div>
            <div className="font-pixel text-[9px] text-px-accent">{results.length > 0 ? "Baru saja" : "Belum pernah"}</div>
          </div>
        </div>
      </div>

      {/* Sync Button */}
      <div className="bg-px-card border-[3px] border-px-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-pixel text-[9px] text-px-primary mb-1">SINKRONISASI PRODUK</div>
            <div className="font-pixel text-[6px] text-px-muted">Tarik produk terbaru dari Digiflazz API</div>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="font-pixel text-[9px] px-8 py-3 bg-px-primary border-4 border-px-primary text-px-bg tracking-wider hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all disabled:opacity-50">
            {syncing ? "SYNCING..." : "SYNC NOW"}
          </button>
        </div>

        {msg && (
          <div className={`border-[3px] p-4 mb-4 ${msg.includes("gagal") ? "bg-px-secondary/10 border-px-secondary" : "bg-px-primary/10 border-px-primary"}`}>
            <span className="font-pixel text-[7px] text-px-white">{msg}</span>
          </div>
        )}

        {syncing && (
          <div className="mb-4">
            <div className="w-full h-3 bg-px-bg border-[2px] border-px-border overflow-hidden">
              <div className="h-full bg-px-primary animate-progress-bar" style={{ width: "60%" }} />
            </div>
            <div className="font-pixel text-[6px] text-px-muted mt-2">Mengambil data dari Digiflazz...</div>
          </div>
        )}
      </div>

      {/* Sync Results */}
      {results.length > 0 && (
        <div className="bg-px-card border-[3px] border-px-border p-6">
          <div className="font-pixel text-[9px] text-px-accent mb-4 tracking-wider">HASIL SYNC</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-px-bg border-[3px] border-px-border p-4 text-center">
              <div className="font-pixel text-[6px] text-px-muted mb-1">DI-SYNC</div>
              <div className="font-pixel text-[14px] text-px-primary">{totalSynced}</div>
            </div>
            <div className="bg-px-bg border-[3px] border-px-border p-4 text-center">
              <div className="font-pixel text-[6px] text-px-muted mb-1">TOTAL DB</div>
              <div className="font-pixel text-[14px] text-px-yellow">{totalInDb}</div>
            </div>
            <div className="bg-px-bg border-[3px] border-px-border p-4 text-center">
              <div className="font-pixel text-[6px] text-px-muted mb-1">BERHASIL</div>
              <div className="font-pixel text-[14px] text-px-primary">{results.filter(r => r.status === "ok").length}</div>
            </div>
            <div className="bg-px-bg border-[3px] border-px-border p-4 text-center">
              <div className="font-pixel text-[6px] text-px-muted mb-1">ERROR</div>
              <div className="font-pixel text-[14px] text-px-secondary">{errors}</div>
            </div>
          </div>

          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between p-3 border-[3px] ${r.status === "ok" ? "border-px-primary" : "border-px-secondary"}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-pixel text-[8px] ${r.status === "ok" ? "text-px-primary" : "text-px-secondary"}`}>
                    {r.status === "ok" ? "✓" : "X"}
                  </span>
                  <span className="font-pixel text-[8px] text-px-white">{r.category}</span>
                </div>
                <div className="text-right">
                  {r.status === "ok" ? (
                    <span className="font-pixel text-[9px] text-px-primary">{r.count} produk</span>
                  ) : (
                    <span className="font-pixel text-[7px] text-px-secondary">{r.error || "Error"}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-px-card border-[3px] border-px-border p-6">
        <div className="font-pixel text-[9px] text-px-accent mb-4 tracking-wider">INFO DIGIFLAZZ</div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-pixel text-[7px] text-px-muted">API ENDPOINT</span>
            <span className="font-body text-lg text-px-white">https://api.digiflazz.com/v1</span>
          </div>
          <div className="flex justify-between">
            <span className="font-pixel text-[7px] text-px-muted">ENVIRONMENT</span>
            <span className="font-pixel text-[8px] text-px-yellow">DEVELOPMENT</span>
          </div>
          <div className="flex justify-between">
            <span className="font-pixel text-[7px] text-px-muted">KATEGORI AKTIF</span>
            <span className="font-body text-lg text-px-white">{results.filter(r => r.status === "ok").length || "Pulsa"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
