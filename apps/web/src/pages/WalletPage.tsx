import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function WalletPage() {
  const [balance, setBalance] = useState("Rp 0");
  const [logs, setLogs] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const fetchBalance = async () => {
    try {
      const r = await api.get("/wallet/balance");
      if (r.data.success) setBalance(r.data.data.wallet.balance_formatted);
    } catch {}
  };

  const fetchLogs = async () => {
    try {
      const r = await api.get("/wallet/history");
      if (r.data.success) setLogs(r.data.data.logs);
    } catch {}
  };

  useEffect(() => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    fetchBalance();
    fetchLogs();
  }, []);

  const typeIcon = (t: string) => {
    if (t === "credit") return "+";
    return "-";
  };

  const typeColor = (t: string) => {
    if (t === "credit") return "text-px-primary";
    return "text-px-secondary";
  };

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// WALLET</div>
          <h2 className="font-pixel text-xl text-px-white">DOMPET DIGITAL</h2>
        </div>

        {msg && <div className="bg-px-primary/10 border-[3px] border-px-primary p-3 mb-6"><span className="font-pixel text-[7px] text-px-primary">{msg}</span></div>}
        {err && <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3 mb-6"><span className="font-pixel text-[7px] text-px-secondary">{err}</span></div>}

        {/* Balance Card */}
        <div className="bg-px-card border-[4px] border-px-primary p-8 text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-px-primary" />
          <div className="font-pixel text-[8px] text-px-muted mb-2 tracking-wider">SALDO ANDA</div>
          <div className="font-pixel text-3xl text-px-yellow glow-y mb-6">{balance}</div>
          <button onClick={() => nav("/topup")}
            className="font-pixel text-[10px] px-10 py-4 bg-px-primary border-4 border-px-primary text-px-bg tracking-wider hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] transition-all">
            TOP UP SALDO
          </button>
          <div className="font-pixel text-[6px] text-px-muted mt-3">
            Bank Transfer &bull; E-Wallet &bull; QRIS &bull; Kartu Kredit
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
            <div className="font-pixel text-[6px] text-px-muted mb-1">TOP UP</div>
            <div className="font-pixel text-[8px] text-px-primary">BCA, BNI, BRI</div>
            <div className="font-pixel text-[6px] text-px-muted">Mandiri, GoPay</div>
          </div>
          <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
            <div className="font-pixel text-[6px] text-px-muted mb-1">E-WALLET</div>
            <div className="font-pixel text-[8px] text-px-primary">DANA, OVO</div>
            <div className="font-pixel text-[6px] text-px-muted">ShopeePay</div>
          </div>
          <div className="bg-px-card border-[3px] border-px-border p-4 text-center">
            <div className="font-pixel text-[6px] text-px-muted mb-1">INSTAN</div>
            <div className="font-pixel text-[8px] text-px-primary">QRIS</div>
            <div className="font-pixel text-[6px] text-px-muted">Semua Bank</div>
          </div>
        </div>

        {/* Transaction Log */}
        <div className="bg-px-card border-[3px] border-px-border">
          <div className="p-4 border-b-[3px] border-px-border flex items-center justify-between">
            <span className="font-pixel text-[8px] text-px-accent tracking-wider">RIWAYAT SALDO</span>
            <span className="font-pixel text-[6px] text-px-muted">{logs.length} transaksi</span>
          </div>
          {logs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="font-pixel text-[8px] text-px-muted">BELUM ADA RIWAYAT</div>
            </div>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-4 p-4 border-b border-px-border/30 last:border-b-0">
                <div className={`w-10 h-10 flex items-center justify-center border-[3px] text-lg font-bold ${typeColor(log.type)} ${log.type === "credit" ? "border-px-primary" : "border-px-secondary"}`}>
                  {typeIcon(log.type)}
                </div>
                <div className="flex-1">
                  <div className="font-body text-lg text-px-white">{log.description}</div>
                  <div className="font-body text-sm text-px-muted">{new Date(log.created_at).toLocaleString("id-ID")}</div>
                </div>
                <div className="text-right">
                  <div className={`font-pixel text-[10px] ${typeColor(log.type)}`}>
                    {log.type === "credit" ? "+" : "-"}Rp {parseFloat(log.amount).toLocaleString("id-ID")}
                  </div>
                  <div className="font-pixel text-[6px] text-px-muted">
                    Saldo: Rp {parseFloat(log.balance_after).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
