import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface PaymentMethod {
  id: string; code: string; name: string; method_type: string;
  icon: string; fee_flat: number; fee_percent: number;
  min_amount: number; max_amount: number;
}

export default function TopUpPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("px_token");
    if (!token) { nav("/login"); return; }
    api.get("/payment/methods").then((r) => {
      if (r.data.success) setMethods(r.data.data.payment_methods);
    });
  }, []);

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  const calcFee = (m: PaymentMethod, amt: number) => m.fee_flat + (amt * m.fee_percent / 100);

  const handlePay = async () => {
    if (!selected || !amount) { setError("Pilih metode dan masukkan nominal"); return; }
    const amt = parseInt(amount);
    if (isNaN(amt) || amt < selected.min_amount) {
      setError(`Minimal top up Rp ${selected.min_amount.toLocaleString("id-ID")}`);
      return;
    }
    setLoading(true); setError("");
    try {
      const r = await api.post("/payment/create", {
        payment_method_code: selected.code,
        amount: amt,
      });
      if (r.data.success) {
        setPaymentResult(r.data.data);
      }
    } catch (e: any) {
      setError(e.response?.data?.error?.message || "Gagal membuat pembayaran");
    } finally { setLoading(false); }
  };

  const checkStatus = async () => {
    if (!paymentResult) return;
    setChecking(true);
    try {
      const r = await api.get(`/payment/status?order_id=${paymentResult.order_id}`);
      if (r.data.success) {
        setPaymentResult({ ...paymentResult, ...r.data.data });
        if (r.data.data.status === "paid") {
          setTimeout(() => nav("/wallet"), 2000);
        }
      }
    } catch {} finally { setChecking(false); }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  const grouped = methods.reduce((acc: Record<string, PaymentMethod[]>, m) => {
    if (!acc[m.method_type]) acc[m.method_type] = [];
    acc[m.method_type].push(m);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    bank_transfer: "BANK TRANSFER / VIRTUAL ACCOUNT",
    ewallet: "E-WALLET",
    qris: "QRIS",
    cstore: "CONVENIENCE STORE",
    credit_card: "KARTU KREDIT / DEBIT",
  };

  // Payment Result Screen
  if (paymentResult) {
    return (
      <section className="py-20 min-h-screen">
        <div className="max-w-lg mx-auto px-6">
          <div className="text-center mb-8">
            <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// PAYMENT</div>
            <h2 className="font-pixel text-xl text-px-white">
              {paymentResult.status === "paid" ? "PEMBAYARAN BERHASIL!" : "MENUNGGU PEMBAYARAN"}
            </h2>
          </div>

          {paymentResult.status === "paid" ? (
            <div className="bg-px-primary/10 border-[4px] border-px-primary p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <div className="font-pixel text-[12px] text-px-primary mb-2">TOP UP BERHASIL!</div>
              <div className="font-pixel text-lg text-px-yellow mt-4">Rp {paymentResult.amount?.toLocaleString("id-ID")}</div>
              <div className="font-body text-lg text-px-muted mt-2">Sudah masuk ke wallet Anda</div>
              <button onClick={() => nav("/wallet")}
                className="mt-6 font-pixel text-[8px] px-8 py-3 bg-px-primary border-4 border-px-primary text-px-bg tracking-wider">
                LIHAT WALLET
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-px-card border-[4px] border-px-yellow p-6 text-center">
                <div className="font-pixel text-[8px] text-px-muted mb-2">TOTAL BAYAR</div>
                <div className="font-pixel text-2xl text-px-yellow glow-y">Rp {paymentResult.total_amount?.toLocaleString("id-ID")}</div>
                <div className="font-pixel text-[6px] text-px-muted mt-1">Order: {paymentResult.order_id}</div>
              </div>

              {/* VA Number */}
              {paymentResult.va_number && (
                <div className="bg-px-card border-[3px] border-px-border p-6">
                  <div className="font-pixel text-[8px] text-px-accent mb-3 tracking-wider">VIRTUAL ACCOUNT</div>
                  <div className="font-pixel text-[7px] text-px-muted mb-2">{paymentResult.bank?.toUpperCase()} Virtual Account</div>
                  <div className="flex items-center gap-3 bg-px-bg border-[3px] border-px-primary p-4">
                    <div className="font-pixel text-xl text-px-primary flex-1 tracking-wider">{paymentResult.va_number}</div>
                    <button onClick={() => copyText(paymentResult.va_number, "va")}
                      className={`font-pixel text-[7px] px-4 py-2 border-[3px] transition-all ${copied === "va" ? "border-px-primary text-px-primary" : "border-px-yellow text-px-yellow hover:bg-px-yellow hover:text-px-bg"}`}>
                      {copied === "va" ? "SALIN!" : "SALIN"}
                    </button>
                  </div>
                </div>
              )}

              {/* Bill Key (Mandiri) */}
              {paymentResult.bill_key && (
                <div className="bg-px-card border-[3px] border-px-border p-6">
                  <div className="font-pixel text-[8px] text-px-accent mb-3 tracking-wider">MANDIRI ECHANNEL</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-px-bg border-[3px] border-px-border p-3">
                      <div className="flex-1">
                        <div className="font-pixel text-[6px] text-px-muted mb-1">KODE PERUSAHAAN</div>
                        <div className="font-pixel text-lg text-px-white">{paymentResult.bill_code}</div>
                      </div>
                      <button onClick={() => copyText(paymentResult.bill_code, "bc")}
                        className={`font-pixel text-[6px] px-3 py-1 border-[2px] transition-all ${copied === "bc" ? "border-px-primary text-px-primary" : "border-px-yellow text-px-yellow"}`}>
                        {copied === "bc" ? "OK!" : "SALIN"}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 bg-px-bg border-[3px] border-px-border p-3">
                      <div className="flex-1">
                        <div className="font-pixel text-[6px] text-px-muted mb-1">NOMOR BAYAR</div>
                        <div className="font-pixel text-lg text-px-white">{paymentResult.bill_key}</div>
                      </div>
                      <button onClick={() => copyText(paymentResult.bill_key, "bk")}
                        className={`font-pixel text-[6px] px-3 py-1 border-[2px] transition-all ${copied === "bk" ? "border-px-primary text-px-primary" : "border-px-yellow text-px-yellow"}`}>
                        {copied === "bk" ? "OK!" : "SALIN"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code */}
              {paymentResult.qr_url && (
                <div className="bg-px-card border-[3px] border-px-border p-6 text-center">
                  <div className="font-pixel text-[8px] text-px-accent mb-3 tracking-wider">SCAN QR</div>
                  <div className="bg-white p-4 inline-block">
                    <img src={paymentResult.qr_url} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <div className="font-pixel text-[6px] text-px-muted mt-3">Scan menggunakan aplikasi bank atau e-wallet</div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-px-card border-[3px] border-px-border p-6">
                <div className="font-pixel text-[8px] text-px-primary mb-3 tracking-wider">CARA BAYAR</div>
                <div className="font-body text-lg text-px-muted">{paymentResult.instructions || "Silakan lakukan pembayaran sesuai instruksi di atas."}</div>
              </div>

              {/* Status Check */}
              <div className="flex gap-3">
                <button onClick={checkStatus} disabled={checking}
                  className="flex-1 font-pixel text-[8px] py-3 bg-px-primary border-[3px] border-px-primary text-px-bg tracking-wider hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all disabled:opacity-50">
                  {checking ? "MENGECEK..." : "CEK STATUS PEMBAYARAN"}
                </button>
                <button onClick={() => { setPaymentResult(null); setSelected(null); setAmount(""); }}
                  className="font-pixel text-[8px] px-6 py-3 border-[3px] border-px-border text-px-muted hover:border-px-white hover:text-px-white transition-all">
                  BATAL
                </button>
              </div>

              <div className="text-center font-pixel text-[6px] text-px-muted">
                Pembayaran kedaluwarsa dalam 1 jam. Status akan otomatis terupdate.
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Main Selection Screen
  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// TOP UP</div>
          <h2 className="font-pixel text-xl text-px-white">ISI SALDO WALLET</h2>
        </div>

        {error && (
          <div className="bg-px-secondary/10 border-[3px] border-px-secondary p-4 mb-6">
            <span className="font-pixel text-[7px] text-px-secondary">{error}</span>
          </div>
        )}

        {/* Quick Amount */}
        <div className="mb-8">
          <div className="font-pixel text-[8px] text-px-accent mb-4 tracking-wider">NOMINAL TOP UP</div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {quickAmounts.map((a) => (
              <button key={a} onClick={() => setAmount(String(a))}
                className={`font-pixel text-[9px] py-4 border-[3px] tracking-wider transition-all ${amount === String(a) ? "border-px-yellow text-px-yellow bg-px-yellow/10 glow-y" : "border-px-border text-px-muted hover:border-px-yellow hover:text-px-yellow"}`}>
                Rp {a.toLocaleString("id-ID")}
              </button>
            ))}
          </div>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="Atau masukkan nominal manual"
            className="w-full px-5 py-4 bg-px-card border-[3px] border-px-border text-px-white font-body text-2xl focus:border-px-yellow focus:outline-none" />
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <div className="font-pixel text-[8px] text-px-accent mb-4 tracking-wider">METODE PEMBAYARAN</div>
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="mb-6">
              <div className="font-pixel text-[7px] text-px-muted mb-3 tracking-wider">{typeLabels[type] || type.toUpperCase()}</div>
              <div className="space-y-2">
                {items.map((m) => {
                  const fee = amount ? calcFee(m, parseInt(amount)) : 0;
                  return (
                    <button key={m.code} onClick={() => setSelected(m)}
                      className={`w-full flex items-center gap-4 p-4 border-[3px] text-left transition-all ${selected?.code === m.code ? "border-px-primary bg-px-primary/5" : "border-px-border bg-px-card hover:border-px-primary"}`}>
                      <span className="text-2xl w-10 text-center">{m.icon}</span>
                      <div className="flex-1">
                        <div className="font-pixel text-[8px] text-px-white">{m.name}</div>
                        <div className="font-body text-base text-px-muted">
                          {m.fee_flat > 0 ? `Biaya: Rp ${m.fee_flat.toLocaleString("id-ID")}` : ""}
                          {m.fee_percent > 0 ? `Biaya: ${m.fee_percent}%` : ""}
                          {m.fee_flat === 0 && m.fee_percent === 0 ? "GRATIS" : ""}
                        </div>
                      </div>
                      {amount && (
                        <div className="text-right">
                          <div className="font-pixel text-[6px] text-px-muted">TOTAL</div>
                          <div className="font-pixel text-[10px] text-px-yellow">Rp {(parseInt(amount) + fee).toLocaleString("id-ID")}</div>
                        </div>
                      )}
                      {selected?.code === m.code && (
                        <div className="w-6 h-6 border-[3px] border-px-primary flex items-center justify-center">
                          <div className="w-3 h-3 bg-px-primary" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Pay Button */}
        <button onClick={handlePay} disabled={loading || !selected || !amount}
          className="w-full font-pixel text-[10px] py-5 bg-px-primary border-4 border-px-primary text-px-bg tracking-wider hover:shadow-[0_0_40px_rgba(0,255,136,0.4)] transition-all disabled:opacity-40">
          {loading ? "MEMPROSES..." : "BAYAR SEKARANG"}
        </button>
      </div>
    </section>
  );
}
