import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let res;
      if (isRegister) {
        res = await api.post("/auth/register", {
          email, password: pw, full_name: name, phone,
        });
      } else {
        res = await api.post("/auth/login", { email, password: pw });
      }
      const data = res.data;
      if (data.success) {
        localStorage.setItem("px_token", data.data.token);
        localStorage.setItem("px_user", JSON.stringify(data.data.user));
        nav("/dashboard");
      } else {
        setError(data.error?.message || "Gagal");
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="fixed inset-0 scanline pointer-events-none" />
      <div className="bg-px-card border-[4px] border-px-primary p-10 w-full max-w-md relative">
        <div className="absolute -inset-1 bg-px-primary/5 blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="text-center mb-8">
            <Link to="/" className="font-pixel text-xl text-px-primary glow tracking-wider">
              PIXEL<span className="text-px-secondary">PAY</span>
            </Link>
            <div className="font-pixel text-[8px] text-px-accent mt-2 tracking-[4px]">
              {isRegister ? "REGISTER" : "LOGIN"}
            </div>
          </div>

          {error && (
            <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3 mb-6">
              <span className="font-pixel text-[7px] text-px-secondary">{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            {isRegister && (
              <>
                <div>
                  <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">NAMA LENGKAP</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                    placeholder="Nama kamu" required />
                </div>
                <div>
                  <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">NO. HP</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                    placeholder="08xxxxxxxxxx" required />
                </div>
              </>
            )}
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">EMAIL</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                placeholder="email@domain.com" required />
            </div>
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">PASSWORD</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                placeholder="********" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full font-pixel text-[11px] px-10 py-4 bg-px-primary border-4 border-px-primary text-px-bg tracking-[0.2em] hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50">
              {loading ? "LOADING..." : isRegister ? "REGISTER" : "LOGIN"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => { setIsRegister(!isRegister); setError(""); }}
              className="font-pixel text-[7px] text-px-accent hover:text-px-primary transition-colors">
              {isRegister ? "SUDAH PUNYA AKUN? LOGIN" : "BELUM PUNYA AKUN? REGISTER"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
