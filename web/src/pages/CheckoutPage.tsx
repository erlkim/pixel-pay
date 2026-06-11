import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../lib/api";

interface Product {
  id: string; name: string; provider: string; brand: string;
  sell_price: string; sell_price_formatted: string;
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("product") || "";
  const phone = searchParams.get("phone") || "";
  const [product, setProduct] = useState<Product | null>(null);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    if (!productId || !phone) { nav("/transaction"); return; }

    api.get("/wallet/balance").then((r) => {
      if (r.data.success) setBalance(r.data.data.wallet.balance);
    });

    api.get("/products/categories").then(async (r) => {
      if (r.data.success) {
        for (const cat of r.data.data.categories) {
          try {
            const pr = await api.get(`/products/category/${cat.slug}`);
            if (pr.data.success) {
              const found = pr.data.data.products.find((p: Product) => p.id === productId);
              if (found) { setProduct(found); return; }
            }
          } catch {}
        }
        setError("Produk tidak ditemukan");
      }
    });
  }, [productId, phone]);

  const handlePay = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await api.post("/transactions/create", {
        product_id: productId,
        customer_number: phone,
      });
      if (r.data.success) {
        nav(`/invoice/${r.data.data.transaction.ref_id}`);
      }
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Transaksi gagal");
    } finally {
      setLoading(false);
    }
  };

  const balanceNum = parseFloat(balance) || 0;
  const priceNum = product ? parseFloat(product.sell_price) : 0;
  const sufficient = balanceNum >= priceNum;

  if (!product) {
    return (
      <section className="py-20 min-h-screen flex items-center justify-center">
        <div className="font-pixel text-[9px] text-px-primary animate-blink">LOADING...</div>
      </section>
    );
  }

  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-lg mx-auto px-6">
        <div className="text-center mb-8">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// CHECKOUT</div>
          <h2 className="font-pixel text-xl text-px-white">KONFIRMASI PEMBAYARAN</h2>
        </div>

        {/* Invoice Card */}
        <div className="bg-px-card border-[4px] border-px-yellow p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-px-yellow" />
          <div className="absolute top-0 left-4 right-4 h-[1px]" style={{background:"repeating-linear-gradient(90deg, transparent, transparent 4px, #333366 4px, #333366 8px)"}} />

          <div className="font-pixel text-[8px] text-px-accent tracking-wider mb-6 text-center">INVOICE</div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-pixel text-[7px] text-px-muted">PRODUK</span>
              <span className="font-body text-lg text-px-white text-right max-w-[200px]">{product.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-pixel text-[7px] text-px-muted">PROVIDER</span>
              <span className="font-body text-lg text-px-white">{product.provider || product.brand}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-pixel text-[7px] text-px-muted">NOMOR</span>
              <span className="font-body text-lg text-px-accent">{phone}</span>
            </div>

            <div className="border-t-[2px] border-dashed border-px-border pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-pixel text-[8px] text-px-muted">HARGA</span>
                <span className="font-pixel text-[12px] text-px-yellow glow-y">{product.sell_price_formatted}</span>
              </div>
            </div>

            <div className="border-t-[2px] border-dashed border-px-border pt-4">
              <div className="flex justify-between items-center">
                <span className="font-pixel text-[7px] text-px-muted">SALDO KAMU</span>
                <span className={`font-pixel text-[10px] ${sufficient ? "text-px-primary" : "text-px-secondary"}`}>
                  Rp {balanceNum.toLocaleString("id-ID")}
                </span>
              </div>
              {!sufficient && (
                <div className="mt-2 text-center">
                  <span className="font-pixel text-[6px] text-px-secondary">SALDO TIDAK CUKUP</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-4 mb-6">
            <span className="font-pixel text-[7px] text-px-secondary">{error}</span>
          </div>
        )}

        <div className="flex gap-4">
          <Link to="/transaction"
            className="flex-1 font-pixel text-[9px] py-4 text-center border-[3px] border-px-muted text-px-muted hover:border-px-white hover:text-px-white transition-all">
            KEMBALI
          </Link>
          <button onClick={handlePay} disabled={loading || !sufficient}
            className="flex-1 font-pixel text-[10px] py-4 bg-px-primary border-4 border-px-primary text-px-bg tracking-[0.2em] hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-30 disabled:hover:translate-y-0">
            {loading ? "PROSES..." : "BAYAR"}
          </button>
        </div>
      </div>
    </section>
  );
}
