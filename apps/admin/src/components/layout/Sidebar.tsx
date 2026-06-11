import { useLocation, useNavigate } from "react-router-dom";

const sections = [
  { title: "OVERVIEW", items: [
    { path: "/", icon: "📊", label: "DASHBOARD" },
    { path: "/reports", icon: "📈", label: "LAPORAN" },
  ]},
  { title: "MANAJEMEN", items: [
    { path: "/users", icon: "👥", label: "USERS" },
    { path: "/transactions", icon: "💰", label: "TRANSAKSI" },
    { path: "/products", icon: "📦", label: "PRODUK" },
    { path: "/prices", icon: "💲", label: "HARGA" },
    { path: "/vouchers", icon: "🎫", label: "VOUCHER" },
    { path: "/payments", icon: "🏦", label: "PAYMENT GATEWAY" },
  ]},
  { title: "INTEGRATION", items: [
    { path: "/digiflazz", icon: "🔄", label: "DIGIFLAZZ" },
  ]},
  { title: "SYSTEM", items: [
    { path: "/broadcast", icon: "📢", label: "BROADCAST" },
    { path: "/logs", icon: "📋", label: "LOG AKTIVITAS" },
    { path: "/settings", icon: "⚙️", label: "PENGATURAN" },
  ]},
];

export default function Sidebar() {
  const loc = useLocation();
  const nav = useNavigate();
  const userStr = localStorage.getItem("px_admin_user");
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <aside className="w-[260px] bg-px-surface border-r-[3px] border-px-border flex flex-col fixed top-0 left-0 bottom-0 z-50 overflow-y-auto">
      <div className="p-6 border-b-[3px] border-px-border text-center">
        <h1 className="font-pixel text-sm text-px-primary glow tracking-wider">PIXEL<span className="text-px-secondary">PAY</span></h1>
        <div className="font-pixel text-[7px] text-px-accent mt-1.5 tracking-[3px]">ADMIN PANEL</div>
      </div>
      <nav className="flex-1 py-3">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-6 py-2">
              <span className="font-pixel text-[5px] text-px-muted tracking-[3px]">{section.title}</span>
            </div>
            {section.items.map((item) => {
              const active = loc.pathname === item.path || (item.path !== "/" && loc.pathname.startsWith(item.path));
              return (
                <div key={item.path} onClick={() => nav(item.path)}
                  className={`flex items-center gap-3 px-6 py-2.5 cursor-pointer border-l-4 font-pixel text-[7px] tracking-wider transition-all ${
                    active ? "bg-px-primary/10 text-px-primary border-l-px-primary glow" : "text-px-muted border-l-transparent hover:bg-px-primary/5 hover:text-px-primary hover:border-l-px-primary"
                  }`}>
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  {item.label}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="p-4 border-t-[3px] border-px-border">
        <div className="font-pixel text-[7px] text-px-primary mb-1">{user?.full_name || "ADMIN"}</div>
        <div className="font-pixel text-[6px] text-px-muted">{user?.email || ""}</div>
      </div>
    </aside>
  );
}
