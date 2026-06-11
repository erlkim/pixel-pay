import { useState, useEffect } from "react";
import api from "../lib/api";
import UserDetailModal from "../components/UserDetailModal";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = () => {
    api.get("/admin/users").then((r) => {
      if (r.data.success) setUsers(r.data.data.users);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u: any) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  if (loading) return <div className="p-8 font-pixel text-[9px] text-px-primary animate-blink">LOADING USERS...</div>;

  return (
    <div className="p-8 space-y-6">
      {selectedUserId && <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} onUpdate={fetchUsers} />}

      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// USER MANAGEMENT</div>
          <h2 className="font-pixel text-lg text-px-white">DAFTAR USER</h2>
        </div>
        <div className="font-pixel text-[8px] text-px-muted">{users.length} user</div>
      </div>

      <div className="bg-px-card border-[3px] border-px-border p-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, atau nomor HP..."
          className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none" />
      </div>

      <div className="bg-px-card border-[3px] border-px-border overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-[3px] border-px-border">
              <th className="font-pixel text-[6px] text-px-muted p-4 text-left">NAMA</th>
              <th className="font-pixel text-[6px] text-px-muted p-4 text-left">EMAIL</th>
              <th className="font-pixel text-[6px] text-px-muted p-4 text-left">HP</th>
              <th className="font-pixel text-[6px] text-px-muted p-4 text-center">ROLE</th>
              <th className="font-pixel text-[6px] text-px-muted p-4 text-center">STATUS</th>
              <th className="font-pixel text-[6px] text-px-muted p-4 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any) => (
              <tr key={u.id} className="border-b border-px-border/50 hover:bg-px-primary/5 transition-colors">
                <td className="p-4 font-pixel text-[8px] text-px-white">{u.full_name}</td>
                <td className="p-4 font-body text-lg text-px-muted">{u.email}</td>
                <td className="p-4 font-body text-lg text-px-muted">{u.phone}</td>
                <td className="p-4 text-center">
                  <span className="font-pixel text-[6px] px-2 py-1 border-[2px] border-px-accent text-px-accent">{u.role.toUpperCase()}</span>
                </td>
                <td className="p-4 text-center">
                  <span className={`font-pixel text-[6px] px-2 py-1 border-[2px] ${u.is_blocked ? "border-px-secondary text-px-secondary" : u.is_active ? "border-px-primary text-px-primary" : "border-px-muted text-px-muted"}`}>
                    {u.is_blocked ? "BLOCKED" : u.is_active ? "AKTIF" : "NONAKTIF"}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => setSelectedUserId(u.id)}
                    className="font-pixel text-[6px] px-3 py-1 border-[2px] border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg transition-all">
                    DETAIL
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center font-pixel text-[8px] text-px-muted">TIDAK ADA USER</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
