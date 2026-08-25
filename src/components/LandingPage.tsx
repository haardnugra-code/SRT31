import React, { useState, useEffect } from 'react';
import { GraduationCap, LogIn, ChevronRight, Newspaper, Target, Users, BookOpen, Heart, Shield, ArrowRight, MapPin, Mail, Phone, Send } from 'lucide-react';
import { LoginModal } from './LoginModal';
import { loadLandingData, NewsPost } from '../services/storage';

interface LandingPageProps {
  onLoginSuccess: (role: 'admin' | 'guru') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLoginSuccess }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [data, setData] = useState(() => loadLandingData());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [readingNews, setReadingNews] = useState<NewsPost | null>(null);

  const publishedNews = data.news.filter(n => n.status === 'published');

  useEffect(() => {
    const handleStorageChange = () => {
      setData(loadLandingData());
    };
    window.addEventListener('storage', handleStorageChange);
    // Custom event dispatch for same-window updates
    window.addEventListener('landing-data-updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('landing-data-updated', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (publishedNews.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % publishedNews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [publishedNews.length]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-red-500 selection:text-white flex flex-col relative overflow-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center shadow-md bg-white p-1">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-lg sm:text-xl text-slate-900 leading-tight">Sekolah Rakyat</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold tracking-wider">TERINTEGRASI 31 PALEMBANG</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#berita" className="hover:text-red-600 transition-colors">Berita</a>
              <a href="#visimisi" className="hover:text-red-600 transition-colors">Visi Misi</a>
              <a href="#struktur" className="hover:text-red-600 transition-colors">Struktur Organisasi</a>
              <a href="#kontak" className="hover:text-red-600 transition-colors">Kontak</a>
            </div>

            <button 
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Portal</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full relative">
        {readingNews ? (
          <div className="pt-28 pb-24 max-w-4xl mx-auto px-4 sm:px-6 relative z-10 bg-white min-h-screen">
             <button onClick={() => setReadingNews(null)} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold"><ChevronRight className="w-5 h-5 rotate-180" /> Kembali ke Halaman Utama</button>
             <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">{readingNews.title}</h1>
             <div className="flex items-center gap-4 text-sm font-bold text-slate-500 mb-10 border-b border-slate-100 pb-6">
                <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full uppercase tracking-wider text-xs">{readingNews.category}</span>
                <span>{readingNews.date}</span>
             </div>
             <img src={readingNews.img} className="w-full h-[300px] md:h-[500px] object-cover rounded-[2rem] mb-12 shadow-md border border-slate-100" alt={readingNews.title} />
             <div className="prose prose-lg prose-slate max-w-none text-slate-700 leading-loose whitespace-pre-wrap font-medium">
                {readingNews.content || readingNews.desc}
             </div>
          </div>
        ) : (
          <>
        {/* --- HERO SLIDER SECTION --- */}
        <section className="relative h-[85vh] min-h-[600px] w-full bg-slate-900 overflow-hidden flex flex-col items-center justify-center">
          {publishedNews.length > 0 ? (
            publishedNews.map((news, idx) => (
              <div 
                key={news.id} 
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <img src={news.img} className="w-full h-full object-cover" alt={news.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30" />
                
                <div className="absolute bottom-0 left-0 w-full px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
                  <div className="max-w-7xl mx-auto">
                    <span className="bg-red-600 text-white px-3 py-1 text-[10px] md:text-xs font-bold rounded-full mb-4 inline-block uppercase tracking-wider">
                      {news.category} &bull; {news.date}
                    </span>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 drop-shadow-md max-w-4xl leading-tight">
                      {news.title}
                    </h2>
                    <p className="text-slate-200 max-w-2xl text-sm md:text-lg line-clamp-2 md:line-clamp-3 mb-8">
                      {news.desc}
                    </p>
                    <button onClick={() => { setReadingNews(news); window.scrollTo(0,0); }} className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 rounded-full text-sm font-bold shadow-lg transition-all">
                      Baca Berita <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-indigo-900 flex items-center justify-center">
              <p className="text-white">Tidak ada berita yang diterbitkan.</p>
            </div>
          )}

          {/* Slider Dots */}
          {publishedNews.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {publishedNews.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlide ? 'bg-red-500 w-8' : 'bg-white/50 hover:bg-white/80'}`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        {/* --- WELCOME TEXT SECTION --- */}
        <section className="py-16 bg-white border-b border-slate-100 text-center relative z-10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              {data.heroSubtitle}
            </div>
            
            <h2 
              className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6"
              dangerouslySetInnerHTML={{ __html: data.heroTitle }}
            />
            
            <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-600 mb-8">
              {data.aboutText}
            </p>
          </div>
        </section>

        {/* --- BERITA (NEWS) SECTION --- */}
        <section id="berita" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <Newspaper className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Berita Terkini</h3>
                <p className="text-sm text-slate-500">Informasi dan kegiatan terbaru seputar Sekolah Rakyat</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {publishedNews.map((news) => (
                <div key={news.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                  <div className="h-48 overflow-hidden relative">
                    <img src={news.img} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-slate-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {news.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-red-600 font-bold mb-2">{news.date}</p>
                    <h4 className="text-lg font-bold text-slate-900 mb-2 leading-snug group-hover:text-red-600 transition-colors">{news.title}</h4>
                    <p className="text-sm text-slate-600 line-clamp-2">{news.desc}</p>
                    <button onClick={() => { setReadingNews(news); window.scrollTo(0,0); }} className="mt-4 text-sm font-bold text-slate-900 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Baca selengkapnya <ChevronRight className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- VISI MISI SECTION --- */}
        <section id="visimisi" className="py-20 bg-slate-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Visi & Misi</h3>
              <p className="text-slate-600">Landasan kami dalam mendidik dan membimbing setiap siswa untuk mencapai potensi terbaiknya.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Visi */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h4 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-red-500 rounded-full" /> Visi
                </h4>
                <p className="text-xl leading-relaxed text-slate-700 font-medium italic">
                  "{data.vision}"
                </p>
              </div>

              {/* Misi */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h4 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-2 h-8 bg-blue-500 rounded-full" /> Misi
                </h4>
                <ul className="space-y-4">
                  {data.missions.map((m, idx) => (
                    <li key={idx} className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
                        <BookOpen className="w-4 h-4 text-slate-600" />
                      </div>
                      <p className="text-slate-700 pt-1">{m}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --- STRUKTUR ORGANISASI SECTION --- */}
        <section id="struktur" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/30 border-t border-slate-100 relative overflow-hidden">
          {/* Subtle background blob */}
          <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] rounded-full bg-blue-100/40 blur-3xl mix-blend-multiply pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column: Text */}
              <div>
                <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100/50 border border-blue-200 text-blue-800 text-sm font-bold tracking-wide mb-6">
                  {data.orgOverview?.badge}
                </div>
                
                <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.15] mb-6">
                  <span className="text-[#1e3a8a]">{data.orgOverview?.titleDark}</span>{' '}
                  <span className="text-amber-500">{data.orgOverview?.titleHighlight}</span>
                </h2>
                
                <p className="text-slate-600 text-lg leading-relaxed mb-10">
                  {data.orgOverview?.description}
                </p>
                
              </div>

              {/* Right Column: Featured Leader Card */}
              <div className="relative mx-auto w-full max-w-lg">
                {/* Backdrop shadow card */}
                <div className="absolute inset-0 bg-slate-200/60 rounded-[2.5rem] transform translate-x-4 translate-y-4 md:translate-x-6 md:translate-y-6" />
                
                {/* Main White Card */}
                <div className="relative bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-white">
                  
                  {/* Header: Avatar & Name */}
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-20 h-20 rounded-full border-4 border-amber-100 overflow-hidden flex-shrink-0">
                      <img 
                        src={data.organization?.[0]?.img || "https://ui-avatars.com/api/?name=Pimpinan&background=ef4444&color=fff"} 
                        alt={data.organization?.[0]?.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-[#1e3a8a] mb-1">{data.organization?.[0]?.name}</h4>
                      <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold">
                        {data.organization?.[0]?.role}
                      </span>
                    </div>
                  </div>

                  {/* Body: Quote */}
                  <div className="relative mb-8">
                    <span className="absolute -top-4 -left-2 text-4xl text-amber-200 font-serif leading-none">"</span>
                    <p className="text-slate-600 italic leading-relaxed text-lg relative z-10 px-4">
                      {data.orgOverview?.quote}
                    </p>
                    <span className="absolute -bottom-6 right-0 text-4xl text-amber-200 font-serif leading-none">"</span>
                  </div>

                  {/* Footer: Stats */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <Users className="w-5 h-5 text-slate-400" />
                      <span>{data.orgOverview?.staffCount}</span>
                    </div>
                    <div className="text-slate-500 text-sm font-medium">
                      {data.orgOverview?.period}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- HUBUNGI KAMI / CONTACT SECTION --- */}
        <section id="kontak" className="py-20 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Hubungi Kami</h3>
              <p className="text-slate-600">Punya pertanyaan seputar penerimaan siswa baru atau informasi lainnya? Jangan ragu untuk menghubungi kami.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200">
              {/* Info & Map */}
              <div className="space-y-8">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-6">Informasi Kontak</h4>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Alamat</p>
                        <p className="text-slate-600 text-sm mt-1 leading-relaxed">{data.contact.address}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Email</p>
                        <p className="text-slate-600 text-sm mt-1">{data.contact.email}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Telepon / WhatsApp</p>
                        <a href={`https://wa.me/62${data.contact.phone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-medium text-sm mt-1 hover:underline">
                          {data.contact.phone}
                        </a>
                      </div>
                    </li>
                  </ul>
                </div>
                {/* Embed Map */}
                <div className="w-full h-64 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                  <iframe 
                    src={data.contact.mapUrl} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>

              {/* Form */}
              <div className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200">
                <h4 className="text-xl font-bold text-slate-900 mb-6">Kirim Pesan</h4>
                <form className="space-y-4" onSubmit={(e) => { 
                  e.preventDefault(); 
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name');
                  const contact = formData.get('contact');
                  const message = formData.get('message');
                  const waText = `Halo Sekolah Rakyat 31, saya ${name} (${contact}).\n\nPesan:\n${message}`;
                  const waUrl = `https://wa.me/6281352264191?text=${encodeURIComponent(waText)}`;
                  window.open(waUrl, '_blank');
                }}>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nama Lengkap</label>
                    <input type="text" name="name" placeholder="Masukkan nama Anda" required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Email / No. HP</label>
                    <input type="text" name="contact" placeholder="Masukkan email atau nomor HP" required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 bg-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Pesan</label>
                    <textarea name="message" rows={4} placeholder="Tuliskan pertanyaan atau pesan Anda..." required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 bg-white resize-none" />
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-95">
                    Kirim via WhatsApp <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
        </>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white p-1 rounded-full flex items-center justify-center text-white overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight">Sekolah Rakyat</h1>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wider">TERINTEGRASI 31 PALEMBANG</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 mb-4 max-w-xs">
                Sistem informasi dan keasramaan terpadu untuk mendukung pendidikan karakter anak bangsa.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-slate-200">Tautan Cepat</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#berita" className="hover:text-white transition-colors">Berita Terkini</a></li>
                <li><a href="#visimisi" className="hover:text-white transition-colors">Visi Misi</a></li>
                <li><a href="#struktur" className="hover:text-white transition-colors">Struktur Organisasi</a></li>
                <li><a href="#kontak" className="hover:text-white transition-colors">Hubungi Kami</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-slate-200">Kontak</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>{data.contact.address}</li>
                <li>Email: {data.contact.email}</li>
                <li>
                  <a href={`https://wa.me/62${data.contact.phone.replace(/^0/, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                    Telp/WA: {data.contact.phone}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-xs text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} Sekolah Rakyat Terintegrasi 31 Palembang. All rights reserved.
          </div>
        </div>
      </footer>

      {/* --- LOGIN MODAL COMPONENT (Only renders if showLogin is true) --- */}
      {showLogin && (
        <div className="fixed inset-0 z-50">
          <LoginModal 
            isLoggedIn={false} 
            onLoginSuccess={(role) => {
              setShowLogin(false);
              onLoginSuccess(role);
            }} 
            onCancel={() => setShowLogin(false)}
          />
        </div>
      )}
    </div>
  );
};
