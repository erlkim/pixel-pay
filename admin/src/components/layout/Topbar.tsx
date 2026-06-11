import { useNavigate, useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/": "DASHBOARD",
  "/users": "MANAJEMEN USER",
  "/transactions": "TRANSAKSI",
  "/products": "PRODUK",
  "/digiflazz": "DIGIFLAZZ",
  "/prices": "MANAJEMEN HARGA",
  "/reports": "LAPORAN KEUANGAN",
  "/vouchers": "VOUCHER",
  "/payments": "PAYMENT GATEWAY",
  "/settings": "PENGATURAN",
  "/logs": "LOG AKTIVITAS",
  "/broadcast": "BROADCAST",
};

export default function Topbar() {
  const nav = useNavigate();
  const loc = useLocation();
  const userStr = localStorage.getItem("px_admin_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const title = titles[loc.pathname] || "ADMIN";

  const logout = () => {
    localStorage.removeItem("px_admin_token");
    localStorage.removeItem("px_admin_user");
    nav("/login");
  };

  return (
    <div className="bg-px-surface border-b-[3px] border-px-border px-8 py-4 flex items-center justify-between sticky top-0 z-40">
      <h2 className="font-pixel text-[11px] text-px-white tracking-wider">// {title}</h2>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-px-primary animate-blink" />
          <span className="font-pixel text-[7px] text-px-primary">DIGIFLAZZ: CONNECTED</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[7px] text-px-muted">{user?.full_name || "ADMIN"} ({user?.role?.toUpperCase() || "ADMIN"})</span>
          <button onClick={logout}
            className="font-pixel text-[6px] border-[2px] border-px-secondary text-px-secondary px-3 py-1 hover:bg-px-secondary hover:text-px-white transition-all">
            LOGOUT
          </button>
        </div>
      </div>
    </div>
  );
}
