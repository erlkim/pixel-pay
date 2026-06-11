const sections = [
  {
    title: "1. KETENTUAN UMUM",
    content: [
      "Dengan mengakses dan menggunakan platform Pixel Pay, Anda dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.",
      "Pixel Pay berhak mengubah syarat dan ketentuan sewaktu-waktu tanpa pemberitahuan terlebih dahulu.",
      "Pengguna wajib memeriksa syarat dan ketentuan secara berkala.",
    ],
  },
  {
    title: "2. REGISTRASI AKUN",
    content: [
      "Pengguna harus berusia minimal 17 tahun atau sudah menikah untuk membuat akun.",
      "Informasi yang diberikan saat registrasi harus benar dan valid.",
      "Setiap pengguna hanya diperbolehkan memiliki satu akun.",
      "Pengguna bertanggung jawab atas keamanan akun dan password masing-masing.",
      "Pixel Pay tidak bertanggung jawab atas penyalahgunaan akun oleh pihak lain.",
    ],
  },
  {
    title: "3. TOP UP SALDO",
    content: [
      "Saldo yang telah di-top up tidak dapat dikembalikan (non-refundable) kecuali terdapat kesalahan sistem.",
      "Minimal top up adalah Rp 1.000.",
      "Saldo hanya dapat digunakan untuk transaksi di platform Pixel Pay.",
      "Saldo tidak dapat dipindahkan ke akun lain.",
      "Proses top up bersifat instan, namun dalam kondisi tertentu mungkin memerlukan waktu hingga 5 menit.",
    ],
  },
  {
    title: "4. TRANSAKSI",
    content: [
      "Harga produk dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih dahulu.",
      "Transaksi yang telah berhasil tidak dapat dibatalkan.",
      "Untuk transaksi yang gagal, saldo akan otomatis dikembalikan ke wallet pengguna.",
      "Waktu pemrosesan transaksi bervariasi tergantung jenis produk dan kondisi provider.",
      "Pengguna wajib memastikan nomor tujuan atau data yang dimasukkan sudah benar sebelum melakukan transaksi.",
    ],
  },
  {
    title: "5. PRODUK DAN LAYANAN",
    content: [
      "Ketersediaan produk bergantung pada stok dari mitra/provider.",
      "Pixel Pay berhak menonaktifkan produk tertentu tanpa pemberitahuan.",
      "Deskripsi produk bersifat informatif dan dapat berubah.",
      "Harga yang tertera sudah termasuk biaya layanan.",
    ],
  },
  {
    title: "6. PRIVASI DAN KEAMANAN",
    content: [
      "Pixel Pay menjaga kerahasiaan data pribadi pengguna sesuai kebijakan privasi.",
      "Data pengguna tidak akan dijual atau dibagikan kepada pihak ketiga tanpa persetujuan.",
      "Pixel Pay menggunakan enkripsi untuk melindungi data sensitif.",
      "Pengguna dapat meminta penghapusan data pribadi dengan menghubungi tim support.",
    ],
  },
  {
    title: "7. LARANGAN",
    content: [
      "Dilarang menggunakan platform untuk aktivitas ilegal atau penipuan.",
      "Dilarang melakukan transaksi menggunakan kartu kredit atau metode pembayaran curian.",
      "Dilarang membuat akun palsu atau menggunakan identitas orang lain.",
      "Dilarang mengeksploitasi bug atau celah keamanan sistem.",
      "Pelanggaran akan berakibat pemblokiran akun secara permanen.",
    ],
  },
  {
    title: "8. PEMBATASAN TANGGUNG JAWAB",
    content: [
      "Pixel Pay adalah perantara antara pengguna dan provider produk digital.",
      "Gangguan layanan dari provider (Telkomsel, PLN, dll) di luar kendali Pixel Pay.",
      "Pixel Pay tidak bertanggung jawab atas kerugian akibat kesalahan input data oleh pengguna.",
      "Maksimal tanggung jawab Pixel Pay adalah sejumlah nilai transaksi yang bersangkutan.",
    ],
  },
  {
    title: "9. SENGKETA",
    content: [
      "Seluruh sengketa akan diselesaikan secara musyawarah terlebih dahulu.",
      "Jika tidak tercapai kesepakatan, sengketa akan diselesaikan melalui jalur hukum yang berlaku di Indonesia.",
      "Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia.",
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="py-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="font-pixel text-[7px] text-px-accent tracking-[4px] mb-3">// LEGAL</div>
          <h2 className="font-pixel text-xl text-px-white">SYARAT & KETENTUAN</h2>
          <div className="font-pixel text-[7px] text-px-muted mt-2">Terakhir diperbarui: 11 Juni 2026</div>
        </div>

        <div className="bg-px-card border-[3px] border-px-border p-6 mb-8">
          <div className="font-pixel text-[7px] text-px-yellow mb-3 tracking-wider">PENTING</div>
          <div className="font-body text-lg text-px-muted leading-relaxed">
            Dengan menggunakan layanan Pixel Pay, Anda menyetujui seluruh syarat dan ketentuan yang tercantum di bawah ini. Jika Anda tidak setuju dengan salah satu ketentuan, mohon untuk tidak menggunakan layanan kami.
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((s, i) => (
            <div key={i} className="bg-px-card border-[3px] border-px-border p-6">
              <h3 className="font-pixel text-[9px] text-px-primary mb-4 tracking-wider">{s.title}</h3>
              <ul className="space-y-3">
                {s.content.map((c, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <span className="font-pixel text-[6px] text-px-accent mt-1.5">▸</span>
                    <span className="font-body text-lg text-px-muted leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-px-card border-[3px] border-px-border p-6 text-center">
          <div className="font-pixel text-[8px] text-px-white mb-2">ADA PERTANYAAN TENTANG S&K?</div>
          <div className="font-body text-lg text-px-muted mb-4">Hubungi tim support kami</div>
          <a href="/contact"
            className="inline-block font-pixel text-[8px] border-[3px] border-px-primary text-px-primary px-6 py-3 hover:bg-px-primary hover:text-px-bg transition-all">
            HUBUNGI KAMI
          </a>
        </div>
      </div>
    </section>
  );
}
