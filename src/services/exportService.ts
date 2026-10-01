import { Transaction, QuickTemplate } from '../types';
import { CODE_GS_SCRIPT, normalizeDateToYMD } from './gasService';
import { DEFAULT_QUICK_TEMPLATES } from '../components/TemplateManagerModal';

export function formatCurrencyTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumberTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTR(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const ymd = normalizeDateToYMD(dateStr);
    const parts = ymd.split('-');
    let y = parseInt(parts[0], 10) || 2026;
    let m = parseInt(parts[1], 10) || 1;
    let d = parseInt(parts[2], 10) || 1;
    if (y < 2024) {
      y = 2026;
    }
    return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
  } catch {
    let fallback = String(dateStr).trim();
    fallback = fallback.replace(/2001/g, '2026').replace(/\.01$/g, '.2026');
    return fallback;
  }
}

export function generateSingleFileHtml(defaultGasUrl = '', initialTemplates?: QuickTemplate[], defaultPin = ''): string {
  const templatesJson = JSON.stringify(initialTemplates || DEFAULT_QUICK_TEMPLATES);

  return `<!DOCTYPE html>
<html lang="tr" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Nakit Akışı ve Birikim Takip</title>
    <meta name="description" content="Google E-Tablolar ve Apps Script entegrasyonlu aylık nakit akışı, harcama ve birikim takip uygulaması">
    <meta property="og:title" content="Nakit Akışı ve Birikim Takip">
    <meta property="og:description" content="Google E-Tablolar ve Apps Script entegrasyonlu aylık nakit akışı, harcama ve birikim takip uygulaması">
    
    <!-- PWA & Mobile Web App Meta Tags -->
    <meta name="theme-color" content="#09090b">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Nakit Akış">
    
    <!-- Inline PWA Manifest Data URI -->
    <link rel="manifest" href="data:application/manifest+json;charset=utf-8,%7B%22name%22%3A%22Nakit%20Ak%C4%B1%C5%9F%C4%B1%20ve%20Birikim%22%2C%22short_name%22%3A%22Nakit%20Ak%C4%B1%C5%9F%22%2C%22start_url%22%3A%22.%2F%22%2C%22display%22%3A%22standalone%22%2C%22background_color%22%3A%22%2309090b%22%2C%22theme_color%22%3A%22%2309090b%22%7D">

    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .spinner { border-top-color: transparent; }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.35s ease-in-out; }
    </style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen p-3 sm:p-6 md:p-8 selection:bg-blue-600 selection:text-white">

    <!-- ========================================== -->
    <!-- 🔒 GÜVENLİK VE PIN KİLİT EKRANI (LOCK SCREEN) -->
    <!-- ========================================== -->
    <div id="lockScreen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-xl">
        <div class="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
            <div class="flex flex-col items-center text-center space-y-2">
                <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl shadow-lg shadow-blue-950">
                    🔒
                </div>
                <div>
                    <h1 id="lockTitle" class="text-lg font-bold tracking-tight text-zinc-100 uppercase">
                        Cüzdan Analiz Koruması
                    </h1>
                    <p id="lockSubtitle" class="text-xs text-zinc-500 font-mono mt-0.5">
                        Kayıtlarınıza erişmek için PIN girin
                    </p>
                </div>
            </div>

            <div class="space-y-3">
                <div class="relative flex items-center">
                    <input type="password" id="pinInput" inputmode="numeric" maxlength="12" placeholder="••••"
                        class="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl py-3 px-4 text-center text-xl font-bold font-mono tracking-widest text-zinc-100 outline-none focus:border-blue-500 shadow-inner">
                    <button type="button" onclick="togglePinVisibility()" class="absolute right-3 p-2 text-zinc-500 hover:text-zinc-300">
                        👁️
                    </button>
                </div>

                <div id="lockError" class="hidden text-xs text-rose-400 font-medium text-center animate-shake">
                    Hatalı PIN Kodu!
                </div>

                <!-- Tuş Takımı (Numpad) -->
                <div class="grid grid-cols-3 gap-2 pt-1">
                    <button type="button" onclick="pressKey('1')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">1</button>
                    <button type="button" onclick="pressKey('2')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">2</button>
                    <button type="button" onclick="pressKey('3')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">3</button>
                    <button type="button" onclick="pressKey('4')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">4</button>
                    <button type="button" onclick="pressKey('5')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">5</button>
                    <button type="button" onclick="pressKey('6')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">6</button>
                    <button type="button" onclick="pressKey('7')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">7</button>
                    <button type="button" onclick="pressKey('8')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">8</button>
                    <button type="button" onclick="pressKey('9')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">9</button>
                    <button type="button" onclick="clearPin()" class="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-xs font-bold text-zinc-400">SİL</button>
                    <button type="button" onclick="pressKey('0')" class="h-11 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-blue-600 font-mono text-lg font-bold">0</button>
                    <button type="button" onclick="deletePin()" class="h-11 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-sm font-bold text-zinc-400">⌫</button>
                </div>

                <label class="flex items-center justify-center gap-2 cursor-pointer pt-1 text-xs text-zinc-400 select-none">
                    <input type="checkbox" id="rememberDeviceCheck" checked class="rounded bg-zinc-800 border-zinc-700 text-blue-600">
                    <span>Bu cihazda beni hatırla</span>
                </label>

                <button type="button" onclick="submitUnlock()" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-blue-950">
                    Kilidi Aç / Giriş Yap
                </button>
            </div>

            <div class="text-center pt-2 border-t border-zinc-800/80">
                <p class="text-[10px] text-zinc-500">
                    🛡️ GitHub Pages üzerinde verileriniz PIN olmadan görüntülenemez.
                </p>
            </div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- ANA UYGULAMA İÇERİĞİ -->
    <!-- ========================================== -->
    <div id="mainApp" class="max-w-6xl mx-auto space-y-6 opacity-0 transition-opacity duration-300">
        <!-- Üst Başlık & Kontroller -->
        <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/80 border border-zinc-800 p-4 sm:p-5 rounded-2xl">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
                    ₺
                </div>
                <div>
                    <h1 class="text-xl font-bold tracking-tight text-white uppercase">Cüzdan <span class="text-blue-500">Analiz</span></h1>
                    <p class="text-zinc-400 text-xs">Google E-Tablolar & PIN Korumalı Nakit Takibi</p>
                </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                <span id="gasStatusBadge" class="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Yerel Mod
                </span>
                <button onclick="lockAppNow()" class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-zinc-700" title="Uygulamayı Kilitle">
                    🔒 Kilitle
                </button>
                <button onclick="toggleSettings()" class="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5 border border-zinc-700">
                    ⚙️ Ayarlar & PIN
                </button>
                <button onclick="fetchData()" class="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-950">
                    🔄 Yenile
                </button>
            </div>
        </header>

        <!-- Ayarlar Paneli (Gizli / Açılır) -->
        <div id="settingsArea" class="hidden bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <div class="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 class="font-bold text-sm text-zinc-200">Entegrasyon ve Güvenlik Ayarları</h3>
                <span class="text-[11px] text-zinc-500">Tarayıcınızın yerel hafızasında saklanır</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Google Apps Script Web App URL</label>
                    <input type="text" id="apiUrl" placeholder="https://script.google.com/macros/s/.../exec" 
                        value="https://script.google.com/macros/s/AKfycbw1fodBWOJAY1I7NGfKO_EC8MhOT9VMqYMepYzQ3zUqkUkdKsEj3t3hdwg3K7w8EqMlrQ/exec"
                        class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-100 outline-none focus:border-blue-500 font-mono">
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Güvenlik PIN Kodu</label>
                    <input type="password" id="settingsPin" placeholder="Örn: 1923" 
                        value="4434"
                        class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-100 outline-none focus:border-blue-500 font-mono">
                </div>
            </div>

            <div class="flex justify-between items-center pt-2">
                <p class="text-[11px] text-zinc-400">
                    💡 GitHub Public depoya atarken bu sayfadaki veriler ziyaretçilerin cihazında sorulur ve güvende kalır.
                </p>
                <button onclick="saveSettings()" class="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition">
                    Kaydet & Uygula
                </button>
            </div>
        </div>

        <!-- Ana Grid: Form & Analiz -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Sol: Yeni İşlem Ekleme Formu -->
            <section class="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl space-y-4">
                <div class="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <h2 id="formTitle" class="font-bold text-sm text-zinc-200 flex items-center gap-2">
                        <span>➕</span> Yeni İşlem Girişi
                    </h2>
                    <button type="button" onclick="openTemplateManager()" class="text-[11px] text-blue-400 hover:text-blue-300 transition flex items-center gap-1 hover:underline">
                        <span>⚙️ Şablonlar</span>
                    </button>
                </div>

                <!-- Hızlı Şablon Butonları -->
                <div class="space-y-1.5">
                    <label class="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Hızlı Şablonlar</label>
                    <div id="quickTemplatesGrid" class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]"></div>
                </div>

                <form id="txForm" class="space-y-3.5 pt-2 border-t border-zinc-800/80">
                    <input type="hidden" id="txId">
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Tarih</label>
                            <input type="date" id="txDate" required class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Kategori</label>
                            <select id="txCategory" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500">
                                <option value="Sabit Gelir">Sabit Gelir (+)</option>
                                <option value="Ek Gelir">Ek Gelir (+)</option>
                                <option value="Kart Ekstresi">Kredi Kartı Ekstresi (-)</option>
                                <option value="Transfer Gideri">Transfer / Kira / EFT (-)</option>
                                <option value="Nakit Çekim">ATM Nakit Çekim (-)</option>
                                <option value="Diğer Gider">Diğer Gider (-)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Tutar (₺)</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2.5 text-zinc-500 text-xs font-bold">₺</span>
                            <input type="number" step="0.01" id="txAmount" required placeholder="0.00" class="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 pl-8 pr-3 text-sm font-semibold outline-none focus:border-blue-500 font-mono">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Açıklama / Not</label>
                        <input type="text" id="txNote" placeholder="Örn: Garanti bonus ekstre, kira bedeli..." class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs outline-none focus:border-blue-500">
                    </div>

                    <div class="pt-1 flex gap-2">
                        <button type="submit" id="submitBtn" class="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-xs text-white transition flex items-center justify-center gap-2 shadow-lg shadow-blue-950">
                            <span id="btnText">Kaydet</span>
                            <div id="btnSpinner" class="hidden w-4 h-4 border-2 border-white spinner rounded-full animate-spin"></div>
                        </button>
                        <button type="button" id="cancelEditBtn" onclick="resetForm()" class="hidden bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl text-xs text-zinc-300 transition">
                            Vazgeç
                        </button>
                    </div>
                </form>
            </section>

            <!-- Sağ: Aylık Analiz & Konsolidasyon -->
            <section class="lg:col-span-7 space-y-4">
                <div class="bg-zinc-900/90 border border-zinc-800 p-6 rounded-2xl space-y-5">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-800 pb-4">
                        <div>
                            <h2 class="font-bold text-sm text-zinc-200 uppercase">Konsolide Nakit Analizi</h2>
                            <p class="text-zinc-500 text-xs">Seçili dönemin toplam nakit akışı ve tasarruf dengesi</p>
                        </div>
                        <div class="flex items-center gap-1.5 bg-zinc-800/80 p-1 rounded-xl border border-zinc-700">
                            <button type="button" onclick="stepMonth(-1)" class="w-6 h-6 flex items-center justify-center text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition" title="Önceki Ay">‹</button>
                            <select id="selectedMonthSelect" onchange="selectMonthKey(this.value)" class="bg-zinc-950/80 hover:bg-zinc-800 text-zinc-100 text-xs font-mono font-bold uppercase px-2 py-1 rounded-lg border border-zinc-700 outline-none focus:border-blue-500 transition cursor-pointer text-center min-w-[150px]">
                                <option value="all">🌐 TÜM ZAMANLAR</option>
                            </select>
                            <input type="hidden" id="selectedMonth" value="">
                            <button type="button" onclick="stepMonth(1)" class="w-6 h-6 flex items-center justify-center text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition" title="Sonraki Ay">›</button>
                            <button type="button" id="allTimeBtn" onclick="toggleAllTime()" class="text-[10px] uppercase font-bold px-2.5 py-1 bg-zinc-900 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition">Tümü</button>
                        </div>
                    </div>

                    <!-- 3'lü Metrik Kartı -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div class="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl">
                            <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Toplam Giriş</span>
                            <div id="metricIncome" class="text-lg font-bold text-emerald-400 font-mono">₺0,00</div>
                        </div>
                        <div class="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl">
                            <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Toplam Çıkış</span>
                            <div id="metricExpense" class="text-lg font-bold text-rose-400 font-mono">₺0,00</div>
                        </div>
                        <div id="netMetricBox" class="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl">
                            <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Net Bakiye</span>
                            <div id="metricNet" class="text-lg font-bold font-mono">₺0,00</div>
                        </div>
                    </div>

                    <!-- Durum Değerlendirme & Tavsiye Kartı -->
                    <div id="adviceCard" class="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 text-xs space-y-1">
                        <div class="flex items-center gap-2 font-bold" id="adviceTitle">
                            <span>ℹ️</span> <span>Veri Bekleniyor</span>
                        </div>
                        <p id="adviceDesc" class="text-zinc-400">
                            Seçili ay için işlem ekleyin veya üst kısımdan ayı değiştirin.
                        </p>
                    </div>

                    <!-- Çıkış Dağılım Çubuğu -->
                    <div class="space-y-1.5">
                        <div class="flex justify-between text-[11px] text-zinc-400 font-semibold">
                            <span>Gider Kalemleri Dağılımı</span>
                            <span id="expenseBreakdownText">-</span>
                        </div>
                        <div class="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden flex" id="distributionBar"></div>
                        <div class="flex flex-wrap gap-3 text-[10px] text-zinc-400 pt-1">
                            <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-rose-500"></span> Kart</div>
                            <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Transfer</div>
                            <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Nakit</div>
                            <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500"></span> Diğer</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- İşlem Listesi Tablosu -->
        <section class="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div class="p-4 sm:p-5 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-zinc-900/50">
                <div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <h2 class="font-bold text-sm text-zinc-100 uppercase tracking-tight">İşlem Geçmişi</h2>
                        <span id="txCountBadge" class="text-[11px] bg-zinc-800 text-blue-400 px-2.5 py-0.5 rounded-full font-mono font-bold">0 Kayıt</span>
                    </div>
                    <p id="tablePeriodSubtitle" class="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">
                        Dönem Hareketleri
                    </p>
                </div>

                <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <!-- Dönem Geçiş Butonu (Tümünü Göster / Seçili Aya Dön) -->
                    <button type="button" id="tableFilterToggleBtn" onclick="toggleAllTime()" 
                        class="px-2.5 py-1.5 rounded-lg font-bold text-xs tracking-tight transition bg-zinc-950 hover:bg-zinc-800 text-blue-400 border border-zinc-800 flex items-center gap-1.5 shadow-sm">
                        <span>🌐 Tümünü Göster</span>
                    </button>

                    <!-- Kategori Seçici -->
                    <select id="tableCategoryFilter" onchange="renderTable()" 
                        class="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500">
                        <option value="all">Tüm Kategoriler</option>
                        <option value="Sabit Gelir">Sabit Gelir (+)</option>
                        <option value="Kart Ekstresi">Kart Ekstresi (-)</option>
                        <option value="Transfer Gideri">Transfer Gideri (-)</option>
                        <option value="Nakit Çekim">Nakit Çekim (-)</option>
                        <option value="Ek Gelir">Ek Gelir (+)</option>
                        <option value="Diğer Gider">Diğer Gider (-)</option>
                    </select>

                    <!-- Arama Kutusu -->
                    <div class="relative flex-1 sm:w-48">
                        <input type="text" id="searchInput" oninput="renderTable()" placeholder="Kayıtlarda ara..." 
                            class="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500 font-mono">
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead class="bg-zinc-950/60 text-zinc-400 uppercase text-[10px] font-bold border-b border-zinc-800">
                        <tr>
                            <th class="p-3.5">Tarih</th>
                            <th class="p-3.5">Kategori</th>
                            <th class="p-3.5">Açıklama</th>
                            <th class="p-3.5 text-right">Tutar</th>
                            <th class="p-3.5 text-center">İşlem</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody" class="divide-y divide-zinc-800/60 font-medium"></tbody>
                </table>
            </div>
        </section>
    </div>

    <!-- Şablon Yöneticisi Modal -->
    <div id="tplModal" onclick="if(event.target === this) closeTemplateManager()" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div class="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950">
                <div class="flex items-center gap-2">
                    <span class="text-base">⚡</span>
                    <h3 class="font-bold text-sm text-zinc-100">Hızlı İşlem Şablonları</h3>
                </div>
                <button type="button" onclick="closeTemplateManager()" class="text-zinc-400 hover:text-white px-2 py-1 text-sm font-bold">✕</button>
            </div>
            <div class="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                <div class="space-y-2">
                    <div class="flex justify-between items-center text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                        <span>Kayıtlı Şablonlar</span>
                        <button type="button" onclick="resetTemplatesToDefault()" class="text-[10px] text-zinc-400 hover:text-zinc-200 underline font-normal">Varsayılanlara Dön</button>
                    </div>
                    <div id="tplList" class="space-y-1.5"></div>
                </div>

                <form id="tplForm" onsubmit="saveCustomTemplate(event)" class="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
                    <div class="flex justify-between items-center">
                        <h4 class="font-bold text-xs text-blue-400" id="tplFormHeading">Yeni Şablon Ekle</h4>
                        <button type="button" id="cancelTplEditBtn" onclick="resetTemplateForm()" class="hidden text-[10px] text-zinc-400 hover:text-zinc-200">İptal</button>
                    </div>
                    <input type="hidden" id="tplId">
                    <div>
                        <label class="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Şablon Buton Adı</label>
                        <input type="text" id="tplTitle" placeholder="Örn: Kira, Fatura, Market" required class="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-100 outline-none focus:border-blue-500">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Kategori</label>
                            <select id="tplCategory" class="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-100 outline-none focus:border-blue-500">
                                <option value="Transfer Gideri">Transfer Gideri (-)</option>
                                <option value="Kart Ekstresi">Kart Ekstresi (-)</option>
                                <option value="Nakit Çekim">Nakit Çekim (-)</option>
                                <option value="Sabit Gelir">Sabit Gelir (+)</option>
                                <option value="Ek Gelir">Ek Gelir (+)</option>
                                <option value="Diğer Gider">Diğer Gider (-)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Varsayılan Tutar (₺)</label>
                            <input type="number" step="0.01" id="tplAmount" placeholder="Opsiyonel" class="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-100 outline-none focus:border-blue-500 font-mono">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-zinc-400 uppercase mb-1">Varsayılan Açıklama / Not</label>
                        <input type="text" id="tplNote" placeholder="Örn: Aylık kira bedeli" class="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-100 outline-none focus:border-blue-500">
                    </div>
                    <button type="submit" id="saveTplBtn" class="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg text-xs font-bold text-white transition shadow-md shadow-blue-950">
                        Şablonu Kaydet
                    </button>
                </form>
            </div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- UYGULAMA MANTIĞI & GÜVENLİK SCRIPTİ -->
    <!-- ========================================== -->
    <script>
        let GAS_URL = localStorage.getItem('gas_url_v2') || "${defaultGasUrl || 'https://script.google.com/macros/s/AKfycbw1fodBWOJAY1I7NGfKO_EC8MhOT9VMqYMepYzQ3zUqkUkdKsEj3t3hdwg3K7w8EqMlrQ/exec'}";
        let STORED_PIN = localStorage.getItem('cashflow_security_pin_v2') || "${defaultPin || '4434'}";
        let IS_REMEMBERED = localStorage.getItem('cashflow_remember_device_v2') === 'true';
        let IS_UNLOCKED = sessionStorage.getItem('cashflow_session_unlocked_v2') === 'true' || (IS_REMEMBERED && localStorage.getItem('cashflow_session_unlocked_v2') === 'true');

        let isAllTimeMode = false;

        // ==========================================
        // TARİH & SAYI NORMALİZASYON YARDIMCILARI
        // ==========================================
        const TURKISH_MONTHS_MAP = {
            'ocak': '01', 'ock': '01', 'january': '01', 'jan': '01', '1': '01', '01': '01',
            'şubat': '02', 'subat': '02', 'şub': '02', 'sub': '02', 'february': '02', 'feb': '02', '2': '02', '02': '02',
            'mart': '03', 'mar': '03', 'march': '03', '3': '03', '03': '03',
            'nisan': '04', 'nis': '04', 'april': '04', 'apr': '04', '4': '04', '04': '04',
            'mayıs': '05', 'mayis': '05', 'may': '05', '5': '05', '05': '05',
            'haziran': '06', 'haz': '06', 'june': '06', 'jun': '06', '6': '06', '06': '06',
            'temmuz': '07', 'tem': '07', 'july': '07', 'jul': '07', '7': '07', '07': '07',
            'ağustos': '08', 'agustos': '08', 'ağu': '08', 'agu': '08', 'august': '08', 'aug': '08', '8': '08', '08': '08',
            'eylül': '09', 'eylul': '09', 'eyl': '09', 'september': '09', 'sep': '09', '9': '09', '09': '09',
            'ekim': '10', 'eki': '10', 'october': '10', 'oct': '10', '10': '10',
            'kasım': '11', 'kasim': '11', 'kas': '11', 'november': '11', 'nov': '11', '11': '11',
            'aralık': '12', 'aralik': '12', 'ara': '12', 'december': '12', 'dec': '12', '12': '12'
        };

        function getLocalDateStr(d = new Date()) {
            const y = Math.max(d.getFullYear(), 2026);
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return \`\${y}-\${m}-\${day}\`;
        }

        // Nesne içinde büyük/küçük harf duyarsız anahtar arayıcı
        function getObjVal(item, possibleKeys) {
            if (!item || typeof item !== 'object') return undefined;
            for (const k of possibleKeys) {
                if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
                    return item[k];
                }
            }
            const itemKeys = Object.keys(item);
            for (const target of possibleKeys) {
                const targetClean = target.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '');
                for (const actualKey of itemKeys) {
                    const actualClean = actualKey.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '');
                    if (actualClean === targetClean && item[actualKey] !== undefined && item[actualKey] !== null && item[actualKey] !== '') {
                        return item[actualKey];
                    }
                }
            }
            return undefined;
        }

        // Tarih normalizasyonu: DD.MM.YYYY, ISO, E-Tablo seri tarihleri, metin tarihleri -> YYYY-MM-DD
        function normalizeDateToYMD(rawDate) {
            if (rawDate === null || rawDate === undefined || rawDate === '') {
                return getLocalDateStr();
            }

            const currentYear = Math.max(new Date().getFullYear(), 2026);

            const sanitizeYMD = (rawY, rawM, rawD) => {
                let y = Number(rawY) || currentYear;
                let m = Number(rawM) || 1;
                let d = Number(rawD) || 1;
                if (y < 2024 || isNaN(y)) y = currentYear;
                m = Math.min(Math.max(1, m), 12);
                d = Math.min(Math.max(1, d), 31);
                return \`\${y}-\${String(m).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
            };

            // 1. Native Date nesnesi
            if (rawDate instanceof Date) {
                if (!isNaN(rawDate.getTime())) {
                    return sanitizeYMD(rawDate.getFullYear(), rawDate.getMonth() + 1, rawDate.getDate());
                }
            }

            // 2. Nesne ise içindeki tarihi al
            if (typeof rawDate === 'object') {
                const inner = rawDate.date || rawDate.Tarih || rawDate.tarih || rawDate.period || rawDate.value;
                if (inner) return normalizeDateToYMD(inner);
            }

            // 3. Google Sheets / Excel seri tarihi (örn. 46257)
            if (typeof rawDate === 'number' || (typeof rawDate === 'string' && /^\\d{4,6}(\\.\\d+)?$/.test(rawDate.trim()))) {
                const num = Number(rawDate);
                if (!isNaN(num) && num > 10000 && num < 90000) {
                    const dt = new Date(Math.round((num - 25569) * 86400 * 1000));
                    if (!isNaN(dt.getTime())) {
                        return sanitizeYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
                    }
                }
            }

            let str = String(rawDate).trim();
            if (!str) return getLocalDateStr();

            // 4. Apps Script / Standart metin tarih formatı (örn: "Sat Mar 14 2026 00:00:00 GMT+0300 (Türkiye Standard Time)")
            const dowMonDayYr = str.match(/^[a-zA-Z]{3,}\\s+([a-zA-Z]{3,})\\s+(\\d{1,2})\\s+(\\d{4})/);
            if (dowMonDayYr) {
                const monWord = dowMonDayYr[1].toLowerCase();
                const cleanWord = monWord.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
                const mo = TURKISH_MONTHS_MAP[monWord] || TURKISH_MONTHS_MAP[cleanWord];
                if (mo) {
                    return sanitizeYMD(parseInt(dowMonDayYr[3], 10), parseInt(mo, 10), parseInt(dowMonDayYr[2], 10));
                }
            }

            // 5. Gün Ay Yıl: "14 Mar 2026", "14 Mart 2026", "14-Ağu-2026", "14.Mart.2026"
            const dayMonYr = str.match(/^(\\d{1,2})[\\s./-]+([a-zA-ZçğıöşüÇĞİÖŞÜ]{3,})[\\s./-]+(\\d{2,4})/);
            if (dayMonYr) {
                const cleanWord = dayMonYr[2].toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
                const mo = TURKISH_MONTHS_MAP[dayMonYr[2].toLowerCase()] || TURKISH_MONTHS_MAP[cleanWord];
                if (mo) {
                    let yr = dayMonYr[3];
                    if (yr.length === 2) yr = '20' + yr;
                    return sanitizeYMD(parseInt(yr, 10), parseInt(mo, 10), parseInt(dayMonYr[1], 10));
                }
            }

            // 6. Ay Gün Yıl: "Mar 14 2026", "Mart 14 2026"
            const monDayYr = str.match(/^([a-zA-ZçğıöşüÇĞİÖŞÜ]{3,})[\\s./-]+(\\d{1,2})[\\s./,-]+(\\d{2,4})/);
            if (monDayYr) {
                const cleanWord = monDayYr[1].toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
                const mo = TURKISH_MONTHS_MAP[monDayYr[1].toLowerCase()] || TURKISH_MONTHS_MAP[cleanWord];
                if (mo) {
                    let yr = monDayYr[3];
                    if (yr.length === 2) yr = '20' + yr;
                    return sanitizeYMD(parseInt(yr, 10), parseInt(mo, 10), parseInt(monDayYr[2], 10));
                }
            }

            // 7. ISO format: "YYYY-MM-DD..." (örn: "2026-08-15" veya "2026-08-15T12:00:00.000Z")
            const isoMatch = str.match(/^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})/);
            if (isoMatch) {
                const y = parseInt(isoMatch[1], 10);
                const m = parseInt(isoMatch[2], 10);
                const d = parseInt(isoMatch[3], 10);
                return sanitizeYMD(y, m, d);
            }

            // 8. 3 parçalı sayısal tarih: "DD.MM.YYYY", "DD/MM/YYYY", "DD-MM-YYYY", "DD.MM.YY"
            const num3Match = str.match(/^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{2,4})/);
            if (num3Match) {
                let d = parseInt(num3Match[1], 10);
                let m = parseInt(num3Match[2], 10);
                let y = parseInt(num3Match[3], 10);
                if (y < 100) y = (y < 50 ? 2000 + y : 1900 + y);
                if (m > 12 && d <= 12) {
                    const temp = m; m = d; d = temp;
                }
                return sanitizeYMD(y, m, d);
            }

            // 9. Sadece Ay Adı ve Yıl: "Ağustos 2026", "Mart 2026"
            const monthTextYearMatch = str.match(/^([a-zA-ZçğıöşüÇĞİÖŞÜ]+)[\\s./-]+(\\d{2,4})$/i);
            if (monthTextYearMatch) {
                const monthWord = monthTextYearMatch[1].toLowerCase().trim();
                let yearStr = monthTextYearMatch[2];
                if (yearStr.length === 2) yearStr = '20' + yearStr;
                const year = parseInt(yearStr, 10);
                const cleanWord = monthWord.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
                const monthNum = parseInt(TURKISH_MONTHS_MAP[monthWord] || TURKISH_MONTHS_MAP[cleanWord] || '1', 10);
                return sanitizeYMD(year, monthNum, 1);
            }

            // 10. Yalnızca Ay Adı (Örn: "Ağustos", "Mart")
            const singleWord = str.toLowerCase().trim();
            const cleanWord = singleWord.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
            if (TURKISH_MONTHS_MAP[singleWord] || TURKISH_MONTHS_MAP[cleanWord]) {
                const mo = TURKISH_MONTHS_MAP[singleWord] || TURKISH_MONTHS_MAP[cleanWord];
                return \`\${currentYear}-\${mo}-01\`;
            }

            // 11. Yıl ve Ay sadece: YYYY-MM
            const ymOnly = str.match(/^(\\d{4})[-/.](\\d{1,2})$/);
            if (ymOnly) {
                return sanitizeYMD(ymOnly[1], ymOnly[2], 1);
            }

            // 12. Ay ve Yıl: MM-YYYY
            const myOnly = str.match(/^(\\d{1,2})[-/.](\\d{4})$/);
            if (myOnly) {
                return sanitizeYMD(myOnly[2], myOnly[1], 1);
            }

            // 13. Standart Date parse
            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) {
                return sanitizeYMD(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
            }

            const rawRes = str.substring(0, 10) || getLocalDateStr();
            if (/^\\d{4}/.test(rawRes)) {
                const y = parseInt(rawRes.substring(0, 4), 10);
                if (y < 2024) {
                    return '2026' + rawRes.substring(4);
                }
            }
            return rawRes;
        }

        // Tarihten standart 'YYYY-MM' anahtarını çıkarır
        function extractMonthKey(dateVal) {
            if (!dateVal) return '';
            if (dateVal === 'all') return 'all';

            if (typeof dateVal === 'object') {
                if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
                    let y = dateVal.getFullYear();
                    if (y < 2024) y = 2026;
                    return \`\${y}-\${String(dateVal.getMonth() + 1).padStart(2, '0')}\`;
                }
                const inner = dateVal.date || dateVal.Tarih || dateVal.tarih || dateVal.period || dateVal.value;
                if (inner) return extractMonthKey(inner);
            }

            const s = String(dateVal).trim();
            if (s === 'all') return 'all';

            // Zaten YYYY-MM formatında ise direkt döndür
            const direct = s.match(/^(\\d{4})[-/.](\\d{1,2})/);
            if (direct) {
                let y = parseInt(direct[1], 10);
                let m = parseInt(direct[2], 10);
                if (y < 2024) y = 2026;
                if (m >= 1 && m <= 12) {
                    return \`\${y}-\${String(m).padStart(2, '0')}\`;
                }
            }

            // MM-YYYY formatı kontrolü
            const myMatch = s.match(/^(\\d{1,2})[-/.](\\d{4})$/);
            if (myMatch) {
                let m = parseInt(myMatch[1], 10);
                let y = parseInt(myMatch[2], 10);
                if (y < 2024) y = 2026;
                if (m >= 1 && m <= 12) {
                    return \`\${y}-\${String(m).padStart(2, '0')}\`;
                }
            }

            const ymd = normalizeDateToYMD(dateVal);
            if (ymd && ymd.length >= 7) {
                const match = ymd.match(/^(\\d{4}-\\d{2})/);
                if (match) return match[1];
                return ymd.substring(0, 7);
            }
            return '';
        }

        // İki tarihin veya dönemin aynı aya ait olup olmadığını güvenle doğrular
        function isSameMonth(txDate, targetMonth) {
            if (!targetMonth || targetMonth === 'all' || targetMonth === 'ALL') return true;
            if (!txDate) return false;

            const txKey = extractMonthKey(txDate);
            const targetKey = extractMonthKey(targetMonth) || String(targetMonth).trim().substring(0, 7);

            // 1. Birebir YYYY-MM eşleşmesi
            if (txKey && targetKey && txKey === targetKey) {
                return true;
            }

            const ymd = normalizeDateToYMD(txDate);
            if (targetKey && ymd && ymd.startsWith(targetKey)) {
                return true;
            }

            // 2. Yıl Toleranslı Eşleşme
            const targetM = targetKey.includes('-') ? targetKey.split('-')[1] : targetKey;
            const txM = txKey.includes('-') ? txKey.split('-')[1] : (ymd ? ymd.split('-')[1] : '');

            if (targetM && txM && parseInt(targetM, 10) === parseInt(txM, 10)) {
                const hasExactYearInTx = Array.isArray(transactions) && transactions.some(t => {
                    const k = extractMonthKey(t.date);
                    return k === targetKey;
                });
                if (!hasExactYearInTx) {
                    return true;
                }
            }

            return false;
        }

        // Tabloda gösterim için DD.MM.YYYY formatına çevirir
        function formatDateDisplay(dateStr) {
            if (!dateStr) return '-';
            const ymd = normalizeDateToYMD(dateStr);
            const parts = ymd.split('-');
            if (parts.length === 3) {
                return \`\${parts[2]}.\${parts[1]}.\${parts[0]}\`;
            }
            return dateStr;
        }

        // Sayı ve para formatını hatasız çözer
        function parseAmount(val) {
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            if (!val) return 0;
            let s = String(val).replace(/[^\\d.,-]/g, '').trim();
            if (!s) return 0;

            if (s.includes(',') && s.includes('.')) {
                if (s.indexOf('.') < s.indexOf(',')) {
                    // Türk standardı: 1.250,50
                    s = s.replace(/\\./g, '').replace(',', '.');
                } else {
                    // US standardı: 1,250.50
                    s = s.replace(/,/g, '');
                }
            } else if (s.includes(',')) {
                s = s.replace(',', '.');
            } else if (s.includes('.')) {
                const parts = s.split('.');
                if (parts.length > 2) {
                    s = parts.join('');
                } else if (parts[1] && parts[1].length === 3 && parseFloat(parts[0]) >= 1) {
                    s = parts[0] + parts[1];
                }
            }
            const num = parseFloat(s);
            return isNaN(num) ? 0 : num;
        }

        // Türkçe Ay İsimleri (örn: "2026-08" -> "Ağustos 2026")
        function getMonthNameTr(monthKey) {
            if (!monthKey || monthKey === 'all') return 'Tüm Zamanlar';
            const key = extractMonthKey(monthKey) || monthKey;
            if (!key || key.length < 7) return key || '';
            const parts = key.split('-');
            const y = parts[0];
            const m = parseInt(parts[1], 10);
            const monthNames = [
                'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
            ];
            return \`\${monthNames[m - 1] || parts[1]} \${y}\`;
        }

        // Gelir kategorisi tespiti (Türkçe karakter ve ek varyasyonlara tam dayanıklı)
        function isIncomeCategory(catStr) {
            if (!catStr) return false;
            const c = String(catStr).trim().toLowerCase()
                .replace(/ı/g, 'i')
                .replace(/ğ/g, 'g')
                .replace(/ü/g, 'u')
                .replace(/ş/g, 's')
                .replace(/ö/g, 'o')
                .replace(/ç/g, 'c');
            return c.includes('gelir') || c.includes('maas') || c.includes('kazanc') || 
                   c.includes('tahsilat') || c.includes('giris') || c.includes('alacak') || 
                   c.includes('prim') || c.includes('bonus') || c.startsWith('+');
        }

        // Yerel veriyi temizleyip normalize ederek yükleme
        function loadNormalizedTransactions() {
            try {
                const raw = localStorage.getItem('local_tx_v2');
                if (!raw) return [];
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return parsed.map((item, idx) => {
                        const rawDate = getObjVal(item, ['date', 'Date', 'Tarih', 'tarih', 'TARİH', 'İşlem Tarihi', 'islem_tarihi']);
                        const rawCat = getObjVal(item, ['category', 'Category', 'Kategori', 'kategori', 'KAT', 'Tür', 'tur']);
                        const rawAmt = getObjVal(item, ['amount', 'Amount', 'Tutar', 'tutar', 'TUTAR', 'Fiyat', 'Bedel']);
                        const rawNote = getObjVal(item, ['note', 'Note', 'Açıklama', 'aciklama', 'AÇIKLAMA', 'description', 'Detay']);
                        const rawId = getObjVal(item, ['id', 'ID', 'Id', 'rowId', 'ID_NO', 'No']);

                        return {
                            id: String(rawId || ('ID_' + (idx + 1) + '_' + Math.random().toString(36).substring(2, 6))),
                            date: normalizeDateToYMD(rawDate),
                            category: String(rawCat || 'Diğer Gider').trim(),
                            amount: parseAmount(rawAmt),
                            note: String(rawNote || '').trim()
                        };
                    });
                }
            } catch(e) {
                console.warn('Yerel veri yükleme hatası:', e);
            }
            return [];
        }

        let transactions = loadNormalizedTransactions();
        if (transactions.length > 0) {
            localStorage.setItem('local_tx_v2', JSON.stringify(transactions));
        }

        const DEFAULT_TEMPLATES = [{"id":"tpl_salary","title":"+ Maaş","category":"Sabit Gelir","defaultNote":"Aylık Net Maaş"},{"id":"tpl_card","title":"- Kart","category":"Kart Ekstresi","defaultNote":"Kredi Kartı Ekstre Ödemesi"},{"id":"tpl_cash","title":"- Nakit","category":"Nakit Çekim","defaultNote":"ATM Nakit Çekim"},{"id":"tpl_side","title":"+ Ek Gelir","category":"Ek Gelir","defaultNote":"Freelance & Ek Kazanç"}];
        let quickTemplates = JSON.parse(localStorage.getItem('local_tpls_v2') || JSON.stringify(DEFAULT_TEMPLATES));

        // ==========================================
        // PIN & GÜVENLİK KONTROLLERİ
        // ==========================================
        function checkInitialLock() {
            if (!STORED_PIN) {
                // PIN ayarlanmamışsa, kullanıcıdan PIN oluşturmasını iste veya direkt aç
                document.getElementById('lockTitle').innerText = 'Güvenlik PIN Kodu Belirleyin';
                document.getElementById('lockSubtitle').innerText = 'Verilerinizi korumak için 4 haneli PIN belirleyin';
            }

            if (IS_UNLOCKED && STORED_PIN) {
                revealApp();
            } else {
                document.getElementById('lockScreen').classList.remove('hidden');
                document.getElementById('pinInput').focus();
            }
        }

        function revealApp() {
            document.getElementById('lockScreen').classList.add('hidden');
            const main = document.getElementById('mainApp');
            main.classList.remove('opacity-0');
            main.classList.add('opacity-100');
            initApp();
        }

        function pressKey(num) {
            const input = document.getElementById('pinInput');
            if (input.value.length < 12) {
                input.value += num;
                document.getElementById('lockError').classList.add('hidden');
            }
        }

        function deletePin() {
            const input = document.getElementById('pinInput');
            input.value = input.value.slice(0, -1);
            document.getElementById('lockError').classList.add('hidden');
        }

        function clearPin() {
            document.getElementById('pinInput').value = '';
            document.getElementById('lockError').classList.add('hidden');
        }

        function togglePinVisibility() {
            const input = document.getElementById('pinInput');
            input.type = input.type === 'password' ? 'text' : 'password';
        }

        function submitUnlock() {
            const pinVal = document.getElementById('pinInput').value.trim();
            const remember = document.getElementById('rememberDeviceCheck').checked;

            if (!pinVal) {
                showLockError('Lütfen bir PIN girin.');
                return;
            }

            if (!STORED_PIN) {
                // Yeni PIN olarak kaydet
                STORED_PIN = pinVal;
                localStorage.setItem('cashflow_security_pin_v2', pinVal);
                localStorage.setItem('cashflow_pin_enabled_v2', 'true');
            }

            if (pinVal === STORED_PIN) {
                IS_UNLOCKED = true;
                sessionStorage.setItem('cashflow_session_unlocked_v2', 'true');
                if (remember) {
                    localStorage.setItem('cashflow_remember_device_v2', 'true');
                    localStorage.setItem('cashflow_session_unlocked_v2', 'true');
                } else {
                    localStorage.removeItem('cashflow_remember_device_v2');
                    localStorage.removeItem('cashflow_session_unlocked_v2');
                }
                revealApp();
            } else {
                showLockError('Hatalı PIN Kodu! Lütfen tekrar deneyin.');
                document.getElementById('pinInput').value = '';
            }
        }

        function showLockError(msg) {
            const err = document.getElementById('lockError');
            err.innerText = msg;
            err.classList.remove('hidden');
        }

        function lockAppNow() {
            sessionStorage.removeItem('cashflow_session_unlocked_v2');
            localStorage.removeItem('cashflow_session_unlocked_v2');
            IS_UNLOCKED = false;
            document.getElementById('pinInput').value = '';
            document.getElementById('lockScreen').classList.remove('hidden');
            const main = document.getElementById('mainApp');
            main.classList.remove('opacity-100');
            main.classList.add('opacity-0');
        }

        // ==========================================
        // DÖNEM YÖNETİMİ & BUTONLARI
        // ==========================================
        function getAvailableMonths() {
            const monthCounts = {};
            transactions.forEach(t => {
                const m = extractMonthKey(t.date);
                if (m && m !== 'all') {
                    monthCounts[m] = (monthCounts[m] || 0) + 1;
                }
            });
            return Object.keys(monthCounts).sort().reverse();
        }

        function updateMonthSelect() {
            const select = document.getElementById('selectedMonthSelect');
            if (!select) return;

            const available = getAvailableMonths();
            const current = document.getElementById('selectedMonth').value;
            const currentKey = extractMonthKey(current) || current;

            let html = \`<option value="all" \${isAllTimeMode ? 'selected' : ''}>🌐 TÜM ZAMANLAR (\${transactions.length})</option>\`;
            
            available.forEach(m => {
                const count = transactions.filter(t => isSameMonth(t.date, m)).length;
                const isSel = !isAllTimeMode && (currentKey === m);
                html += \`<option value="\${m}" \${isSel ? 'selected' : ''}>📅 \${getMonthNameTr(m).toUpperCase()} (\${count})</option>\`;
            });

            select.innerHTML = html;
        }

        function stepMonth(delta) {
            const available = getAvailableMonths();
            if (available.length === 0) return;

            if (isAllTimeMode) {
                selectMonthKey(delta > 0 ? available[available.length - 1] : available[0]);
                return;
            }

            const current = document.getElementById('selectedMonth').value;
            const currentKey = extractMonthKey(current) || current;
            const idx = available.indexOf(currentKey);

            if (idx === -1) {
                selectMonthKey(available[0]);
                return;
            }

            const targetIdx = idx - delta;
            if (targetIdx >= 0 && targetIdx < available.length) {
                selectMonthKey(available[targetIdx]);
            }
        }

        function selectCurrentMonth() {
            const available = getAvailableMonths();
            const now = new Date();
            const calKey = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}\`;
            const hasCalData = transactions.some(t => isSameMonth(t.date, calKey));
            if (hasCalData) {
                selectMonthKey(calKey);
            } else if (available.length > 0) {
                selectMonthKey(available[0]);
            } else {
                selectMonthKey(calKey);
            }
        }

        function renderMonthPills() {
            const container = document.getElementById('monthPillsContainer');
            if (!container) return;

            const available = getAvailableMonths();
            const current = document.getElementById('selectedMonth').value;
            const currentKey = extractMonthKey(current) || current;

            if (available.length === 0) {
                container.innerHTML = '<span class="text-[11px] text-zinc-500 italic">Kayıtlı dönem bulunamadı.</span>';
                return;
            }

            const now = new Date();
            const calKey = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}\`;
            const hasCalData = transactions.some(t => isSameMonth(t.date, calKey));
            const buAyTargetKey = hasCalData ? calKey : (available[0] || calKey);
            const isBuAyActive = !isAllTimeMode && (currentKey === buAyTargetKey);
            const buAyCount = transactions.filter(t => isSameMonth(t.date, buAyTargetKey)).length;

            const buAyPill = \`
                <button type="button" onclick="selectCurrentMonth()"
                    class="text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 \${isBuAyActive ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-md shadow-blue-950' : 'bg-zinc-900 hover:bg-zinc-800 text-blue-400 border-zinc-700'}"
                    title="Bu Ay (\${getMonthNameTr(buAyTargetKey)})">
                    <span>⚡ Bu Ay</span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full \${isBuAyActive ? 'bg-blue-700 text-white' : 'bg-zinc-800 text-zinc-400'} font-mono">\${buAyCount}</span>
                </button>
            \`;

            const pills = available.map(m => {
                const count = transactions.filter(t => isSameMonth(t.date, m)).length;
                const isActive = !isAllTimeMode && (currentKey === m);
                const activeClass = isActive
                    ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-md shadow-blue-950'
                    : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800';

                return \`
                    <button type="button" onclick="selectMonthKey('\${m}')"
                        class="text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 \${activeClass}">
                        <span>📅 \${getMonthNameTr(m)}</span>
                        <span class="text-[9px] px-1.5 py-0.5 rounded-full \${isActive ? 'bg-blue-700 text-white' : 'bg-zinc-800 text-zinc-400'} font-mono">\${count}</span>
                    </button>
                \`;
            }).join('');

            const totalCount = transactions.length;
            const allActive = isAllTimeMode;
            const allPill = \`
                <button type="button" onclick="setAllTimeMode(true)"
                    class="text-[11px] px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 \${allActive ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-md shadow-blue-950' : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800'}">
                    <span>🌐 Tüm Zamanlar</span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full \${allActive ? 'bg-blue-700 text-white' : 'bg-zinc-800 text-zinc-400'} font-mono">\${totalCount}</span>
                </button>
            \`;

            container.innerHTML = buAyPill + pills + allPill;
        }

        function selectMonthKey(m) {
            if (m === 'all') {
                setAllTimeMode(true);
                return;
            }
            isAllTimeMode = false;
            const canonicalKey = extractMonthKey(m) || m;
            const input = document.getElementById('selectedMonth');
            if (input) input.value = canonicalKey;
            updateAllTimeBtnState();
            updateMonthSelect();
            renderMonthPills();
            updateAnalysis();
            renderTable();
        }

        function setAllTimeMode(val) {
            isAllTimeMode = Boolean(val);
            updateAllTimeBtnState();
            updateMonthSelect();
            renderMonthPills();
            updateAnalysis();
            renderTable();
        }

        function toggleAllTime() {
            setAllTimeMode(!isAllTimeMode);
        }

        function updateAllTimeBtnState() {
            const btn = document.getElementById('allTimeBtn');
            const input = document.getElementById('selectedMonth');
            const periodLabel = document.getElementById('activePeriodLabel');
            if (!btn || !input) return;

            if (isAllTimeMode) {
                btn.className = 'text-[10px] uppercase font-bold px-2.5 py-1 bg-blue-600 text-white rounded-lg border border-blue-500 shadow transition';
                input.disabled = true;
                input.classList.add('opacity-40');
                if (periodLabel) periodLabel.innerText = 'tüm zamanlar';
            } else {
                btn.className = 'text-[10px] uppercase font-bold px-2.5 py-1 bg-zinc-900 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition';
                input.disabled = false;
                input.classList.remove('opacity-40');
                const targetKey = extractMonthKey(input.value) || input.value;
                if (periodLabel) periodLabel.innerText = getMonthNameTr(targetKey) || 'seçili ay';
            }
        }

        function autoAlignMonth() {
            if (!transactions || transactions.length === 0) return;
            const currentSelected = document.getElementById('selectedMonth').value;
            const targetKey = extractMonthKey(currentSelected) || currentSelected;
            const hasInCurrent = transactions.some(t => isSameMonth(t.date, targetKey));
            if (!hasInCurrent) {
                const available = getAvailableMonths();
                if (available.length > 0) {
                    document.getElementById('selectedMonth').value = available[0];
                    isAllTimeMode = false;
                    updateAllTimeBtnState();
                }
            }
        }

        // ==========================================
        // UYGULAMA BAŞLANGIÇ
        // ==========================================
        function initApp() {
            const now = new Date();
            const curYear = Math.max(now.getFullYear(), 2026);
            let defaultMonth = \`\${curYear}-\${String(now.getMonth() + 1).padStart(2, '0')}\`;

            const availableMonths = getAvailableMonths();
            if (availableMonths.length > 0) {
                const hasInCurrent = transactions.some(t => isSameMonth(t.date, defaultMonth));
                if (!hasInCurrent) {
                    defaultMonth = availableMonths[0];
                }
            }

            isTableFilterByMonth = true;
            const monthInput = document.getElementById('selectedMonth');
            monthInput.value = defaultMonth;
            document.getElementById('txDate').value = getLocalDateStr();

            monthInput.addEventListener('change', () => {
                isAllTimeMode = false;
                updateAllTimeBtnState();
                renderMonthPills();
                updateAnalysis();
                renderTable();
            });

            monthInput.addEventListener('input', () => {
                isAllTimeMode = false;
                updateAllTimeBtnState();
                renderMonthPills();
                updateAnalysis();
                renderTable();
            });

            updateAllTimeBtnState();
            updateMonthSelect();
            renderQuickTemplates();
            renderMonthPills();
            renderTable();
            updateAnalysis();

            if (GAS_URL) {
                document.getElementById('gasStatusBadge').innerText = 'E-Tablo Bağlı';
                document.getElementById('gasStatusBadge').className = 'text-xs px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800';
                fetchData();
            }
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        function renderQuickTemplates() {
            const grid = document.getElementById('quickTemplatesGrid');
            if (!quickTemplates || quickTemplates.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-[10px] text-zinc-500 py-1 italic">Tanımlı şablon yok. "⚙️ Şablonlar" ile ekleyebilirsiniz.</div>';
                return;
            }
            grid.innerHTML = quickTemplates.map(tpl => \`
                <button type="button" onclick="applyTemplateById('\${tpl.id}')"
                    class="bg-zinc-800/80 hover:bg-zinc-700 active:bg-blue-600 p-2 rounded-xl border border-zinc-700/80 text-left transition flex flex-col justify-between truncate group">
                    <span class="font-bold text-zinc-200 group-hover:text-white truncate block">\${escapeHtml(tpl.title)}</span>
                    <span class="text-[9px] text-zinc-400 truncate block">\${escapeHtml(tpl.category)}</span>
                </button>
            \`).join('');
        }

        function applyTemplateById(id) {
            const tpl = quickTemplates.find(t => t.id === id);
            if (!tpl) return;
            applyTemplate(tpl);
        }

        function applyTemplate(tpl) {
            document.getElementById('txCategory').value = tpl.category;
            document.getElementById('txNote').value = tpl.defaultNote || tpl.title;
            if (tpl.defaultAmount !== undefined && tpl.defaultAmount !== null && tpl.defaultAmount !== '') {
                document.getElementById('txAmount').value = tpl.defaultAmount;
            } else {
                document.getElementById('txAmount').value = '';
            }
            document.getElementById('txAmount').focus();
        }

        // ==========================================
        // ŞABLON YÖNETİCİSİ MODAL MANTIĞI
        // ==========================================
        function openTemplateManager() {
            const modal = document.getElementById('tplModal');
            modal.classList.remove('hidden');
            renderTemplateList();
            resetTemplateForm();
        }

        function closeTemplateManager() {
            const modal = document.getElementById('tplModal');
            modal.classList.add('hidden');
            resetTemplateForm();
        }

        function renderTemplateList() {
            const list = document.getElementById('tplList');
            if (!quickTemplates || quickTemplates.length === 0) {
                list.innerHTML = '<div class="text-xs text-zinc-500 text-center py-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">Kayıtlı şablon bulunmuyor. Aşağıdan yeni bir tane ekleyebilirsiniz.</div>';
                return;
            }

            list.innerHTML = quickTemplates.map(tpl => {
                const isIncome = tpl.category === 'Sabit Gelir' || tpl.category === 'Ek Gelir';
                const catColor = isIncome ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' : 'bg-zinc-800 text-zinc-300 border-zinc-700';
                return \`
                    <div class="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                        <div class="truncate mr-2">
                            <div class="flex items-center gap-2">
                                <span class="font-bold text-zinc-100">\${escapeHtml(tpl.title)}</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded border \${catColor}">\${escapeHtml(tpl.category)}</span>
                            </div>
                            <div class="text-[11px] text-zinc-400 truncate mt-0.5">
                                \${tpl.defaultNote ? escapeHtml(tpl.defaultNote) : '<span class="text-zinc-600">Açıklama yok</span>'}
                                \${tpl.defaultAmount ? \`<span class="font-mono text-zinc-300 ml-1.5 font-semibold">• ₺\${tpl.defaultAmount}</span>\` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                            <button type="button" onclick="editTemplate('\${tpl.id}')" class="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition" title="Düzenle">
                                ✏️
                            </button>
                            <button type="button" onclick="deleteTemplate('\${tpl.id}')" class="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-rose-400 transition" title="Sil">
                                🗑️
                            </button>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        function editTemplate(id) {
            const tpl = quickTemplates.find(t => t.id === id);
            if (!tpl) return;
            document.getElementById('tplId').value = tpl.id;
            document.getElementById('tplTitle').value = tpl.title;
            document.getElementById('tplCategory').value = tpl.category;
            document.getElementById('tplNote').value = tpl.defaultNote || '';
            document.getElementById('tplAmount').value = tpl.defaultAmount !== undefined ? tpl.defaultAmount : '';
            document.getElementById('tplFormHeading').innerText = 'Şablonu Düzenle';
            document.getElementById('cancelTplEditBtn').classList.remove('hidden');
            document.getElementById('tplTitle').focus();
        }

        function resetTemplateForm() {
            document.getElementById('tplForm').reset();
            document.getElementById('tplId').value = '';
            document.getElementById('tplFormHeading').innerText = 'Yeni Şablon Ekle';
            document.getElementById('cancelTplEditBtn').classList.add('hidden');
        }

        function saveCustomTemplate(e) {
            e.preventDefault();
            const id = document.getElementById('tplId').value;
            const title = document.getElementById('tplTitle').value.trim();
            const category = document.getElementById('tplCategory').value;
            const note = document.getElementById('tplNote').value.trim();
            const amtStr = document.getElementById('tplAmount').value;
            const amount = amtStr !== '' ? parseFloat(amtStr) : undefined;

            if (!title) {
                alert('Lütfen şablon başlığı girin.');
                return;
            }

            if (id) {
                quickTemplates = quickTemplates.map(t => t.id === id ? {
                    id: t.id,
                    title,
                    category,
                    defaultNote: note,
                    defaultAmount: amount
                } : t);
            } else {
                const newTpl = {
                    id: 'tpl_' + Date.now(),
                    title,
                    category,
                    defaultNote: note,
                    defaultAmount: amount
                };
                quickTemplates.push(newTpl);
            }

            localStorage.setItem('local_tpls_v2', JSON.stringify(quickTemplates));
            renderTemplateList();
            renderQuickTemplates();
            resetTemplateForm();
        }

        function deleteTemplate(id) {
            const tpl = quickTemplates.find(t => t.id === id);
            const promptName = tpl ? tpl.title : 'Bu şablonu';
            if (!confirm(\`"\${promptName}" şablonunu silmek istediğinize emin misiniz?\`)) return;

            quickTemplates = quickTemplates.filter(t => t.id !== id);
            localStorage.setItem('local_tpls_v2', JSON.stringify(quickTemplates));
            renderTemplateList();
            renderQuickTemplates();
            resetTemplateForm();
        }

        function resetTemplatesToDefault() {
            if (!confirm('Tüm şablonlar varsayılan listeye sıfırlansın mı?')) return;
            quickTemplates = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
            localStorage.setItem('local_tpls_v2', JSON.stringify(quickTemplates));
            renderTemplateList();
            renderQuickTemplates();
            resetTemplateForm();
        }

        function formatTRY(num) {
            return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(num);
        }

        function toggleSettings() {
            document.getElementById('settingsArea').classList.toggle('hidden');
        }

        function saveSettings() {
            const url = document.getElementById('apiUrl').value.trim();
            const pin = document.getElementById('settingsPin').value.trim();
            
            localStorage.setItem('gas_url_v2', url);
            GAS_URL = url;

            if (pin) {
                localStorage.setItem('cashflow_security_pin_v2', pin);
                STORED_PIN = pin;
            }

            alert('Ayarlar başarıyla kaydedildi!');
            toggleSettings();
            if (GAS_URL) {
                document.getElementById('gasStatusBadge').innerText = 'E-Tablo Bağlı';
                document.getElementById('gasStatusBadge').className = 'text-xs px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800';
                fetchData();
            }
        }

        async function fetchData() {
            if (!GAS_URL) return;
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-zinc-500 animate-pulse">Google E-Tablolardan veriler çekiliyor...</td></tr>';

            let reqUrl = GAS_URL;
            if (STORED_PIN) {
                const sep = reqUrl.includes('?') ? '&' : '?';
                reqUrl = \`\${reqUrl}\${sep}pin=\${encodeURIComponent(STORED_PIN)}\`;
            }

            try {
                const res = await fetch(reqUrl);
                const data = await res.json();
                if (data && data.code === 'UNAUTHORIZED') {
                    tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-rose-400 font-bold">⚠️ Google Apps Script PIN doğrulaması başarısız. Lütfen Code.gs PIN kodu ile ayarlarınızdaki PIN kodunu kontrol edin.</td></tr>';
                    return;
                }
                if (Array.isArray(data)) {
                    transactions = data.map((item, idx) => {
                        const rawDate = getObjVal(item, ['Tarih', 'tarih', 'TARİH', 'date', 'Date', 'İşlem Tarihi', 'islem_tarihi']);
                        const rawCategory = getObjVal(item, ['Kategori', 'kategori', 'KAT', 'category', 'Category', 'Tür', 'tur']);
                        const rawAmount = getObjVal(item, ['Tutar', 'tutar', 'TUTAR', 'amount', 'Amount', 'Fiyat', 'Bedel']);
                        const rawNote = getObjVal(item, ['Açıklama', 'aciklama', 'AÇIKLAMA', 'note', 'Note', 'description', 'Detay']);
                        const rawId = getObjVal(item, ['ID', 'id', 'Id', 'rowId', 'ID_NO', 'No']);

                        return {
                            id: String(rawId || ('ID_' + (idx + 1) + '_' + Math.random().toString(36).substring(2, 6))),
                            date: normalizeDateToYMD(rawDate),
                            category: String(rawCategory || 'Diğer Gider').trim(),
                            amount: parseAmount(rawAmount),
                            note: String(rawNote || '').trim()
                        };
                    });
                    localStorage.setItem('local_tx_v2', JSON.stringify(transactions));
                    autoAlignMonth();
                    updateAllTimeBtnState();
                    updateMonthSelect();
                    renderMonthPills();
                    renderTable();
                    updateAnalysis();
                }
            } catch(e) {
                console.error('Fetch Data Hatası:', e);
                tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-rose-400">Veri çekilemedi. Apps Script URL veya internet bağlantısını kontrol edin.</td></tr>';
                renderMonthPills();
                renderTable();
                updateAnalysis();
            }
        }

        // Form Submit
        document.getElementById('txForm').onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('txId').value;
            const date = document.getElementById('txDate').value;
            const category = document.getElementById('txCategory').value;
            const amount = parseAmount(document.getElementById('txAmount').value);
            const note = document.getElementById('txNote').value.trim();

            const btn = document.getElementById('submitBtn');
            const spinner = document.getElementById('btnSpinner');
            const btnText = document.getElementById('btnText');
            btn.disabled = true;
            spinner.classList.remove('hidden');

            const newTx = {
                id: id || ('ID_' + Date.now()),
                date: normalizeDateToYMD(date),
                category: category,
                amount: amount,
                note: note
            };

            if (id) {
                transactions = transactions.map(t => t.id === id ? newTx : t);
            } else {
                transactions.unshift(newTx);
            }
            localStorage.setItem('local_tx_v2', JSON.stringify(transactions));
            renderMonthPills();
            renderTable();
            updateAnalysis();

            if (GAS_URL) {
                try {
                    await fetch(GAS_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: id ? 'update' : 'insert',
                            ...newTx,
                            pin: STORED_PIN || undefined
                        })
                    });
                } catch(err) {
                    console.error('GAS Post Hatası:', err);
                }
            }

            resetForm();
            btn.disabled = false;
            spinner.classList.add('hidden');
        };

        function resetForm() {
            document.getElementById('txForm').reset();
            document.getElementById('txId').value = '';
            document.getElementById('txDate').value = getLocalDateStr();
            document.getElementById('btnText').innerText = 'Kaydet';
            document.getElementById('cancelEditBtn').classList.add('hidden');
        }

        function editTx(tx) {
            document.getElementById('txId').value = tx.id;
            document.getElementById('txDate').value = normalizeDateToYMD(tx.date);
            document.getElementById('txCategory').value = tx.category;
            document.getElementById('txAmount').value = tx.amount;
            document.getElementById('txNote').value = tx.note || '';
            document.getElementById('btnText').innerText = 'Güncelle';
            document.getElementById('cancelEditBtn').classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        async function deleteTx(id) {
            const item = transactions.find(t => t.id === id);
            const promptNote = item ? (item.note || item.category) : '';
            if (window.confirm && !confirm('Bu kaydı (' + promptNote + ') silmek istediğinize emin misiniz?')) return;
            
            transactions = transactions.filter(t => t.id !== id);
            localStorage.setItem('local_tx_v2', JSON.stringify(transactions));
            renderMonthPills();
            renderTable();
            updateAnalysis();

            if (GAS_URL) {
                try {
                    await fetch(GAS_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            action: 'delete', 
                            id: id,
                            date: item ? item.date : undefined,
                            category: item ? item.category : undefined,
                            amount: item ? item.amount : undefined,
                            note: item ? item.note : undefined,
                            pin: STORED_PIN || undefined
                        })
                    });
                } catch(e) {
                    console.error('GAS Delete Error:', e);
                }
            }
        }

        function renderTable() {
            const tbody = document.getElementById('tableBody');
            const toggleBtn = document.getElementById('tableFilterToggleBtn');
            const subtitle = document.getElementById('tablePeriodSubtitle');
            const catFilter = document.getElementById('tableCategoryFilter');
            const searchEl = document.getElementById('searchInput');

            const currentMonth = document.getElementById('selectedMonth').value;
            const targetKey = extractMonthKey(currentMonth) || currentMonth;
            const monthName = getMonthNameTr(targetKey);

            // Update toggle button state
            if (toggleBtn) {
                if (isAllTimeMode) {
                    toggleBtn.innerHTML = \`<span>📅 \${monthName} Dönemine Dön</span>\`;
                    toggleBtn.className = 'px-2.5 py-1.5 rounded-lg font-bold text-xs tracking-tight transition bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 shadow-sm';
                } else {
                    toggleBtn.innerHTML = \`<span>🌐 Tümünü Göster (\${transactions.length})</span>\`;
                    toggleBtn.className = 'px-2.5 py-1.5 rounded-lg font-bold text-xs tracking-tight transition bg-zinc-950 hover:bg-zinc-800 text-blue-400 border border-zinc-800 flex items-center gap-1.5 shadow-sm';
                }
            }

            let displayList = [...transactions];

            // 1. Ay / Dönem Filtresi (Seçili ay aktifse o aya göre, tüm zamanlar aktifse tümü)
            if (!isAllTimeMode && targetKey) {
                displayList = displayList.filter(t => isSameMonth(t.date, targetKey));
            }

            // 2. Kategori Filtresi
            const selectedCat = catFilter ? catFilter.value : 'all';
            if (selectedCat && selectedCat !== 'all') {
                displayList = displayList.filter(t => t.category === selectedCat);
            }

            // 3. Arama Filtresi
            const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
            if (q) {
                displayList = displayList.filter(t => {
                    const matchNote = (t.note || '').toLowerCase().includes(q);
                    const matchCat = (t.category || '').toLowerCase().includes(q);
                    const matchAmount = String(t.amount || '').includes(q);
                    const matchDate = String(t.date || '').includes(q);
                    return matchNote || matchCat || matchAmount || matchDate;
                });
            }

            // Subtitle & Badge
            if (subtitle) {
                if (!isAllTimeMode && targetKey) {
                    subtitle.innerText = \`\${monthName.toUpperCase()} DÖNEMİ İŞLEM HAREKETLERİ (\${displayList.length} KAYIT)\`;
                } else {
                    subtitle.innerText = \`TÜM ZAMANLAR İŞLEM GEÇMİŞİ (\${displayList.length} KAYIT)\`;
                }
            }
            document.getElementById('txCountBadge').innerText = \`\${displayList.length} Kayıt\`;

            if (displayList.length === 0) {
                const available = getAvailableMonths();
                const periodButtons = available.slice(0, 6).map(m => \`
                    <button type="button" onclick="selectMonthKey('\${m}')"
                        class="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-blue-400 hover:text-white border border-zinc-700 rounded-lg text-[10px] font-mono font-bold uppercase transition flex items-center gap-1">
                        <span>📅 \${getMonthNameTr(m)}</span>
                    </button>
                \`).join('');

                tbody.innerHTML = \`
                    <tr>
                        <td colspan="5" class="p-8 sm:p-12 text-center text-zinc-500">
                            <div class="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                                <span class="text-3xl">📂</span>
                                <div>
                                    <p class="text-xs font-bold text-zinc-300 uppercase tracking-wider">Kayıt Bulunamadı</p>
                                    <p class="text-[11px] text-zinc-500 font-mono mt-0.5">
                                        \${q 
                                            ? 'Arama kriterlerinize uygun hareket bulunamadı.' 
                                            : (!isAllTimeMode 
                                                ? \`\${monthName} dönemi için henüz işlem girişi yapılmadı.\` 
                                                : 'Henüz sistemde kayıtlı işlem yok.')}
                                    </p>
                                </div>
                                \${!isAllTimeMode && available.length > 0 ? \`
                                    <div class="w-full pt-3 border-t border-zinc-800/80 flex flex-col items-center gap-2">
                                        <p class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Kayıt İçeren Dönemler:</p>
                                        <div class="flex flex-wrap items-center justify-center gap-1.5">
                                            \${periodButtons}
                                            <button type="button" onclick="setAllTimeMode(true)"
                                                class="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase transition shadow-md shadow-blue-950">
                                                🌐 Tümünü Göster (\${transactions.length})
                                            </button>
                                        </div>
                                    </div>
                                \` : ''}
                            </div>
                        </td>
                    </tr>
                \`;
                return;
            }

            const sorted = displayList.sort((a, b) => {
                const da = new Date(normalizeDateToYMD(a.date)).getTime();
                const db = new Date(normalizeDateToYMD(b.date)).getTime();
                return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
            });
            
            tbody.innerHTML = sorted.map(item => {
                const isIncome = isIncomeCategory(item.category);
                let catBadge = 'bg-zinc-800 text-zinc-300 border border-zinc-700';
                const catLower = String(item.category || '').toLowerCase();
                if (isIncome) catBadge = 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80';
                else if (catLower.includes('kart') || catLower.includes('ekstre')) catBadge = 'bg-rose-950/60 text-rose-400 border border-rose-800/80';
                else if (catLower.includes('transfer') || catLower.includes('kira') || catLower.includes('eft') || catLower.includes('havale') || catLower.includes('fatura')) catBadge = 'bg-blue-950/60 text-blue-400 border border-blue-800/80';
                else if (catLower.includes('nakit') || catLower.includes('atm')) catBadge = 'bg-amber-950/60 text-amber-400 border border-amber-800/80';

                return \`
                    <tr class="hover:bg-zinc-900/60 transition">
                        <td class="p-3.5 font-mono text-zinc-400 whitespace-nowrap">\${formatDateDisplay(item.date)}</td>
                        <td class="p-3.5"><span class="text-[10px] font-semibold px-2 py-0.5 rounded-md \${catBadge}">\${escapeHtml(item.category)}</span></td>
                        <td class="p-3.5 text-zinc-300 font-medium">\${item.note ? escapeHtml(item.note) : '-'}</td>
                        <td class="p-3.5 text-right font-mono font-bold whitespace-nowrap \${isIncome ? 'text-emerald-400' : 'text-zinc-200'}">
                            \${isIncome ? '+' : '-'}\${formatTRY(item.amount)}
                        </td>
                        <td class="p-3.5 text-center space-x-2 whitespace-nowrap">
                            <button onclick='editTx(\${JSON.stringify(item)})' class="text-zinc-400 hover:text-white p-1" title="Düzenle">✏️</button>
                            <button onclick='deleteTx("\${item.id}")' class="text-zinc-400 hover:text-rose-400 p-1" title="Sil">🗑️</button>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        function filterTable() {
            renderTable();
        }

        function updateAnalysis() {
            const monthInput = document.getElementById('selectedMonth');
            let rawMonth = monthInput ? monthInput.value : '';

            // Seçili ay boşsa veya geçersizse mevcut kayıtlardan ilk ayı veya bugünü belirle
            if (!isAllTimeMode && !rawMonth) {
                const available = getAvailableMonths();
                if (available.length > 0) {
                    rawMonth = available[0];
                    if (monthInput) monthInput.value = rawMonth;
                } else {
                    rawMonth = extractMonthKey(getLocalDateStr());
                    if (monthInput) monthInput.value = rawMonth;
                }
            }

            const targetKey = isAllTimeMode ? 'all' : (extractMonthKey(rawMonth) || rawMonth);

            let income = 0, card = 0, transfer = 0, cash = 0, other = 0;
            let countInMonth = 0;

            transactions.forEach(t => {
                if (!t) return;
                const matches = isAllTimeMode || isSameMonth(t.date, targetKey);
                if (matches) {
                    countInMonth++;
                    const amt = Math.abs(parseAmount(t.amount));
                    const cat = String(t.category || '').trim();

                    if (isIncomeCategory(cat)) {
                        income += amt;
                    } else {
                        const catLower = cat.toLowerCase();
                        if (catLower.includes('kart') || catLower.includes('ekstre')) {
                            card += amt;
                        } else if (catLower.includes('transfer') || catLower.includes('kira') || catLower.includes('eft') || catLower.includes('havale') || catLower.includes('fatura') || catLower.includes('aidat')) {
                            transfer += amt;
                        } else if (catLower.includes('nakit') || catLower.includes('atm') || catLower.includes('harçlık') || catLower.includes('harclik')) {
                            cash += amt;
                        } else {
                            other += amt;
                        }
                    }
                }
            });

            const totalExpense = card + transfer + cash + other;
            const net = income - totalExpense;

            const metricIncome = document.getElementById('metricIncome');
            const metricExpense = document.getElementById('metricExpense');
            const metricNet = document.getElementById('metricNet');

            if (metricIncome) metricIncome.innerText = formatTRY(income);
            if (metricExpense) metricExpense.innerText = formatTRY(totalExpense);
            if (metricNet) metricNet.innerText = formatTRY(net);

            const adviceCard = document.getElementById('adviceCard');
            const adviceTitle = document.getElementById('adviceTitle');
            const adviceDesc = document.getElementById('adviceDesc');
            const periodTitle = isAllTimeMode ? 'Tüm Zamanlar' : (getMonthNameTr(targetKey) || 'Seçili Dönem');

            if (adviceCard && adviceTitle && adviceDesc && metricNet) {
                if (countInMonth === 0 || (income === 0 && totalExpense === 0)) {
                    metricNet.className = 'text-lg font-bold font-mono text-zinc-400';
                    adviceCard.className = 'p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 text-xs space-y-1';
                    adviceTitle.innerHTML = '<span>ℹ️</span> <span>Kayıt Bulunamadı</span>';
                    adviceDesc.innerText = isAllTimeMode 
                        ? 'Sistemde henüz kayıtlı gelir veya harcama yok.' 
                        : \`\${periodTitle} için henüz kayıtlı gelir veya harcama girilmedi (\${countInMonth} işlem). Üstteki butonlardan kayıtlı dönemleri seçebilirsiniz.\`;
                } else if (net >= 0) {
                    metricNet.className = 'text-lg font-bold font-mono text-emerald-400';
                    adviceCard.className = 'p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/30 text-xs space-y-1';
                    adviceTitle.innerHTML = isAllTimeMode 
                        ? '<span class="text-emerald-400">✅ KÜMÜLATİF ARTI BAKİYE</span>' 
                        : \`<span class="text-emerald-400">✅ GELİRDEN KARŞILANDI (\${periodTitle.toUpperCase()})</span>\`;
                    adviceDesc.innerText = isAllTimeMode
                        ? \`Başlangıçtan bu yana tüm harcamalarınız gelirlerinizden karşılandı (\${countInMonth} işlem). Kümülatif net birikiminiz: \${formatTRY(net)}.\`
                        : \`\${periodTitle} ayında harcamalar gelirden karşılandı (\${countInMonth} işlem). Kalan \${formatTRY(net)} tutarını birikim fonunuza aktarabilirsiniz.\`;
                } else {
                    metricNet.className = 'text-lg font-bold font-mono text-rose-400';
                    adviceCard.className = 'p-4 rounded-xl border border-rose-900/60 bg-rose-950/30 text-xs space-y-1';
                    adviceTitle.innerHTML = isAllTimeMode 
                        ? '<span class="text-rose-400">⚠️ KÜMÜLATİF NET AÇIK</span>' 
                        : \`<span class="text-rose-400">⚠️ BİRİKİMDEN HARCANDI (\${periodTitle.toUpperCase()})</span>\`;
                    adviceDesc.innerText = isAllTimeMode
                        ? \`Başlangıçtan bu yana toplam harcamalarınız gelirlerinizi aştı (\${countInMonth} işlem). Toplam kümülatif açık: \${formatTRY(Math.abs(net))}.\`
                        : \`\${periodTitle} ayında harcamalar geliri aştı (\${countInMonth} işlem). Açığı kapatmak için birikimden \${formatTRY(Math.abs(net))} harcama yapıldı.\`;
                }
            }

            const bar = document.getElementById('distributionBar');
            const textEl = document.getElementById('expenseBreakdownText');
            if (bar && textEl) {
                if (totalExpense > 0) {
                    const cardPct = (card / totalExpense * 100).toFixed(1);
                    const transPct = (transfer / totalExpense * 100).toFixed(1);
                    const cashPct = (cash / totalExpense * 100).toFixed(1);
                    const otherPct = (other / totalExpense * 100).toFixed(1);

                    bar.innerHTML = \`
                        <div style="width: \${cardPct}%" class="bg-rose-500 h-full" title="Kart: \${formatTRY(card)} (%\${cardPct})"></div>
                        <div style="width: \${transPct}%" class="bg-blue-500 h-full" title="Transfer: \${formatTRY(transfer)} (%\${transPct})"></div>
                        <div style="width: \${cashPct}%" class="bg-amber-500 h-full" title="Nakit: \${formatTRY(cash)} (%\${cashPct})"></div>
                        <div style="width: \${otherPct}%" class="bg-purple-500 h-full" title="Diğer: \${formatTRY(other)} (%\${otherPct})"></div>
                    \`;
                    textEl.innerText = \`Kart: %\${cardPct} | Transfer: %\${transPct} | Nakit: %\${cashPct} | Diğer: %\${otherPct}\`;
                } else {
                    bar.innerHTML = '<div class="w-full bg-zinc-800 h-full"></div>';
                    textEl.innerText = countInMonth > 0 ? 'Sadece gelir kaydı var' : 'Harcama yok';
                }
            }
        }

        // Run lock check on load
        window.addEventListener('DOMContentLoaded', checkInitialLock);

        // Escape key to close modals
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeTemplateManager();
            }
        });
    </script>
</body>
</html>
`;
}

export function downloadFile(filename: string, content: string, contentType = 'text/html'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCsv(transactions: Transaction[]): string {
  const headers = ['ID', 'Tarih', 'Kategori', 'Tutar', 'Açıklama', 'Kayıt Tarihi'];
  const rows = transactions.map((t) => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.category}"`,
    t.amount,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    `"${t.createdAt || ''}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
