import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";

interface Category {
  id: string; name: string; slug: string; parent_slug?: string;
}
interface Product {
  id: string; name: string; provider: string; brand: string;
  sell_price: string; sell_price_formatted: string; is_available: boolean;
}

export default function TransactionPage() {
  const [searchParams] = useSearchParams();
  const preselectedProduct = searchParams.get("product") || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [activeSubSlug, setActiveSubSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    const user = localStorage.getItem("px_user");
    if (user) {
      const u = JSON.parse(user);
      if (u.phone) setPhone(u.phone);
    }
    api.get("/products/categories").then((r) => {
      if (r.data.success) {
        const allCats = r.data.data.categories;
        setCategories(allCats);
        if (allCats.length > 0) {
          setActiveSlug(allCats[0].slug);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!activeSlug) return;
    const children = categories.filter((c) => c.parent_slug === activeSlug);
    if (children.length > 0) {
      setSubCategories(children);
      setActiveSubSlug(children[0].slug);
    } else {
      setSubCategories([]);
      setActiveSubSlug("");
      fetchProducts(activeSlug);
    }
  }, [activeSlug, categories]);

  useEffect(() => {
    if (activeSubSlug) fetchProducts(activeSubSlug);
  }, [activeSubSlug]);

  const fetchProducts = (slug: string) => {
    setLoadingProducts(true);
    setSelectedProduct(null);
    api.get(`/products/category/${slug}`).then((r) => {
      if (r.data.success) setProducts(r.data.data.products.filter((p: Product) => p.is_available));
    }).catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  };

  const handleCheckout = () => {
    if (!selectedProduct) { setError("Pilih produk terlebih dahulu"); return; }
    if (!phone || phone.length < 10) { setError("Masukkan nomor HP minimal 10 digit"); return; }
    setError("");
    nav(`/checkout?product=${selectedProduct.id}&phone=${phone}`);
  };

  const isParent = subCategories.length > 0;
  const mainCats = categories.filter(c => !c.parent_slug);

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// BUY ITEM</div>
          <h2 className="font-pixel text-xl text-px-white">BELI PRODUK</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Phone */}
            <div className="bg-px-card border-[3px] border-px-border p-6">
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-3">NOMOR HP / TUJUAN</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={15}
                className="w-full px-4 py-3.5 bg-px-bg border-[3px] border-px-border text-px-white font-body text-xl focus:border-px-primary focus:outline-none"
                placeholder="08xxxxxxxxxx" />
            </div>

            {/* Main Category Tabs */}
            <div className="bg-px-card border-[3px] border-px-border p-6">
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-4">PILIH KATEGORI</label>
              <div className="flex flex-wrap gap-2">
                {mainCats.map((c) => (
                  <button key={c.slug} onClick={() => setActiveSlug(c.slug)}
                    className={`font-pixel text-[6px] px-4 py-2.5 border-[3px] tracking-wider transition-all ${
                      activeSlug === c.slug
                        ? "bg-px-primary/10 border-px-primary text-px-primary"
                        : "border-px-border text-px-muted hover:border-px-primary hover:text-px-primary"
                    }`}>
                    {c.name.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Sub Category Tabs */}
              {isParent && (
                <div className="flex flex-wrap gap-2 mt-4 pl-4 border-l-[3px] border-px-primary">
                  {subCategories.map((sc) => (
                    <button key={sc.slug} onClick={() => setActiveSubSlug(sc.slug)}
                      className={`font-pixel text-[6px] px-4 py-2 border-[2px] tracking-wider transition-all ${
                        activeSubSlug === sc.slug
                          ? "bg-px-yellow/10 border-px-yellow text-px-yellow"
                          : "border-px-border text-px-muted hover:border-px-yellow hover:text-px-yellow"
                      }`}>
                      {sc.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Products */}
            <div className="bg-px-card border-[3px] border-px-border p-6">
              <label className="font-pixel text-[7px] text-px-accent tracking-wider block mb-4">PILIH PRODUK</label>
              {loadingProducts ? (
                <div className="text-center py-8">
                  <div className="font-pixel text-[8px] text-px-primary animate-blink">LOADING...</div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {products.map((p) => (
                    <div key={p.id} onClick={() => { setSelectedProduct(p); setError(""); }}
                      className={`p-4 border-[3px] cursor-pointer transition-all ${
                        selectedProduct?.id === p.id
                          ? "border-px-primary bg-px-primary/10 shadow-[0_0_15px_rgba(0,255,136,0.15)]"
                          : "border-px-border hover:border-px-primary"
                      }`}>
                      <div className="font-pixel text-[5px] text-px-accent tracking-wider mb-1">{p.provider || p.brand}</div>
                      <div className="font-pixel text-[7px] text-px-white mb-2 leading-tight">{p.name.substring(0, 30)}</div>
                      <div className="font-pixel text-[9px] text-px-yellow glow-y">{p.sell_price_formatted}</div>
                    </div>
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-full text-center py-8 font-pixel text-[8px] text-px-muted">TIDAK ADA PRODUK</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="space-y-6">
            <div className="bg-px-card border-[4px] border-px-yellow p-6 sticky top-[100px]">
              <div className="font-pixel text-[10px] text-px-yellow mb-6 tracking-wider">RINGKASAN</div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="font-pixel text-[7px] text-px-muted">NOMOR</span>
                  <span className="font-body text-lg text-px-white">{phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-pixel text-[7px] text-px-muted">KATEGORI</span>
                  <span className="font-body text-lg text-px-white">{categories.find(c => c.slug === activeSlug)?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-pixel text-[7px] text-px-muted">PRODUK</span>
                  <span className="font-body text-lg text-px-white text-right max-w-[150px]">{selectedProduct?.name.substring(0, 25) || "-"}</span>
                </div>
                <div className="border-t-[2px] border-px-border pt-4">
                  <div className="flex justify-between">
                    <span className="font-pixel text-[8px] text-px-primary">TOTAL</span>
                    <span className="font-pixel text-[14px] text-px-yellow glow-y">{selectedProduct?.sell_price_formatted || "Rp 0"}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-3 mb-4">
                  <span className="font-pixel text-[6px] text-px-secondary">{error}</span>
                </div>
              )}

              <button onClick={handleCheckout} disabled={!selectedProduct}
                className="w-full font-pixel text-[10px] py-4 bg-px-primary border-4 border-px-primary text-px-bg tracking-[0.2em] hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-30">
                CHECKOUT
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
