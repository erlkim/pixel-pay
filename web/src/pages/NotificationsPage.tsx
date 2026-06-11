import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api";

interface Notification {
  id: string; title: string; message: string; notif_type: string;
  is_read: boolean; ref_id: string | null; created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const fetchNotifs = () => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    api.get("/notifications/list").then((r) => {
      if (r.data.success) {
        setNotifications(r.data.data.notifications);
        setUnreadCount(r.data.data.unread_count);
      }
    }).catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read");
      fetchNotifs();
    } catch {}
  };

  const typeConfig: Record<string, { icon: string; color: string }> = {
    welcome: { icon: "👋", color: "text-px-primary border-px-primary" },
    success: { icon: "✓", color: "text-px-primary border-px-primary" },
    failed: { icon: "X", color: "text-px-secondary border-px-secondary" },
    refund: { icon: "↩", color: "text-px-yellow border-px-yellow" },
    topup: { icon: "💰", color: "text-px-primary border-px-primary" },
    info: { icon: "ℹ", color: "text-px-accent border-px-accent" },
    promo: { icon: "🎉", color: "text-px-yellow border-px-yellow" },
  };

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// NOTIFICATIONS</div>
          <h2 className="font-pixel text-xl text-px-white">NOTIFIKASI</h2>
        </div>

        {unreadCount > 0 && (
          <div className="flex justify-between items-center mb-6 bg-px-card border-[3px] border-px-yellow p-4">
            <span className="font-pixel text-[8px] text-px-yellow">{unreadCount} notifikasi belum dibaca</span>
            <button onClick={markAllRead}
              className="font-pixel text-[7px] border-[2px] border-px-primary text-px-primary px-4 py-2 hover:bg-px-primary hover:text-px-bg transition-all">
              TANDAI SEMUA DIBACA
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 font-pixel text-[9px] text-px-primary animate-blink">LOADING...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔔</div>
            <div className="font-pixel text-[9px] text-px-muted">TIDAK ADA NOTIFIKASI</div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const cfg = typeConfig[n.notif_type] || typeConfig.info;
              return (
                <div key={n.id} className={`bg-px-card border-[3px] p-5 ${n.is_read ? "border-px-border opacity-60" : "border-px-primary"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center border-[3px] text-lg flex-shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-pixel text-[8px] text-px-white">{n.title}</span>
                        {!n.is_read && <div className="w-2 h-2 bg-px-primary rounded-full animate-pulse" />}
                      </div>
                      <div className="font-body text-lg text-px-muted mb-2">{n.message}</div>
                      <div className="flex items-center justify-between">
                        <span className="font-body text-sm text-px-muted">{new Date(n.created_at).toLocaleString("id-ID")}</span>
                        {n.ref_id && (
                          <Link to={`/invoice/${n.ref_id}`}
                            className="font-pixel text-[6px] text-px-primary hover:text-px-yellow transition-colors">
                            LIHAT TRANSAKSI →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
