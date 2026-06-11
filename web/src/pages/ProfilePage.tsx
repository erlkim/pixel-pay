import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    api.get("/profile/get").then((r) => {
      if (r.data.success) {
        const u = r.data.data.user;
        setUser(u);
        setName(u.full_name);
        setPhone(u.phone);
      }
    });
  }, []);

  const handleSave = async () => {
    setLoading(true); setMsg(""); setErr("");
    try {
      const r = await api.post("/profile/update", { full_name: name, phone });
      if (r.data.success) {
        setMsg("Profil berhasil diperbarui!");
        const u = r.data.data.user;
        setUser(u);
        localStorage.setItem("px_user", JSON.stringify(u));
      }
    } catch (e: any) {
      setErr(e.response?.data?.error?.message || "Gagal update profil");
    } finally { setLoading(false); }
  };

  const handleChangePw = async () => {
    if (!pwOld || !pwNew) { setPwErr("Isi semua field"); return; }
    if (pwNew.length < 6) { setPwErr("Password baru minimal 6 karakter"); return; }
    setPwLoading(true); setPwMsg(""); setPwErr("");
    try {
      const r = await api.post("/profile/change-password", {
        current_password: pwOld, new_password: pwNew,
      });
      if (r.data.success) {
        setPwMsg("Password berhasil diubah!");
        setPwOld(""); setPwNew("");
      }
    } catch (e: any) {
      setPwErr(e.response?.data?.error?.message || "Gagal ubah password");
    } finally { setPwLoading(false); }
  };

  if (!user) {
    return <section className="py-20 min-h-screen flex items-center justify-center">
      <div className="font-pixel text-[9px] text-px-primary animate-blink">LOADING...</div>
    </section>;
  }

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 space-y-8">
        <div className="text-center">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// PROFILE</div>
          <h2 className="font-pixel text-xl text-px-white">PENGATURAN AKUN</h2>
        </div>

        {/* Avatar & Info */}
        <div className="bg-px-card border-[4px] border-px-primary p-8 flex items-center gap-6">
          <div className="w-20 h-20 border-[4px] border-px-primary flex items-center justify-center bg-px-primary/10 flex-shrink-0">
            <span className="font-pixel text-2xl text-px-primary">{user.full_name?.charAt(0) || "U"}</span>
          </div>
          <div>
            <div className="font-pixel text-[12px] text-px-white mb-1">{user.full_name}</div>
            <div className="font-body text-lg text-px-muted">{user.email}</div>
            <div className="mt-2">
              <span className="font-pixel text-[6px] px-3 py-1 border-[2px] border-px-accent text-px-accent tracking-wider">
                {user.role?.toUpperCase() || "USER"}
              </span>
              <span className="font-pixel text-[6px] px-3 py-1 border-[2px] border-px-primary text-px-primary tracking-wider ml-2">
                {user.is_active ? "AKTIF" : "NONAKTIF"}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-px-card border-[3px] border-px-border p-6">
          <div className="font-pixel text-[9px] text-px-primary mb-6 tracking-wider">EDIT PROFIL</div>
          {msg && <div className="bg-px-primary/10 border-[3px] border-px-primary p-3 mb-4"><span className="font-pixel text-[7px] text-px-primary">{msg}</span></div>}
          {err && <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3 mb-4"><span className="font-pixel text-[7px] text-px-secondary">{err}</span></div>}
          <div className="space-y-4">
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">NAMA LENGKAP</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none" />
            </div>
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">NO. HP</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none" />
            </div>
            <div>
              <label className="font-pixel text-[7px] text-px-muted tracking-wider block mb-2">EMAIL (tidak bisa diubah)</label>
              <input type="email" value={user.email} disabled
                className="w-full px-4 py-3 bg-px-bg/50 border-[3px] border-px-border/50 text-px-muted font-body text-xl cursor-not-allowed" />
            </div>
            <button onClick={handleSave} disabled={loading}
              className="font-pixel text-[9px] px-8 py-3 bg-px-primary border-4 border-px-primary text-px-bg tracking-wider hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all disabled:opacity-50">
              {loading ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-px-card border-[3px] border-px-border p-6">
          <div className="font-pixel text-[9px] text-px-yellow mb-6 tracking-wider">UBAH PASSWORD</div>
          {pwMsg && <div className="bg-px-primary/10 border-[3px] border-px-primary p-3 mb-4"><span className="font-pixel text-[7px] text-px-primary">{pwMsg}</span></div>}
          {pwErr && <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3 mb-4"><span className="font-pixel text-[7px] text-px-secondary">{pwErr}</span></div>}
          <div className="space-y-4">
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">PASSWORD LAMA</label>
              <input type="password" value={pwOld} onChange={(e) => setPwOld(e.target.value)}
                className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                placeholder="********" />
            </div>
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">PASSWORD BARU</label>
              <input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)}
                className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                placeholder="Minimal 6 karakter" />
            </div>
            <button onClick={handleChangePw} disabled={pwLoading}
              className="font-pixel text-[9px] px-8 py-3 bg-px-yellow border-4 border-px-yellow text-px-bg tracking-wider hover:shadow-[0_0_30px_rgba(255,230,0,0.4)] transition-all disabled:opacity-50">
              {pwLoading ? "MENGUBAH..." : "UBAH PASSWORD"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
