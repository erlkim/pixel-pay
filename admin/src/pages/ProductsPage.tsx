import { useState, useEffect } from "react";
import api from "../lib/api";

interface Category { id: string; name: string; slug: string; }
interface Product {
  id: string; name: string; provider: string; brand: string;
  sell_price: string; sell_price_formatted: string; is_available: boolean;
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/products/categories").then((r) => {
      if (r.data.success) {
        const cats = r.data.data.categories;
        setCategories(cats);
        if (cats.length > 0) setActiveSlug(cats[0].slug);
      }
    });
  }, []);

  useEffect(() => {
    if (!activeSlug) return;
    setLoading(true);
    api.get(`/products/category/${activeSlug}`).then((r) => {
      if (r.data.success) setProducts(r.data.data.products);
    }).catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeSlug]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.provider?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-2">// PRODUCTS</div>
          <h2 className="font-pixel text-lg text-px-white">MANAJEMEN PRODUK</h2>
        </div>
        <div className="font-pixel text-[8px] text-px-muted">{products.length} produk</div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1">
        {categories.map((c) => (
          <button key={c.slug} onClick={() => setActiveSlug(c.slug)}
            className={`font-pixel text-[6px] px-4 py-2 border-[3px] tracking-wider transition-all ${
              activeSlug === c.slug
                ? "bg-px-primary/10 border-px-primary text-px-primary"
                : "border-px-border text-px-muted hover:border-px-primary"
            }`}>
            {c.name.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-px-card border-[3px] border-px-border p-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk..."
          className="w-full px-4 py-3 bg-px-bg border-[3px] border-px-border text-px-white font-body text-lg focus:border-px-primary focus:outline-none"
        />
      </div>

      {/* Products Table */}
      <div className="bg-px-card border-[3px] border-px-border overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center font-pixel text-[9px] text-px-primary animate-blink">LOADING...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-[3px] border-px-border">
                <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-left">NAMA</th>
                <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-left">BRAND</th>
                <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-left">PROVIDER</th>
                <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-right">HARGA JUAL</th>
                <th className="font-pixel text-[6px] text-px-muted tracking-wider p-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-px-border/50 hover:bg-px-primary/5 transition-colors">
                  <td className="p-4 font-pixel text-[8px] text-px-white">{p.name}</td>
                  <td className="p-4 font-body text-lg text-px-muted">{p.brand}</td>
                  <td className="p-4 font-body text-lg text-px-muted">{p.provider}</td>
                  <td className="p-4 font-pixel text-[9px] text-px-yellow text-right">{p.sell_price_formatted}</td>
                  <td className="p-4 text-center">
                    <span className={`font-pixel text-[6px] px-2 py-1 border-[2px] ${p.is_available ? "text-px-primary border-px-primary" : "text-px-secondary border-px-secondary"}`}>
                      {p.is_available ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center font-pixel text-[8px] text-px-muted">TIDAK ADA PRODUK</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
