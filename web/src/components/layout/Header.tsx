import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/api";

const authLinks = [
  { to: "/dashboard", l: "DASHBOARD" },
  { to: "/products", l: "PRODUK" },
  { to: "/transaction", l: "BELI" },
  { to: "/wallet", l: "WALLET" },
  { to: "/history", l: "RIWAYAT" },
];

const guestLinks = [
  { to: "/", l: "HOME" },
  { to: "/products", l: "PRODUK" },
];

export default function Header() {
  const loc = useLocation();
  const nav = useNavigate();
  const [balance, setBalance] = useState("Rp 0");
  const [user, setUser] = useState<any>(null);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("px_user");
    if (u) {
      setUser(JSON.parse(u));
      api.get("/wallet/balance").then((r) => {
        if (r.data.success) setBalance(r.data.data.wallet.balance_formatted);
      }).catch(() => {});
      api.get("/notifications/list").then((r) => {
        if (r.data.success) setUnread(r.data.data.unread_count);
      }).catch(() => {});
    }
  }, [loc]);

  const logout = () => {
    localStorage.removeItem("px_token");
    localStorage.removeItem("px_user");
    setUser(null);
    nav("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length >= 2) nav(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const links = user ? authLinks : guestLinks;

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-px-bg/95 backdrop-blur-md border-b-[3px] border-px-border">
      <div className="max-w-6xl mx-auto px-6 h-[70px] flex items-center justify-between gap-4">
        <Link to="/" className="font-pixel text-base text-px-primary glow tracking-[3px] flex-shrink-0">
          PIXEL<span className="text-px-secondary">PAY</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs mx-4">
          <div className="flex w-full">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="flex-1 px-3 py-2 bg-px-card border-[3px] border-px-border border-r-0 text-px-white font-body text-base focus:border-px-primary focus:outline-none"
            />
            <button type="submit"
              className="px-3 py-2 bg-px-card border-[3px] border-px-border text-px-muted hover:border-px-primary hover:text-px-primary transition-all">
              🔍
            </button>
          </div>
        </form>

        <ul className="hidden md:flex items-center gap-6 flex-shrink-0">
          {links.map((l) => (
            <li key={l.to}>
              <Link to={l.to}
                className={`font-pixel text-[8px] tracking-wider relative after:absolute after:bottom-[-4px] after:left-0 after:h-[3px] after:bg-px-primary after:transition-all ${
                  loc.pathname === l.to
                    ? "text-px-primary glow after:w-full"
                    : "text-px-muted hover:text-px-primary hover:after:w-full after:w-0"
                }`}>
                {l.l}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <>
              <Link to="/wallet" className="flex items-center gap-2 bg-px-primary/10 border-[3px] border-px-primary px-3 py-2 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all">
                <span className="text-lg">💰</span>
                <div>
                  <div className="font-pixel text-[5px] text-px-primary">SALDO</div>
                  <div className="font-pixel text-[8px] text-px-yellow glow-y">{balance}</div>
                </div>
              </Link>
              <Link to="/notifications" className="relative flex items-center justify-center w-10 h-10 border-[3px] border-px-border hover:border-px-primary transition-all">
                <span className="text-lg">🔔</span>
                {unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-px-secondary flex items-center justify-center">
                    <span className="font-pixel text-[5px] text-px-white">{unread}</span>
                  </div>
                )}
              </Link>
              <Link to="/vouchers" className="flex items-center justify-center w-10 h-10 border-[3px] border-px-border hover:border-px-yellow transition-all">
                <span className="text-lg">🎫</span>
              </Link>
              <Link to="/profile" className="w-8 h-8 border-[2px] border-px-accent flex items-center justify-center bg-px-accent/10 hover:bg-px-accent hover:text-px-bg transition-all">
                <span className="font-pixel text-[7px] text-px-accent">{user.full_name?.charAt(0) || "U"}</span>
              </Link>
              <button onClick={logout}
                className="font-pixel text-[6px] border-[2px] border-px-secondary text-px-secondary px-3 py-1 hover:bg-px-secondary hover:text-px-white transition-all">
                LOGOUT
              </button>
            </>
          ) : (
            <Link to="/login"
              className="font-pixel text-[8px] border-[3px] border-px-accent text-px-accent px-5 py-2.5 hover:bg-px-accent hover:text-px-bg transition-all">
              LOGIN
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
