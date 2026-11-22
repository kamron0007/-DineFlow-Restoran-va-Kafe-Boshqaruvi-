import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { BrandLogo } from '../../components/BrandLogo';
import {
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  isSupabaseConfigured,
} from '../../services/supabaseClient';
import { dataService } from '../../services/storage';
import {
  Database,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
  ShieldCheck,
  ExternalLink,
  Store,
  Sparkles,
  Check,
  Palette,
  Download,
  Network,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    soundEnabled,
    setSoundEnabled,
    refreshData,
    addToast,
    restaurantName,
    setRestaurantName,
    restaurantBranch,
    setRestaurantBranch,
    restaurantTagline,
    setRestaurantTagline,
    logoStyle,
    setLogoStyle,
  } = useApp();
  const currentConfig = getSupabaseConfig();

  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(currentConfig.key);
  const [isSaving, setIsSaving] = useState(false);

  // Restaurant Branding Local State
  const [nameInput, setNameInput] = useState(restaurantName);
  const [branchInput, setBranchInput] = useState(restaurantBranch);
  const [taglineInput, setTaglineInput] = useState(restaurantTagline);
  const [isBrandingSaved, setIsBrandingSaved] = useState(false);

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      addToast('error', 'Xatolik', 'Restoran nomi bo\'sh bo\'lishi mumkin emas');
      return;
    }
    setRestaurantName(nameInput.trim());
    setRestaurantBranch(branchInput.trim());
    setRestaurantTagline(taglineInput.trim());
    setIsBrandingSaved(true);
    addToast(
      'success',
      'Restoran brendi yangilandi',
      `"${nameInput.trim()}" nomi va zamonaviy logotipi tizimda saqlandi.`
    );
    setTimeout(() => setIsBrandingSaved(false), 3000);
  };

  const PRESET_NAMES = [
    { name: 'Zafaran Grand', branch: 'Toshkent Markaziy filiali', tagline: 'Milliy & Zamonaviy Gastronomiya' },
    { name: 'Zafaran Lounge & Grill', branch: 'Shahar Markazi filiali', tagline: 'Premium Steyk & Milliy Taomlar' },
    { name: 'Rayhon Gourmet', branch: 'Chilonzor filiali', tagline: 'An\'anaviy va Mualliflik Taomlari' },
    { name: 'Afsona Restaurant', branch: 'Sayilgoh filiali', tagline: 'Sharqona & Yevropa Oshxonasi' },
  ];

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    saveCustomSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
  };

  const handleResetDemo = async () => {
    if (
      !window.confirm(
        "Barcha demo ma'lumotlarni qayta tiklashni xohlaysizmi? O'zgarishlar asl holatiga qaytariladi."
      )
    )
      return;
    await dataService.resetAllDemoData();
    await refreshData();
    addToast('success', 'Qayta tiklandi', 'Barcha boshlang\'ich ma\'lumotlar muvaffaqiyatli tiklandi.');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-[#202622] flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />

        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto">
          <div>
            <h1 className="font-display font-bold text-2xl text-[#173F35] tracking-tight">
              Tizim Sozlamalari
            </h1>
            <p className="text-xs text-[#737A75] mt-0.5">
              Ma'lumotlar bazasi, ovozli bildirishnomalar va restoran konfiguratsiyasi
            </p>
          </div>

          {/* Restaurant Branding & Logo Configuration Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E0D8] shadow-xs space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center font-bold shrink-0">
                  <Store className="w-6 h-6 text-[#173F35]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#173F35]">
                    Restoran Nomi va Zamonaviy Brendi
                  </h3>
                  <p className="text-xs text-[#737A75]">
                    Restoran nomi, filiali, tavsifi va zamonaviy gastronomiya logotipini sozlash
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Zamonaviy Oltin Toj Belgisi</span>
              </span>
            </div>

            {/* Live Interactive Preview */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-[#FAF8F3] to-amber-50/40 border border-[#E5E0D8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#737A75] block mb-3">
                Jonli Ko'rinish (Mijozlar va Xodimlar menyusida):
              </span>
              <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-xl border border-[#E5E0D8] shadow-xs">
                <BrandLogo size="lg" />
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Faol Brend
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Suggestion Pills */}
            <div>
              <span className="text-xs font-semibold text-[#202622] block mb-2">
                Tavsiya etilgan zamonaviy brend variantlari:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_NAMES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setNameInput(preset.name);
                      setBranchInput(preset.branch);
                      setTaglineInput(preset.tagline);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      nameInput === preset.name
                        ? 'border-[#173F35] bg-[#E8F0EC]/60 ring-2 ring-[#173F35]/10'
                        : 'border-[#E5E0D8] bg-[#FAF8F3] hover:border-[#173F35]'
                    }`}
                  >
                    <div className="font-display font-bold text-xs text-[#173F35]">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-[#737A75] mt-0.5 truncate">
                      {preset.branch} · {preset.tagline}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Branding Edit Form */}
            <form onSubmit={handleSaveBranding} className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#202622] mb-1">
                    Restoran Nomi:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Zafaran Grand"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs font-semibold text-[#173F35] focus:outline-none focus:border-[#173F35]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#202622] mb-1">
                    Filial Nomi / Joylashuvi:
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Toshkent Markaziy filiali"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs font-medium text-[#202622] focus:outline-none focus:border-[#173F35]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202622] mb-1">
                  Qo'shimcha Ta'rif / Slogan:
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Milliy & Zamonaviy Gastronomiya"
                  value={taglineInput}
                  onChange={(e) => setTaglineInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs font-medium text-[#202622] focus:outline-none focus:border-[#173F35]"
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#235B4E] active:scale-95 text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Restoran nomini saqlash</span>
                </button>
              </div>
            </form>
          </div>

          {/* Admin Panel Customization & Operational Settings */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E0D8] shadow-xs space-y-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center font-bold shrink-0">
                  <Palette className="w-6 h-6 text-[#173F35]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#173F35]">
                    Admin Panelini O'zgartirish & Moslashtirish
                  </h3>
                  <p className="text-xs text-[#737A75]">
                    Admin interfeysi mavzusi, stollarni bo'shatish qoidasi, kassa xizmat foizi va navigatsiya
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Faol Admin Konfiguratsiyasi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Setting 1: Chek va Stollarni Bo'shatish */}
              <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] space-y-2">
                <span className="font-bold text-[#173F35] block">
                  Stollar & Cheklar Holati
                </span>
                <p className="text-[#737A75] text-[11px] leading-relaxed">
                  Mijoz chekni olganda yoki hisob so'raganda stol darhol <strong>"Chek olingan / To'lovda"</strong> holatiga o'tadi va 1-bosishda bo'shatiladi.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Avtomatik indikator faol</span>
                </div>
              </div>

              {/* Setting 2: Kassa va Servis Foizi */}
              <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] space-y-2">
                <span className="font-bold text-[#173F35] block">
                  Valyuta & Kassa Standarti
                </span>
                <p className="text-[#737A75] text-[11px] leading-relaxed">
                  Valyuta: <strong>O'zbek so'mi (UZS)</strong>.<br />
                  Servis xizmat haqi: <strong>10% (chekda kiritilgan)</strong>.
                </p>
                <div className="pt-2 flex items-center gap-1.5 text-emerald-800 font-semibold text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>To'liq O'zbekiston standarti</span>
                </div>
              </div>

              {/* Setting 3: Ovozli Signallar */}
              <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] space-y-2">
                <span className="font-bold text-[#173F35] block">
                  Ovozli Bildirishnomalar
                </span>
                <p className="text-[#737A75] text-[11px] leading-relaxed">
                  Oshxonadan taom tayyor bo'lganda va mijoz chaqiruvida ovozli signal berish.
                </p>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`mt-1 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-[11px] transition-all ${
                    soundEnabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Ovoz yoqilgan' : 'Ovoz o\'chirilgan'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Database Layer Status Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E0D8] shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                    isSupabaseConfigured()
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#202622]">
                    Ma'lumotlar bazasi holati
                  </h3>
                  <p className="text-xs text-[#737A75]">
                    {isSupabaseConfigured()
                      ? 'Supabase Cloud PostgreSQL bazasiga muvaffaqiyatli ulangan'
                      : 'Lokal Demo Rejimida ishlamoqda (LocalStorage & Realtime BroadcastChannel)'}
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  isSupabaseConfigured()
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {isSupabaseConfigured() ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bulutli Supabase</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lokal Demo Rejimi</span>
                  </>
                )}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs text-[#737A75] leading-relaxed">
              <p className="mb-2">
                <strong>Aniq va halol holat:</strong> Tizim foydalanuvchi talabiga ko'ra
                soxta backend imitatsiyasini qilmaydi. Agar tashqi Supabase kalitlari
                berilmagan bo'lsa, to'liq ishlovchi lokal rejim ishga tushadi. Barcha stollar, menyu
                va buyurtmalar brauzer xotirasida saqlanadi hamda yorliqlar (tabs) o'rtasida
                BroadcastChannel orqali real vaqtda bir zumda yangilanadi.
              </p>
              <p>
                Haqiqiy Supabase PostgreSQL bazasiga ulash uchun quyidagi maydonlarga o'z
                loyihangiz parametrlarini kiriting yoki <code>.env</code> faylida{' '}
                <code>VITE_SUPABASE_URL</code> va <code>VITE_SUPABASE_ANON_KEY</code> sozlang.
              </p>
            </div>

            {/* Supabase Config Form */}
            <form onSubmit={handleSaveSupabase} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block font-semibold text-[#202622] mb-1">
                  Supabase Project URL:
                </label>
                <div className="relative">
                  <Server className="w-4 h-4 text-[#737A75] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs focus:outline-none focus:border-[#173F35]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202622] mb-1">
                  Supabase Anon Public API Key:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#737A75] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF8F3] border border-[#E5E0D8] text-xs focus:outline-none focus:border-[#173F35]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#173F35] font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Supabase konsoli</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#173F35] hover:bg-[#235B4E] text-white font-bold transition-all shadow-xs"
                >
                  {isSaving ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}
                </button>
              </div>
            </form>
          </div>

          {/* Sound & Notifications Setting */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E0D8] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F0EC] text-[#173F35] flex items-center justify-center">
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#202622]">
                    Oshxona va ofitsiant ovozli xabarlari (Web Audio)
                  </h3>
                  <p className="text-xs text-[#737A75]">
                    Yangi buyurtmalar va stol chaqiruvlari kelganda maxsus qo'ng'iroq chalinadi
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  soundEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {soundEnabled ? 'Yoqilgan' : 'O\'chirilgan'}
              </button>
            </div>
          </div>

          {/* System Architecture Visual Diagram */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E0D8] shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#173F35] text-amber-400 flex items-center justify-center shrink-0">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#173F35]">
                    DineFlow Tizim Arxitekturasi (Vizual Sxema)
                  </h3>
                  <p className="text-xs text-[#737A75]">
                    Mijoz, Ofitsiant, Oshxona (KDS) va Admin modullarining o'zaro ishlash arxitekturasi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>OpenAPI / Swagger UI (/api/docs)</span>
                </a>

                <a
                  href="/images/dineflow-architecture.svg"
                  download="dineflow-arxitektura.svg"
                  className="px-4 py-2 rounded-xl bg-[#173F35] hover:bg-[#235B4E] text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Arxitektura rasmini yuklab olish (SVG)</span>
                </a>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#E5E0D8] bg-[#FAF8F3] shadow-inner">
              <img
                src="/images/dineflow-architecture.svg"
                alt="DineFlow Tizim Arxitekturasi"
                referrerPolicy="no-referrer"
                className="w-full h-auto block"
              />
            </div>
          </div>

          {/* Reset Demo Data Action */}
          <div className="bg-white rounded-3xl p-6 border border-red-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-display font-bold text-sm text-red-700">
                Barcha demo ma'lumotlarni qayta tiklash
              </h3>
              <p className="text-xs text-[#737A75] mt-0.5">
                Taomlar, stollar va buyurtmalarni asl o'zbekcha Rayhon Chilonzor holatiga qaytaradi.
              </p>
            </div>

            <button
              onClick={handleResetDemo}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Qayta tiklash</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
