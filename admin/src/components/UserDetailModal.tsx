import { useState, useEffect } from "react";
import api from "../lib/api";

interface Props {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function UserDetailModal({ userId, onClose, onUpdate }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [newPw, setNewPw] = useState("");
  const [balanceAmt, setBalanceAmt] = useState("");
  const [balanceDesc, setBalanceDesc] = useState("");
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    api.get(`/admin/user/${userId}`).then((r) => {
      if (r.data.success) setData(r.data.data);
    }).catch(() => setErr("Gagal load data")).finally(() => setLoading(false));
  }, [userId]);

  const handleBlock = async (blocked: boolean) => {
    if (blocked && !confirm("Yakin blokir user ini?")) return;
    setActionLoading("block"); setMsg(""); setErr("");
    try {
      const r = await api.post(`/admin/user/${userId}/block`, { blocked, reason: blockReason || null });
      if (r.data.success) { setMsg(r.data.message); setData({ ...data, user: { ...data.user, is_blocked: blocked } }); onUpdate(); }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal"); }
    finally { setActionLoading(""); }
  };

  const handleResetPw = async () => {
    if (!newPw || newPw.length < 6) { setErr("Password minimal 6 karakter"); return; }
    setActionLoading("pw"); setMsg(""); setErr("");
    try {
      const r = await api.post(`/admin/user/${userId}/reset-password`, { new_password: newPw });
      if (r.data.success) { setMsg("Password berhasil direset!"); setNewPw(""); }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal"); }
    finally { setActionLoading(""); }
  };

  const handleBalance = async () => {
    const amt = parseFloat(balanceAmt);
    if (isNaN(amt) || amt === 0) { setErr("Masukkan nominal yang valid"); return; }
    setActionLoading("balance"); setMsg(""); setErr("");
    try {
      const r = await api.post(`/admin/user/${userId}/edit-balance`, { amount: amt, description: balanceDesc || "Adjustment admin" });
      if (r.data.success) { setMsg(r.data.message); setBalanceAmt(""); setBalanceDesc(""); onUpdate(); }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal"); }
    finally { setActionLoading(""); }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="font-pixel text-[9px] text-px-primary animate-blink">LOADING...</div>
    </div>
  );

  if (!data) return null;
  const { user, wallet, stats, recent_transactions } = data;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="bg-px-card border-[4px] border-px-primary w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b-[3px] border-px-border flex items-center justify-between sticky top-0 bg-px-card z-10">
          <div className="font-pixel text-[10px] text-px-primary tracking-wider">USER DETAIL</div>
          <button onClick={onClose} className="font-pixel text-[10px] text-px-muted hover:text-px-secondary">X</button>
        </div>

        <div className="p-6 space-y-6">
          {msg && <div className="bg-px-primary/10 border-[3px] border-px-primary p-3"><span className="font-pixel text-[7px] text-px-primary">{msg}</span></div>}
          {err && <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3"><span className="font-pixel text-[7px] text-px-secondary">{err}</span></div>}

          {/* User Info */}
          <div className="bg-px-bg border-[3px] border-px-border p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 border-[3px] border-px-primary flex items-center justify-center">
                <span className="font-pixel text-lg text-px-primary">{user.full_name?.charAt(0)}</span>
              </div>
              <div>
                <div className="font-pixel text-[10px] text-px-white">{user.full_name}</div>
                <div className="font-body text-lg text-px-muted">{user.email}</div>
                <div className="font-body text-lg text-px-muted">{user.phone}</div>
              </div>
              <div className="ml-auto flex gap-2">
                <span className={`font-pixel text-[6px] px-2 py-1 border-[2px] ${user.is_blocked ? "border-px-secondary text-px-secondary" : "border-px-primary text-px-primary"}`}>
                  {user.is_blocked ? "BLOCKED" : "AKTIF"}
                </span>
                <span className="font-pixel text-[6px] px-2 py-1 border-[2px] border-px-accent text-px-accent">{user.role.toUpperCase()}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="font-pixel text-[6px] text-px-muted mb-1">SALDO</div>
                <div className="font-pixel text-[12px] text-px-yellow">Rp {parseFloat(wallet?.balance || "0").toLocaleString("id-ID")}</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-[6px] text-px-muted mb-1">TOTAL TX</div>
                <div className="font-pixel text-[12px] text-px-white">{stats.total_transactions}</div>
              </div>
              <div className="text-center">
                <div className="font-pixel text-[6px] text-px-muted mb-1">TOTAL BELANJA</div>
                <div className="font-pixel text-[12px] text-px-primary">Rp {parseFloat(stats.total_spent).toLocaleString("id-ID")}</div>
              </div>
            </div>
          </div>

          {/* Block/Unblock */}
          <div className="bg-px-bg border-[3px] border-px-border p-4">
            <div className="font-pixel text-[8px] text-px-yellow mb-3 tracking-wider">BLOKIR USER</div>
            <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Alasan blokir (opsional)"
              className="w-full px-3 py-2 bg-px-card border-[3px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none mb-3" />
            <button onClick={() => handleBlock(!user.is_blocked)} disabled={actionLoading === "block"}
              className={`font-pixel text-[7px] px-6 py-2 border-[3px] transition-all ${user.is_blocked ? "border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg" : "border-px-secondary text-px-secondary hover:bg-px-secondary hover:text-px-white"} disabled:opacity-50`}>
              {actionLoading === "block" ? "LOADING..." : user.is_blocked ? "UNBLOCK USER" : "BLOKIR USER"}
            </button>
          </div>

          {/* Reset Password */}
          <div className="bg-px-bg border-[3px] border-px-border p-4">
            <div className="font-pixel text-[8px] text-px-accent mb-3 tracking-wider">RESET PASSWORD</div>
            <div className="flex gap-3">
              <input type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Password baru"
                className="flex-1 px-3 py-2 bg-px-card border-[3px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none" />
              <button onClick={handleResetPw} disabled={actionLoading === "pw"}
                className="font-pixel text-[7px] px-6 py-2 border-[3px] border-px-accent text-px-accent hover:bg-px-accent hover:text-px-bg transition-all disabled:opacity-50">
                {actionLoading === "pw" ? "..." : "RESET"}
              </button>
            </div>
          </div>

          {/* Edit Balance */}
          <div className="bg-px-bg border-[3px] border-px-border p-4">
            <div className="font-pixel text-[8px] text-px-primary mb-3 tracking-wider">EDIT SALDO</div>
            <div className="flex gap-3 mb-3">
              <input type="number" value={balanceAmt} onChange={(e) => setBalanceAmt(e.target.value)} placeholder="Nominal (+tambah, -kurang)"
                className="flex-1 px-3 py-2 bg-px-card border-[3px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none" />
              <input type="text" value={balanceDesc} onChange={(e) => setBalanceDesc(e.target.value)} placeholder="Keterangan"
                className="flex-1 px-3 py-2 bg-px-card border-[3px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none" />
            </div>
            <button onClick={handleBalance} disabled={actionLoading === "balance"}
              className="font-pixel text-[7px] px-6 py-2 border-[3px] border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg transition-all disabled:opacity-50">
              {actionLoading === "balance" ? "..." : "SIMPAN"}
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="bg-px-bg border-[3px] border-px-border">
            <div className="p-4 border-b-[3px] border-px-border">
              <span className="font-pixel text-[8px] text-px-accent tracking-wider">TRANSAKSI TERAKHIR</span>
            </div>
            {recent_transactions.length === 0 ? (
              <div className="p-6 text-center font-pixel text-[7px] text-px-muted">BELUM ADA TRANSAKSI</div>
            ) : recent_transactions.map((t: any) => (
              <div key={t.id} className="flex items-center gap-3 p-3 border-b border-px-border/30 last:border-b-0">
                <span className={`font-pixel text-[6px] px-2 py-0.5 border-[2px] ${t.status === "success" ? "text-px-primary border-px-primary" : t.status === "failed" ? "text-px-secondary border-px-secondary" : "text-px-yellow border-px-yellow"}`}>
                  {t.status}
                </span>
                <div className="flex-1 font-pixel text-[7px] text-px-white">{t.ref_id}</div>
                <div className="font-pixel text-[8px] text-px-yellow">Rp {parseFloat(t.sell_price).toLocaleString("id-ID")}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t-[3px] border-px-border">
          <button onClick={onClose}
            className="w-full font-pixel text-[7px] py-3 border-[3px] border-px-border text-px-muted hover:border-px-white hover:text-px-white transition-all">
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
}
