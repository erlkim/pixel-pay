import { useState } from "react";
import api from "../lib/api";

interface Props {
  tx: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TransactionDetailModal({ tx, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const handleRetry = async () => {
    setLoading("retry"); setMsg(""); setErr("");
    try {
      const r = await api.post(`/admin/transaction/${tx.id}/retry`);
      if (r.data.success) { setMsg("Transaksi sedang di-proses ulang!"); setTimeout(() => onUpdate(), 2000); }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal retry"); }
    finally { setLoading(""); }
  };

  const handleRefund = async () => {
    if (!confirm("Yakin refund transaksi ini? Saldo user akan dikembalikan.")) return;
    setLoading("refund"); setMsg(""); setErr("");
    try {
      const r = await api.post(`/admin/transaction/${tx.id}/refund`);
      if (r.data.success) { setMsg("Refund berhasil!"); setTimeout(() => { onUpdate(); onClose(); }, 1500); }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal refund"); }
    finally { setLoading(""); }
  };

  const statusColor = (s: string) => {
    if (s === "success") return "text-px-primary border-px-primary";
    if (s === "failed") return "text-px-secondary border-px-secondary";
    if (s === "refunded") return "text-px-purple border-px-purple";
    return "text-px-yellow border-px-yellow";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="bg-px-card border-[4px] border-px-primary w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b-[3px] border-px-border flex items-center justify-between">
          <div className="font-pixel text-[10px] text-px-primary tracking-wider">TRANSACTION DETAIL</div>
          <button onClick={onClose} className="font-pixel text-[10px] text-px-muted hover:text-px-secondary transition-colors">X</button>
        </div>

        <div className="p-6 space-y-4">
          {msg && <div className="bg-px-primary/10 border-[3px] border-px-primary p-3"><span className="font-pixel text-[7px] text-px-primary">{msg}</span></div>}
          {err && <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3"><span className="font-pixel text-[7px] text-px-secondary">{err}</span></div>}

          <div className="text-center py-4">
            <span className={`font-pixel text-[10px] px-4 py-2 border-[3px] ${statusColor(tx.status)}`}>{tx.status.toUpperCase()}</span>
          </div>

          {[
            ["REF ID", tx.ref_id],
            ["NOMOR", tx.customer_number],
            ["HARGA JUAL", `Rp ${parseFloat(tx.sell_price).toLocaleString("id-ID")}`],
            ["HARGA DASAR", `Rp ${parseFloat(tx.base_price).toLocaleString("id-ID")}`],
            ["PROFIT", `Rp ${parseFloat(tx.profit).toLocaleString("id-ID")}`],
            ["STATUS", tx.status.toUpperCase()],
            ["SN / TOKEN", tx.serial_number || "-"],
            ["DIGIFLAZZ STATUS", tx.digiflazz_status || "-"],
            ["DIGIFLAZZ MSG", tx.digiflazz_message || "-"],
            ["REF ID DIGIFLAZZ", tx.digiflazz_ref_id || "-"],
            ["RETRY COUNT", String(tx.retry_count || 0)],
            ["TANGGAL", new Date(tx.created_at).toLocaleString("id-ID")],
            ["SELESAI", tx.completed_at ? new Date(tx.completed_at).toLocaleString("id-ID") : "-"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-px-border/30">
              <span className="font-pixel text-[6px] text-px-muted tracking-wider">{label}</span>
              <span className="font-body text-lg text-px-white text-right max-w-[200px] break-all">{value}</span>
            </div>
          ))}
        </div>

        <div className="p-6 border-t-[3px] border-px-border flex gap-3">
          {(tx.status === "failed" || tx.status === "pending") && (
            <button onClick={handleRetry} disabled={loading === "retry"}
              className="flex-1 font-pixel text-[7px] py-3 border-[3px] border-px-yellow text-px-yellow hover:bg-px-yellow hover:text-px-bg transition-all disabled:opacity-50">
              {loading === "retry" ? "RETRYING..." : "RETRY"}
            </button>
          )}
          {tx.status !== "success" && tx.status !== "refunded" && (
            <button onClick={handleRefund} disabled={loading === "refund"}
              className="flex-1 font-pixel text-[7px] py-3 border-[3px] border-px-secondary text-px-secondary hover:bg-px-secondary hover:text-px-white transition-all disabled:opacity-50">
              {loading === "refund" ? "REFUNDING..." : "REFUND"}
            </button>
          )}
          <button onClick={onClose}
            className="flex-1 font-pixel text-[7px] py-3 border-[3px] border-px-border text-px-muted hover:border-px-white hover:text-px-white transition-all">
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
}
