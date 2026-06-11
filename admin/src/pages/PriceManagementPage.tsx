import { useState, useEffect } from "react";
import api from "../lib/api";

export default function PriceManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkMarkup, setBulkMarkup] = useState("5");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editMarkup, setEditMarkup] = useState("");

  useEffect(() => {
    api.get("/products/categories").then((r) => {
      if (r.data.success) {
        setCategories(r.data.data.categories);
        if (r.data.data.categories.length > 0) setActiveSlug(r.data.data.categories[0].slug);
      }
    });
  }, []);

  useEffect(() => {
    if (!activeSlug) return;
    setLoading(true);
    api.get(`/products/category/${activeSlug}`).then((r) => {
      if (r.data.success) setProducts(r.data.data.products);
    }).catch(() => setProducts([])).finally(() => setLoading(false));
  }, [activeSlug]);

  const handleBulkUpdate = async () => {
    const markup = parseFloat(bulkMarkup);
    if (isNaN(markup)) { setErr("Masukkan markup yang valid"); return; }
    setMsg(""); setErr("");
    try {
      const r = await api.post("/admin/products/bulk-markup", {
        category_slug: activeSlug,
        markup_percent: markup,
      });
      if (r.data.success) {
        setMsg(r.data.message);
        api.get(`/products/category/${activeSlug}`).then((r2) => {
          if (r2.data.success) setProducts(r2.data.data.products);
        });
      }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal"); }
  };

  const handleSingleUpdate = async (productId: string) => {
    const markup = parseFloat(editMarkup);
    if (isNaN(markup)) return;
    try {
      const r = await api.put(`/admin/product/${productId}/markup`, { markup_percent: markup });
      if (r.data.success) {
        setMsg(r.data.message);
        setEditingId("");
        api.get(`/products/category/${activeSlug}`).then((r2) => {
          if (r2.data.success) setProducts(r2.data.data.products);
        });
      }
    } catch (e: any) { setErr(e.response?.data?.error?.message || "Gagal"); }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// PRICE MANAGEMENT</div>
          <h2 className="font-pixel text-lg text-px-white">MANAJEMEN HARGA</h2>
        </div>
        <div className="font-pixel text-[8px] text-px-muted">{products.length} produk</div>
      </div>

      {msg && <div className="bg-px-primary/10 border-[3px] border-px-primary p-3"><span className="font-pixel text-[7px] text-px-primary">{msg}</span></div>}
      {err && <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3"><span className="font-pixel text-[7px] text-px-secondary">{err}</span></div>}

      <div className="flex flex-wrap gap-1 mb-4">
        {categories.filter(c => !c.parent_slug).map((c: any) => (
          <button key={c.slug} onClick={() => setActiveSlug(c.slug)}
            className={`font-pixel text-[6px] px-4 py-2 border-[3px] tracking-wider transition-all ${activeSlug === c.slug ? "bg-px-primary/10 border-px-primary text-px-primary" : "border-px-border text-px-muted hover:border-px-primary"}`}>
            {c.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Bulk Update */}
      <div className="bg-px-card border-[3px] border-px-yellow p-6">
        <div className="font-pixel text-[9px] text-px-yellow mb-4 tracking-wider">BULK UPDATE MARKUP</div>
        <div className="flex items-center gap-4">
          <span className="font-pixel text-[7px] text-px-muted">MARKUP %</span>
          <input type="number" value={bulkMarkup} onChange={(e) => setBulkMarkup(e.target.value)}
            className="w-24 px-3 py-2 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none" />
          <button onClick={handleBulkUpdate}
            className="font-pixel text-[7px] px-6 py-2 bg-px-yellow border-[3px] border-px-yellow text-px-bg hover:shadow-[0_0_20px_rgba(255,230,0,0.3)] transition-all">
            TERAPKAN KE SEMUA
          </button>
          <span className="font-pixel text-[6px] text-px-muted">({categories.find(c => c.slug === activeSlug)?.name || activeSlug})</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-px-card border-[3px] border-px-border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center font-pixel text-[9px] text-px-primary animate-blink">LOADING...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-[3px] border-px-border">
                <th className="font-pixel text-[6px] text-px-muted p-3 text-left">PRODUK</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-left">BRAND</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-right">BASE PRICE</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-right">SELL PRICE</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-right">PROFIT</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-center">MARKUP</th>
                <th className="font-pixel text-[6px] text-px-muted p-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="border-b border-px-border/50 hover:bg-px-primary/5 transition-colors">
                  <td className="p-3 font-pixel text-[7px] text-px-white max-w-[200px] truncate">{p.name}</td>
                  <td className="p-3 font-body text-lg text-px-muted">{p.brand}</td>
                  <td className="p-3 font-pixel text-[8px] text-px-muted text-right">Rp {parseFloat(p.sell_price / 1.05).toLocaleString("id-ID")}</td>
                  <td className="p-3 font-pixel text-[8px] text-px-yellow text-right">{p.sell_price_formatted}</td>
                  <td className="p-3 font-pixel text-[8px] text-px-primary text-right">Rp {(parseFloat(p.sell_price) - parseFloat(p.sell_price) / 1.05).toLocaleString("id-ID")}</td>
                  <td className="p-3 text-center">
                    {editingId === p.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={editMarkup} onChange={(e) => setEditMarkup(e.target.value)}
                          className="w-16 px-2 py-1 bg-px-bg border-[2px] border-px-border text-px-white font-body text-base focus:border-px-primary focus:outline-none" />
                        <button onClick={() => handleSingleUpdate(p.id)}
                          className="font-pixel text-[5px] px-2 py-1 border-[2px] border-px-primary text-px-primary hover:bg-px-primary hover:text-px-bg">OK</button>
                        <button onClick={() => setEditingId("")}
                          className="font-pixel text-[5px] px-2 py-1 border-[2px] border-px-muted text-px-muted">X</button>
                      </div>
                    ) : (
                      <span className="font-pixel text-[8px] text-px-accent">5%</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => { setEditingId(p.id); setEditMarkup("5"); }}
                      className="font-pixel text-[6px] px-3 py-1 border-[2px] border-px-accent text-px-accent hover:bg-px-accent hover:text-px-bg transition-all">
                      EDIT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
