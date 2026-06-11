import { Link } from "react-router-dom";

const contacts = [
  {
    icon: "💬",
    title: "WHATSAPP",
    value: "+62 812-3456-7890",
    link: "https://wa.me/6281234567890",
    desc: "Chat langsung dengan admin",
    available: "Senin - Minggu, 08:00 - 22:00 WIB",
  },
  {
    icon: "📧",
    title: "EMAIL",
    value: "support@pixelpay.id",
    link: "mailto:support@pixelpay.id",
    desc: "Kirim pertanyaan via email",
    available: "Respon dalam 1x24 jam",
  },
  {
    icon: "📸",
    title: "INSTAGRAM",
    value: "@pixelpay.id",
    link: "https://instagram.com/pixelpay.id",
    desc: "Follow untuk info promo terbaru",
    available: "DM Open",
  },
  {
    icon: "🐦",
    title: "TWITTER / X",
    value: "@pixelpay_id",
    link: "https://twitter.com/pixelpay_id",
    desc: "Update dan pengumuman",
    available: "Aktif setiap hari",
  },
];

export default function ContactPage() {
  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// SUPPORT</div>
          <h2 className="font-pixel text-xl text-px-white">HUBUNGI KAMI</h2>
          <div className="font-pixel text-[7px] text-px-muted mt-2">TIM KAMI SIAP MEMBANTU KAMU</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {contacts.map((c, i) => (
            <a key={i} href={c.link} target="_blank" rel="noopener noreferrer"
              className="bg-px-card border-[3px] border-px-border p-6 hover:border-px-primary hover:-translate-y-0.5 transition-all block">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 border-[3px] border-px-primary flex items-center justify-center text-2xl flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <div className="font-pixel text-[8px] text-px-primary mb-1 tracking-wider">{c.title}</div>
                  <div className="font-pixel text-[11px] text-px-white mb-2">{c.value}</div>
                  <div className="font-body text-base text-px-muted mb-1">{c.desc}</div>
                  <div className="font-pixel text-[6px] text-px-accent tracking-wider">{c.available}</div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* FAQ Link */}
        <div className="bg-px-card border-[3px] border-px-border p-8 text-center">
          <div className="font-pixel text-[9px] text-px-white mb-3">PUNYA PERTANYAAN?</div>
          <div className="font-body text-lg text-px-muted mb-4">Cek halaman FAQ untuk jawaban cepat</div>
          <Link to="/faq"
            className="inline-block font-pixel text-[8px] border-[3px] border-px-accent text-px-accent px-6 py-3 hover:bg-px-accent hover:text-px-bg transition-all">
            LIHAT FAQ
          </Link>
        </div>

        {/* Office Info */}
        <div className="mt-8 bg-px-card border-[3px] border-px-border p-8">
          <div className="font-pixel text-[9px] text-px-accent mb-6 tracking-wider text-center">INFO PERUSAHAAN</div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-px-muted">NAMA</span>
              <span className="font-body text-lg text-px-white">Pixel Pay</span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-px-muted">BIDANG</span>
              <span className="font-body text-lg text-px-white">PPOB (Payment Point Online Bank)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-px-muted">JAM OPERASIONAL</span>
              <span className="font-body text-lg text-px-white">24 Jam (Otomatis)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-pixel text-[7px] text-px-muted">SUPPORT</span>
              <span className="font-body text-lg text-px-white">08:00 - 22:00 WIB</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
