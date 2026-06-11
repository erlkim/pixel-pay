import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PixelButton from "../components/ui/PixelButton";
import api from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email,
        password: pw,
      });

      const data = res.data;

      if (data.success) {
        const user = data.data.user;

        if (user.role !== "admin" && user.role !== "superadmin") {
          setError("Anda bukan admin!");
          setLoading(false);
          return;
        }

        localStorage.setItem("px_admin_token", data.data.token);
        localStorage.setItem("px_admin_user", JSON.stringify(user));
        nav("/");
      } else {
        setError(data.error?.message || "Login gagal");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || "Email atau password salah";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-px-bg flex items-center justify-center">
      <div className="fixed inset-0 scanline pointer-events-none" />
      <div className="bg-px-card border-[4px] border-px-primary p-10 w-full max-w-md relative">
        <div className="absolute -inset-1 bg-px-primary/5 blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-pixel text-xl text-px-primary glow tracking-wider mb-2">
              PIXEL PAY
            </h1>
            <div className="font-pixel text-[8px] text-px-accent tracking-[4px]">
              ADMIN LOGIN
            </div>
          </div>

          {error && (
            <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3 mb-6">
              <span className="font-pixel text-[7px] text-px-secondary">
                {error}
              </span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                placeholder="admin@pixelpay.id"
                required
              />
            </div>
            <div>
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="w-full px-4 py-3.5 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                placeholder="********"
                required
              />
            </div>
            <PixelButton
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "LOADING..." : "LOGIN"}
            </PixelButton>
          </form>

          <div className="mt-6 text-center">
            <span className="font-pixel text-[6px] text-px-muted tracking-wider">
              DEMO: admin@pixelpay.id / admin123
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
