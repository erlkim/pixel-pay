import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Product {
  id: string; name: string; provider: string; brand: string;
  sell_price: string; sell_price_formatted: string; is_available: boolean;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (q.length >= 2) {
      setLoading(true);
      api.get(`/products/search?q=${encodeURIComponent(q)}`).then((r) => {
        if (r.data.success) setProducts(r.data.data.products);
      }).catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 2) nav(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleBeli = (id: string) => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    nav(`/transaction?product=${id}`);
  };

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// SEARCH</div>
          <h2 className="font-pixel text-xl text-px-white">CARI PRODUK</h2>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik nama produk, brand, atau provider..."
              className="flex-1 px-5 py-4 bg-px-card border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
              autoFocus />
            <button type="submit"
              className="font-pixel text-[9px] px-8 py-4 bg-px-primary border-4 border-px-primary text-px-bg tracking-wider hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] transition-all">
              CARI
            </button>
          </div>
        </form>

        {q && (
          <div className="font-pixel text-[7px] text-px-muted mb-6">
            Hasil pencarian: "{q}" — {products.length} produk ditemukan
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="font-pixel text-[9px] text-px-primary animate-blink">SEARCHING...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p) => (
              <div key={p.id} className="bg-px-card border-[3px] border-px-border p-6 hover:border-px-yellow hover:-translate-y-0.5 transition-all">
                <div className="font-pixel text-[6px] text-px-accent tracking-widest mb-2">{p.provider || p.brand}</div>
                <div className="font-pixel text-[9px] text-px-white mb-3 leading-relaxed">{p.name}</div>
                <div className="flex items-center justify-between mt-4">
                  <div className="font-pixel text-sm text-px-yellow glow-y">{p.sell_price_formatted}</div>
                  <button onClick={() => handleBeli(p.id)}
                    className="font-pixel text-[7px] border-[3px] border-px-primary text-px-primary px-5 py-2.5 hover:bg-px-primary hover:text-px-bg transition-all">
                    BELI
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && q && (
              <div className="col-span-full text-center py-16">
                <div className="text-4xl mb-4">🔍</div>
                <div className="font-pixel text-[9px] text-px-muted mb-2">TIDAK ADA HASIL</div>
                <div className="font-body text-lg text-px-muted">Coba kata kunci lain</div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
