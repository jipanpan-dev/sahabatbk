
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FAQItem, Testimonial } from '../types';
import { GraduationCap, ShieldCheck, MessageCircleHeart, Users, ChevronDown, ChevronUp } from '../components/Icons';

// --- MOCK DATA ---
const testimonials: Testimonial[] = [
  { quote: "Awalnya ragu, tapi setelah curhat sama konselor di sini, aku jadi lebih lega dan bisa fokus belajar lagi. Privasi benar-benar dijaga!", author: "Siswa Kelas VIII" },
  { quote: "Sebagai guru BK, aplikasi ini sangat membantu saya menjangkau lebih banyak siswa yang butuh teman bicara. Fiturnya mudah dipakai.", author: "Ibu Dian, Guru BK" },
  { quote: "Aku jadi ngerti cara ngatasin gugup pas mau ujian. Makasih SahabatBK!", author: "Siswa Kelas IX" },
];

const faqs: FAQItem[] = [
  { question: "Apakah layanan ini gratis?", answer: "Ya, layanan konseling dasar dengan konselor sekolahmu sepenuhnya gratis untuk semua siswa terdaftar." },
  { question: "Apakah rahasia saya akan aman?", answer: "Tentu saja. Kami menggunakan enkripsi dan kebijakan privasi yang ketat. Semua percakapanmu dengan konselor bersifat rahasia dan tidak akan dibagikan ke siapapun tanpa izinmu." },
  { question: "Siapa saja konselor di SahabatBK?", answer: "Konselor kami adalah guru Bimbingan dan Konseling (BK) profesional dan terverifikasi dari sekolahmu." },
  { question: "Bagaimana jika saya dalam keadaan darurat?", answer: "Aplikasi ini tidak ditujukan untuk kondisi darurat. Jika kamu merasa dalam bahaya atau krisis, segera hubungi orang dewasa terpercaya atau layanan darurat di nomormu." },
];

// --- SUB-COMPONENTS ---
const FAQItemComponent: React.FC<{ faq: FAQItem; isOpen: boolean; onClick: () => void }> = ({ faq, isOpen, onClick }) => (
  <div className="border-b border-slate-200 py-4">
    <button onClick={onClick} className="w-full flex justify-between items-center text-left">
      <h3 className="text-lg font-semibold text-slate-800">{faq.question}</h3>
      {isOpen ? <ChevronUp className="w-5 h-5 text-primary-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
    </button>
    {isOpen && <p className="mt-2 text-slate-600 animate-fade-in-down">{faq.answer}</p>}
  </div>
);

const HomePage = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <div className="bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg z-20 shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary-600">
            Sahabat<span className="text-secondary-600">BK</span>
          </div>
          <div className="space-x-4">
            <Link to="/auth" className="text-slate-600 hover:text-primary-600 transition-colors">Masuk</Link>
            <Link to="/auth" className="bg-primary-500 text-white px-4 py-2 rounded-full hover:bg-primary-600 transition-transform hover:scale-105">
              Daftar
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-white py-20 md:py-32">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 leading-tight">
              Ruang Amanmu untuk <span className="text-primary-600">Bercerita</span> dan <span className="text-secondary-600">Tumbuh</span>.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Jangan pendam sendiri. Di SahabatBK, kamu bisa curhat, cari solusi, dan jadi versi terbaik dirimu bersama konselor yang siap mendengarkan.
            </p>
            <div className="mt-10">
              <Link to="/auth" className="bg-primary-500 text-white text-lg px-8 py-4 rounded-full font-semibold hover:bg-primary-600 transition-all transform hover:scale-105 shadow-lg">
                Mulai Konseling Sekarang
              </Link>
            </div>
          </div>
        </section>

        {/* Tentang Aplikasi */}
        <section id="about" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800">Kenapa Memilih SahabatBK?</h2>
              <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Kami hadir untuk mendukung kesehatan mentalmu dengan cara yang mudah, aman, dan penuh empati.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl hover:-translate-y-2 transition-all">
                <ShieldCheck className="w-16 h-16 text-secondary-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Aman & Terpercaya</h3>
                <p className="text-slate-600">Privasimu adalah prioritas. Semua percakapan dienkripsi dan dijaga kerahasiaannya.</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl hover:-translate-y-2 transition-all">
                <MessageCircleHeart className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Mudah Digunakan</h3>
                <p className="text-slate-600">Tampilan ramah pengguna, membuatmu nyaman untuk mulai bercerita kapan saja.</p>
              </div>
              <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl hover:-translate-y-2 transition-all">
                <GraduationCap className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Konselor Profesional</h3>
                <p className="text-slate-600">Terhubung langsung dengan Guru BK terverifikasi dari sekolahmu yang siap membantu.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cara Kerja */}
        <section id="how-it-works" className="py-20 bg-primary-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800">Hanya 3 Langkah Mudah</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center relative">
               <div className="absolute top-1/2 left-0 w-full h-1 hidden md:block">
                  <svg width="100%" height="100%"><line x1="0" y1="50%" x2="100%" y2="50%" strokeDasharray="5,5" stroke="#93c5fd" strokeWidth="2"></line></svg>
               </div>
               <div className="relative bg-white p-6 rounded-lg shadow-lg z-10">
                 <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold">1</div>
                 <h3 className="text-xl font-bold mt-10">Daftar Akun</h3>
                 <p className="mt-2 text-slate-600">Buat akunmu sebagai siswa hanya dalam beberapa menit.</p>
               </div>
               <div className="relative bg-white p-6 rounded-lg shadow-lg z-10">
                 <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold">2</div>
                 <h3 className="text-xl font-bold mt-10">Pilih Jadwal</h3>
                 <p className="mt-2 text-slate-600">Lihat jadwal konselor yang tersedia dan pilih waktu yang cocok.</p>
               </div>
               <div className="relative bg-white p-6 rounded-lg shadow-lg z-10">
                 <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold">3</div>
                 <h3 className="text-xl font-bold mt-10">Mulai Konseling</h3>
                 <p className="mt-2 text-slate-600">Lakukan sesi konseling online melalui chat yang aman dan nyaman.</p>
               </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800">Apa Kata Mereka?</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-secondary-500">
                  <p className="text-slate-600 italic">"{testimonial.quote}"</p>
                  <p className="mt-4 font-bold text-slate-800 text-right">- {testimonial.author}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800">Ada Pertanyaan?</h2>
              <p className="mt-4 text-slate-600">Temukan jawaban dari pertanyaan yang sering diajukan.</p>
            </div>
            <div>
              {faqs.map((faq, index) => (
                <FAQItemComponent
                  key={index}
                  faq={faq}
                  isOpen={openFaqIndex === index}
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary-600 text-white py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold">Siap Membuat Perubahan?</h2>
            <p className="mt-4 max-w-2xl mx-auto">Bergabunglah dengan SahabatBK sekarang. Kami di sini untukmu, setiap langkahnya.</p>
            <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-4">
              <Link to="/auth" state={{ defaultRole: 'student' }} className="bg-white text-primary-600 font-bold py-3 px-8 rounded-full hover:bg-primary-100 transition-transform hover:scale-105 w-full md:w-auto">
                Daftar Sebagai Siswa
              </Link>
              <Link to="/auth" state={{ defaultRole: 'counselor' }} className="bg-secondary-500 text-white font-bold py-3 px-8 rounded-full hover:bg-secondary-600 transition-transform hover:scale-105 w-full md:w-auto">
                Masuk Sebagai Konselor
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-10">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} SahabatBK. Semua Hak Cipta Dilindungi.</p>
          <div className="mt-4 space-x-6">
            <a href="#" className="hover:text-white">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white">Kontak Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
