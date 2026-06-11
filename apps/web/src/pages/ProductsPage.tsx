import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";

interface Category {
  id: string; name: string; slug: string; description: string;
  parent_slug?: string; is_group?: boolean;
}
interface Product {
  id: string; name: string; provider: string; brand: string;
  sell_price: string; sell_price_formatted: string; is_available: boolean;
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeSlug, setActiveSlug] = useState(initialCategory);
  const [activeName, setActiveName] = useState("");
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [activeSubSlug, setActiveSubSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/products/categories").then((r) => {
      if (r.data.success) {
        const allCats = r.data.data.categories;
        setCategories(allCats);
        if (initialCategory) {
          const found = allCats.find((c: Category) => c.slug === initialCategory);
          if (found) {
            setActiveSlug(found.slug);
            setActiveName(found.name);
            return;
          }
        }
        if (allCats.length > 0) {
          setActiveSlug(allCats[0].slug);
          setActiveName(allCats[0].name);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!activeSlug) return;
    const cat = categories.find((c) => c.slug === activeSlug);
    if (cat) setActiveName(cat.name);

    // Cek apakah ini parent (punya children)
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
    if (activeSubSlug) {
      fetchProducts(activeSubSlug);
    }
  }, [activeSubSlug]);

  const fetchProducts = (slug: string) => {
    setLoading(true);
    api.get(`/products/category/${slug}`).then((r) => {
      if (r.data.success) setProducts(r.data.data.products);
    }).catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  const handleBeli = (productId: string) => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    nav(`/transaction?product=${productId}`);
  };

  const isParent = subCategories.length > 0;
  const currentSlug = isParent ? activeSubSlug : activeSlug;

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// ITEM SHOP</div>
          <h2 className="font-pixel text-xl text-px-white">SEMUA PRODUK</h2>
          <div className="font-pixel text-[7px] text-px-muted mt-2">
            {activeName}{isParent && activeSubSlug ? ` / ${categories.find(c => c.slug === activeSubSlug)?.name || ""}` : ""} | {products.length} produk
          </div>
        </div>

        {/* Main Category Tabs */}
        <div className="flex flex-wrap gap-1 mb-4">
          {categories.filter(c => !c.parent_slug).map((c) => (
            <button key={c.slug} onClick={() => setActiveSlug(c.slug)}
              className={`font-pixel text-[7px] px-5 py-2.5 border-[3px] tracking-wider transition-all ${
                activeSlug === c.slug
                  ? "bg-px-primary/10 border-px-primary text-px-primary"
                  : "bg-px-card border-px-border text-px-muted hover:border-px-primary hover:text-px-primary"
              }`}>
              {c.name.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Sub Category Tabs (hanya muncul jika parent punya children) */}
        {isParent && (
          <div className="flex flex-wrap gap-1 mb-8 pl-4 border-l-[3px] border-px-primary">
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

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="font-pixel text-[9px] text-px-primary animate-blink">LOADING PRODUCTS...</div>
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
            {products.length === 0 && !loading && (
              <div className="col-span-full text-center py-16">
                <div className="text-4xl mb-4">📦</div>
                <div className="font-pixel text-[9px] text-px-muted">TIDAK ADA PRODUK</div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
