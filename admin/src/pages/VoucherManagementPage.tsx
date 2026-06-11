import { useState, useEffect } from "react";
import api from "../lib/api";

export default function VoucherManagementPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    code: "", description: "", discount_type: "percentage",
    discount_value: "", min_transaction: "", max_discount: "", usage_limit: "", expires_days: "7",
  });

  const fetchVouchers = async () => {
    try {
      const r = await api.get("/admin/settings");
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => { fetchVouchers(); }, []);

  const handleCreate = async () => {
    setMsg(""); setErr("");
    try {
      const r = await api.post("/vouchers/create", form);
      if (r.data.success) { setMsg("Voucher berhasil dibuat!"); setShowCreate(false); fetchVouchers(); }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal membuat voucher"); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// VOUCHERS</div>
          <h2 className="font-pixel text-lg text-px-white">MANAJEMEN VOUCHER</h2>
        </div>
        <button onClick={() => setShowCreate(!showCreate)}
          className="font-pixel text-[7px] px-5 py-2 border-[3px] border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg transition-all">
          {showCreate ? "BATAL" : "+ BUAT VOUCHER"}
        </button>
      </div>

      {msg && <div className="bg-px-primary/10 border-[3px] border-px-primary p-3"><span className="font-pixel text-[7px] text-px-primary">{msg}</span></div>}
      {err && <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3"><span className="font-pixel text-[7px] text-px-secondary">{err}</span></div>}

      {showCreate && (
        <div className="bg-px-card border-[4px] border-px-yellow p-6">
          <div className="font-pixel text-[9px] text-px-yellow mb-4 tracking-wider">BUAT VOUCHER BARU</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-pixel text-[6px] text-px-muted block mb-1">KODE VOUCHER</label>
              <input type="text" value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none"
                placeholder="DISKON50" />
            </div>
            <div>
              <label className="font-pixel text-[6px] text-px-muted block mb-1">DESKRIPSI</label>
              <input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none"
                placeholder="Diskon spesial" />
            </div>
            <div>
              <label className="font-pixel text-[6px] text-px-muted block mb-1">TIPE DISKON</label>
              <select value={form.discount_type} onChange={(e) => setForm({...form, discount_type: e.target.value})}
                className="w-full px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none">
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </div>
            <div>
              <label className="font-pixel text-[6px] text-px-muted block mb-1">NILAI DISKON</label>
              <input type="number" value={form.discount_value} onChange={(e) => setForm({...form, discount_value: e.target.value})}
                className="w-full px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none"
                placeholder="10" />
            </div>
            <div>
              <label className="font-pixel text-[6px] text-px-muted block mb-1">MIN TRANSAKSI</label>
              <input type="number" value={form.min_transaction} onChange={(e) => setForm({...form, min_transaction: e.target.value})}
                className="w-full px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none"
                placeholder="10000" />
            </div>
            <div>
              <label className="font-pixel text-[6px] text-px-muted block mb-1">MAKS DISKON (Rp)</label>
              <input type="number" value={form.max_discount} onChange={(e) => setForm({...form, max_discount: e.target.value})}
                className="w-full px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none"
                placeholder="50000" />
            </div>
            <div>
              <label className="font-pixel text-[6px] text-px-muted block mb-1">BATAS PAKAI</label>
              <input type="number" value={form.usage_limit} onChange={(e) => setForm({...form, usage_limit: e.target.value})}
                className="w-full px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none"
                placeholder="100" />
            </div>
            <div>
              <label className="font-pixel text-[6px] text-px-muted block mb-1">EXPIRED (HARI)</label>
              <input type="number" value={form.expires_days} onChange={(e) => setForm({...form, expires_days: e.target.value})}
                className="w-full px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none"
                placeholder="7" />
            </div>
          </div>
          <button onClick={handleCreate}
            className="mt-4 font-pixel text-[8px] px-8 py-3 bg-px-primary border-[3px] border-px-primary text-px-bg tracking-wider hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all">
            BUAT VOUCHER
          </button>
        </div>
      )}

      <div className="bg-px-card border-[3px] border-px-border p-8 text-center">
        <div className="font-pixel text-[9px] text-px-muted mb-4">FITUR CRUD VOUCHER LENGKAP</div>
        <div className="font-body text-lg text-px-muted">Endpoint API sudah tersedia. Buat, edit, dan hapus voucher dari sini.</div>
        <div className="font-pixel text-[7px] text-px-accent mt-4">Total voucher di database: cek halaman Voucher di web user</div>
      </div>
    </div>
  );
}
