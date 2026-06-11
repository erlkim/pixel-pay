import { useState, useEffect } from "react";
import api from "../lib/api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get("/admin/settings").then((r) => {
      if (r.data.success) setSettings(r.data.data.settings);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (key: string, value: string) => {
    setMsg(""); setErr("");
    try {
      const r = await api.post("/admin/settings/update", { key, value });
      if (r.data.success) {
        setMsg(`Setting "${key}" berhasil diubah!`);
        setSettings({ ...settings, [key]: value });
      }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal"); }
  };

  const labels: Record<string, string> = {
    platform_name: "NAMA PLATFORM",
    default_markup: "DEFAULT MARKUP (%)",
    min_transaction: "MINIMAL TRANSAKSI (Rp)",
    auto_refund: "AUTO REFUND (true/false)",
    maintenance_mode: "MAINTENANCE MODE (true/false)",
    support_whatsapp: "WHATSAPP SUPPORT",
    support_email: "EMAIL SUPPORT",
  };

  if (loading) return <div className="p-8 font-pixel text-[9px] text-px-primary animate-blink">LOADING SETTINGS...</div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// SYSTEM</div>
        <h2 className="font-pixel text-lg text-px-white">PENGATURAN SISTEM</h2>
      </div>

      {msg && <div className="bg-px-primary/10 border-[3px] border-px-primary p-3"><span className="font-pixel text-[7px] text-px-primary">{msg}</span></div>}
      {err && <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3"><span className="font-pixel text-[7px] text-px-secondary">{err}</span></div>}

      <div className="space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <SettingItem key={key} label={labels[key] || key} settingKey={key} value={value} onSave={handleSave} />
        ))}
      </div>
    </div>
  );
}

function SettingItem({ label, settingKey, value, onSave }: { label: string; settingKey: string; value: string; onSave: (k: string, v: string) => void }) {
  const [val, setVal] = useState(value);
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-px-card border-[3px] border-px-border p-5 flex items-center gap-4">
      <div className="flex-1">
        <div className="font-pixel text-[7px] text-px-accent tracking-wider mb-1">{label}</div>
        {editing ? (
          <input type="text" value={val} onChange={(e) => setVal(e.target.value)}
            className="w-full px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none" />
        ) : (
          <div className="font-body text-lg text-px-white">{value}</div>
        )}
      </div>
      {editing ? (
        <div className="flex gap-2">
          <button onClick={() => { onSave(settingKey, val); setEditing(false); }}
            className="font-pixel text-[6px] px-4 py-2 border-[3px] border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg transition-all">
            SIMPAN
          </button>
          <button onClick={() => { setVal(value); setEditing(false); }}
            className="font-pixel text-[6px] px-4 py-2 border-[3px] border-px-muted text-px-muted hover:text-px-white transition-all">
            BATAL
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)}
          className="font-pixel text-[6px] px-4 py-2 border-[3px] border-px-accent text-px-accent hover:bg-px-accent hover:text-px-bg transition-all">
          EDIT
        </button>
      )}
    </div>
  );
}
