import { useState } from "react";
import api from "../lib/api";

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState("promo");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const handleSend = async () => {
    if (!title || !message) { setErr("Isi judul dan pesan"); return; }
    setLoading(true); setMsg(""); setErr("");
    try {
      const r = await api.post("/admin/broadcast", { title, message, notif_type: notifType });
      if (r.data.success) {
        setMsg(r.data.message);
        setTitle(""); setMessage("");
      }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal mengirim"); }
    finally { setLoading(false); }
  };

  const templates = [
    { name: "Promo", title: "Promo Spesial!", message: "Dapatkan diskon 20% untuk semua produk hari ini! Gunakan kode: PROMO20", type: "promo" },
    { name: "Maintenance", title: "Maintenance Sistem", message: "Sistem akan maintenance pada pukul 02:00-04:00 WIB. Mohon maaf atas ketidaknyamanannya.", type: "info" },
    { name: "Update", title: "Fitur Baru!", message: "Kami telah menambahkan fitur baru. Cek sekarang dan nikmati kemudahannya!", type: "info" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// BROADCAST</div>
        <h2 className="font-pixel text-lg text-px-white">KIRIM NOTIFIKASI</h2>
      </div>

      {msg && <div className="bg-px-primary/10 border-[3px] border-px-primary p-4"><span className="font-pixel text-[7px] text-px-primary">{msg}</span></div>}
      {err && <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-4"><span className="font-pixel text-[7px] text-px-secondary">{err}</span></div>}

      {/* Templates */}
      <div className="bg-px-card border-[3px] border-px-border p-6">
        <div className="font-pixel text-[8px] text-px-accent mb-4 tracking-wider">TEMPLATE CEPAT</div>
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button key={t.name} onClick={() => { setTitle(t.title); setMessage(t.message); setNotifType(t.type); }}
              className="font-pixel text-[7px] px-4 py-2 border-[3px] border-px-border text-px-muted hover:border-px-yellow hover:text-px-yellow transition-all">
              {t.name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-px-card border-[3px] border-px-border p-6">
        <div className="font-pixel text-[9px] text-px-primary mb-6 tracking-wider">BUAT NOTIFIKASI</div>
        <div className="space-y-4">
          <div>
            <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">JUDUL</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
              placeholder="Promo Spesial!" />
          </div>
          <div>
            <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">PESAN</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
              className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none resize-none"
              placeholder="Tulis pesan notifikasi..." />
          </div>
          <div>
            <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">TIPE</label>
            <select value={notifType} onChange={(e) => setNotifType(e.target.value)}
              className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none">
              <option value="promo">Promo</option>
              <option value="info">Info</option>
              <option value="success">Sukses</option>
              <option value="failed">Peringatan</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="font-pixel text-[6px] text-px-muted">Akan dikirim ke SEMUA user aktif</div>
          <button onClick={handleSend} disabled={loading}
            className="font-pixel text-[9px] px-8 py-3 bg-px-primary border-4 border-px-primary text-px-bg tracking-wider hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all disabled:opacity-50">
            {loading ? "MENGIRIM..." : "KIRIM KE SEMUA"}
          </button>
        </div>
      </div>
    </div>
  );
}
