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
    <title>Nakit Akışı ve Birikim Takip | Güvenli & PWA</title>
    
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
                        value="${defaultGasUrl}"
                        class="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-2.5 text-xs text-zinc-100 outline-none focus:border-blue-500 font-mono">
                </div>
                <div>
                    <label class="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Güvenlik PIN Kodu</label>
                    <input type="password" id="settingsPin" placeholder="Örn: 1923" 
                        value="${defaultPin}"
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
                        <div class="flex items-center gap-2 bg-zinc-800/80 p-1 rounded-xl border border-zinc-700">
                            <input type="month" id="selectedMonth" class="bg-transparent text-xs font-semibold text-zinc-100 px-2 py-1 outline-none">
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

        <!-- İşlem Listesi Tablosu & Gelişmiş Filtreleme -->
        <section class="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <!-- Header bar -->
            <div class="p-4 sm:p-5 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-zinc-900/50">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <h2 class="text-sm font-bold text-zinc-300 uppercase tracking-widest">SON İŞLEMLER</h2>
                        <span id="txCountBadge" class="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">0 Kayıt</span>
                    </div>
                    <p id="tablePeriodSubtitle" class="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">
                        DÖNEM İŞLEM HAREKETLERİ
                    </p>
                </div>

                <!-- Filter Controls -->
                <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <!-- Mode Switcher (Bu Ay / Tümü) -->
                    <div class="flex items-center bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg text-xs">
                        <button type="button" id="tableFilterBtnMonth" onclick="setTableFilterMode('month_only')"
                            class="px-2.5 py-1 rounded-md font-bold uppercase text-[10px] tracking-wider transition bg-zinc-800 text-blue-400">
                            Bu Ay
                        </button>
                        <button type="button" id="tableFilterBtnAll" onclick="setTableFilterMode('all_time')"
                            class="px-2.5 py-1 rounded-md font-bold uppercase text-[10px] tracking-wider transition text-zinc-500 hover:text-zinc-300">
                            Tümü
                        </button>
                    </div>

                    <!-- Search Box -->
                    <div class="relative flex-1 sm:w-48">
                        <span class="absolute left-2.5 top-2 text-zinc-500 text-xs">🔍</span>
                        <input type="text" id="searchInput" oninput="handleSearchInput(this.value)" placeholder="Filtrele veya ara..." 
                            class="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500 font-mono transition-colors">
                    </div>

                    <!-- Sort Selector -->
                    <select id="sortOrderSelect" onchange="handleSortChange(this.value)"
                        class="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500 font-sans">
                        <option value="date_desc">Tarih (Yeni → Eski)</option>
                        <option value="date_asc">Tarih (Eski → Yeni)</option>
                        <option value="amount_desc">Tutar (Yüksek → Düşük)</option>
                    </select>
                </div>
            </div>

            <!-- Category Chips Bar -->
            <div id="categoryChipsBar" class="px-4 sm:px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <!-- Rendered dynamically by JS -->
            </div>

            <!-- Table Body -->
            <div class="flex-1 overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase font-bold sticky top-0 tracking-wider">
                        <tr>
                            <th class="p-3.5 sm:p-4 border-b border-zinc-800">Tarih</th>
                            <th class="p-3.5 sm:p-4 border-b border-zinc-800">Kategori</th>
                            <th class="p-3.5 sm:p-4 border-b border-zinc-800">Açıklama</th>
                            <th class="p-3.5 sm:p-4 border-b border-zinc-800 text-right">Tutar</th>
                            <th class="p-3.5 sm:p-4 border-b border-zinc-800 text-center w-28">Eylem</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody" class="text-xs divide-y divide-zinc-800/50"></tbody>
                </table>
            </div>
        </section>
    </div>

    <!-- Şablon Yöneticisi Modal -->
    <div id="tplModal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div class="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950">
                <h3 class="font-bold text-sm text-zinc-100">Şablon Yöneticisi</h3>
                <button onclick="closeTemplateManager()" class="text-zinc-400 hover:text-white">✕</button>
            </div>
            <div class="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                <div id="tplList" class="space-y-2"></div>
                <form id="tplForm" onsubmit="saveCustomTemplate(event)" class="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
                    <h4 class="font-bold text-xs text-blue-400" id="tplFormHeading">Yeni Şablon Ekle</h4>
                    <input type="hidden" id="tplId">
                    <input type="text" id="tplTitle" placeholder="Şablon Başlığı (Örn: Kira, Fatura)" required class="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs">
                    <select id="tplCategory" class="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs">
                        <option value="Transfer Gideri">Transfer Gideri</option>
                        <option value="Kart Ekstresi">Kart Ekstresi</option>
                        <option value="Nakit Çekim">Nakit Çekim</option>
                        <option value="Sabit Gelir">Sabit Gelir</option>
                        <option value="Ek Gelir">Ek Gelir</option>
                        <option value="Diğer Gider">Diğer Gider</option>
                    </select>
                    <input type="text" id="tplNote" placeholder="Varsayılan Açıklama" class="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs">
                    <input type="number" step="0.01" id="tplAmount" placeholder="Varsayılan Tutar (Opsiyonel)" class="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs">
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg text-xs font-bold text-white">Kaydet</button>
                </form>
            </div>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- UYGULAMA MANTIĞI & GÜVENLİK SCRIPTİ -->
    <!-- ========================================== -->
    <script>
        let GAS_URL = localStorage.getItem('gas_url_v2') || "${defaultGasUrl}";
        let STORED_PIN = localStorage.getItem('cashflow_security_pin_v2') || "${defaultPin}";
        let IS_REMEMBERED = localStorage.getItem('cashflow_remember_device_v2') === 'true';
        let IS_UNLOCKED = sessionStorage.getItem('cashflow_session_unlocked_v2') === 'true' || (IS_REMEMBERED && localStorage.getItem('cashflow_session_unlocked_v2') === 'true');

        let transactions = JSON.parse(localStorage.getItem('local_tx_v2') || '[]');
        const DEFAULT_TEMPLATES = ${templatesJson};
        let quickTemplates = JSON.parse(localStorage.getItem('local_tpls_v2') || JSON.stringify(DEFAULT_TEMPLATES));

        let isAllTimeMode = false;

        function getLocalDateStr(d = new Date()) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return \`\${y}-\${m}-\${day}\`;
        }

        const TR_MONTHS_MAP = {
            'ocak': '01', 'oca': '01', 'subat': '02', 'şubat': '02', 'sub': '02', 'şub': '02',
            'mart': '03', 'mar': '03', 'nisan': '04', 'nis': '04', 'mayis': '05', 'mayıs': '05', 'may': '05',
            'haziran': '06', 'haz': '06', 'temmuz': '07', 'tem': '07', 'agustos': '08', 'ağustos': '08', 'agu': '08', 'ağu': '08',
            'eylul': '09', 'eylül': '09', 'eyl': '09', 'ekim': '10', 'eki': '10',
            'kasim': '11', 'kasım': '11', 'kas': '11', 'aralik': '12', 'aralık': '12', 'ara': '12'
        };

        function normalizeDateToYMD(rawDate) {
            if (rawDate === null || rawDate === undefined || rawDate === '') return getLocalDateStr();
            const currentYear = Math.max(new Date().getFullYear(), 2026);
            
            const sanitizeYMD = function(rawY, rawM, rawD) {
                let y = parseInt(rawY, 10) || currentYear;
                let m = parseInt(rawM, 10) || 1;
                let d = parseInt(rawD, 10) || 1;

                if (y < 2024 || isNaN(y)) {
                    y = currentYear;
                }

                m = Math.min(Math.max(1, m), 12);
                d = Math.min(Math.max(1, d), 31);

                return \`\${y}-\${String(m).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
            };
            
            if (rawDate instanceof Date) {
                if (!isNaN(rawDate.getTime())) {
                    return sanitizeYMD(rawDate.getFullYear(), rawDate.getMonth() + 1, rawDate.getDate());
                }
            }

            if (typeof rawDate === 'number' || (typeof rawDate === 'string' && /^\\d{4,6}(\\.\\d+)?$/.test(String(rawDate).trim()))) {
                const numVal = Number(rawDate);
                if (!isNaN(numVal) && numVal > 10000 && numVal < 90000) {
                    const dt = new Date(Math.round((numVal - 25569) * 86400 * 1000));
                    if (!isNaN(dt.getTime())) {
                        return sanitizeYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
                    }
                }
            }

            const str = String(rawDate).trim();
            if (!str) return getLocalDateStr();

            // Standalone month name
            const singleWord = str.toLowerCase().trim();
            const cleanSingleWord = singleWord.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
            if (TR_MONTHS_MAP[singleWord] || TR_MONTHS_MAP[cleanSingleWord]) {
                const mNum = TR_MONTHS_MAP[singleWord] || TR_MONTHS_MAP[cleanSingleWord];
                return \`\${currentYear}-\${mNum}-01\`;
            }

            const isoMatch = str.match(/^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})/);
            if (isoMatch) {
                return sanitizeYMD(isoMatch[1], isoMatch[2], isoMatch[3]);
            }

            const textDateMatch = str.match(/^(\\d{1,2})?[\\s./-]+([a-zA-ZçğıöşüÇĞİÖŞÜ]+)[\\s./-]+(\\d{2,4})/i);
            if (textDateMatch) {
                const day = textDateMatch[1] || '01';
                const monthWord = textDateMatch[2].toLowerCase();
                let year = textDateMatch[3];
                if (year.length === 2) year = '20' + year;
                const cleanMonth = monthWord.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
                const mNum = TR_MONTHS_MAP[monthWord] || TR_MONTHS_MAP[cleanMonth];
                if (mNum) {
                    return sanitizeYMD(year, mNum, day);
                }
            }

            const num3Match = str.match(/^(\\d{1,4})[-/.](\\d{1,2})[-/.](\\d{1,4})/);
            if (num3Match) {
                const p1 = parseInt(num3Match[1], 10);
                const p2 = parseInt(num3Match[2], 10);
                const p3 = parseInt(num3Match[3], 10);
                if (p1 >= 1000) {
                    return sanitizeYMD(p1, p2, p3);
                } else if (p3 >= 1000) {
                    if (p2 > 12 && p1 <= 12) { return sanitizeYMD(p3, p1, p2); } else { return sanitizeYMD(p3, p2, p1); }
                } else {
                    if (p1 > 12) {
                        const y2 = p3 < 100 ? (p3 < 50 ? 2000 + p3 : 1900 + p3) : p3;
                        return sanitizeYMD(y2, p2, p1);
                    } else if (p2 > 12) {
                        const y2 = p3 < 100 ? (p3 < 50 ? 2000 + p3 : 1900 + p3) : p3;
                        return sanitizeYMD(y2, p1, p2);
                    } else if (p3 === 26 || p3 === 2026) {
                        return sanitizeYMD(2026, p2, p1);
                    } else if (p1 === 26 || p1 === 2026) {
                        return sanitizeYMD(2026, p2, p3);
                    } else {
                        const y2 = p3 < 100 ? (p3 < 50 ? 2000 + p3 : 1900 + p3) : p3;
                        return sanitizeYMD(y2, p2, p1);
                    }
                }
            }

            const dayMonthMatch = str.match(/^(\\d{1,2})[-/.](\\d{1,2})$/);
            if (dayMonthMatch) {
                const part1 = parseInt(dayMonthMatch[1], 10);
                const part2 = parseInt(dayMonthMatch[2], 10);
                let day = part1;
                let month = part2;
                if (part1 <= 12 && part2 > 12) {
                    month = part1;
                    day = part2;
                }
                return sanitizeYMD(currentYear, month, day);
            }

            const ymMatch = str.match(/^(\\d{4})[-/.](\\d{1,2})$/);
            if (ymMatch) {
                return sanitizeYMD(ymMatch[1], ymMatch[2], 1);
            }

            const parsed = new Date(str);
            if (!isNaN(parsed.getTime())) {
                return sanitizeYMD(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
            }

            return str.substring(0, 10) || getLocalDateStr();
        }

        function extractMonthKey(rawDate) {
            if (!rawDate) return '';
            if (rawDate === 'all') return 'all';
            const str = String(rawDate).trim();
            if (str === 'all') return 'all';
            const ymd = normalizeDateToYMD(rawDate);
            if (ymd && ymd.length >= 7) {
                const match = ymd.match(/^(\\d{4}-\\d{2})/);
                if (match) return match[1];
                return ymd.substring(0, 7);
            }
            return '';
        }

        function isSameMonth(txDate, targetMonth) {
            if (!targetMonth || targetMonth === 'all') return true;
            if (!txDate) return false;
            const txKey = extractMonthKey(txDate);
            const targetKey = extractMonthKey(targetMonth) || targetMonth;
            if (txKey && targetKey && txKey === targetKey) return true;
            if (txKey.includes('-') && targetKey.includes('-')) {
                const [, txM] = txKey.split('-');
                const [, targetM] = targetKey.split('-');
                if (txM === targetM) {
                    return true;
                }
            }
            const normalized = normalizeDateToYMD(txDate);
            return normalized.startsWith(targetKey);
        }

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
        // UYGULAMA BAŞLANGIÇ & FİLTRE DURUMU
        // ==========================================
        let tableFilterMode = 'month_only'; // 'month_only' | 'all_time'
        let tableSelectedCat = 'all';
        let tableSearchQuery = '';
        let tableSortOrder = 'date_desc';

        const CATEGORIES = [
            'Sabit Gelir',
            'Kart Ekstresi',
            'Transfer Gideri',
            'Nakit Çekim',
            'Ek Gelir',
            'Diğer Gider'
        ];

        function initApp() {
            const now = new Date();
            const monthStr = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}\`;
            document.getElementById('selectedMonth').value = monthStr;
            document.getElementById('txDate').value = getLocalDateStr();

            document.getElementById('selectedMonth').addEventListener('change', () => {
                updateAnalysis();
                renderTable();
            });

            renderQuickTemplates();
            renderTable();
            updateAnalysis();

            if (GAS_URL) {
                document.getElementById('gasStatusBadge').innerText = 'E-Tablo Bağlı';
                document.getElementById('gasStatusBadge').className = 'text-xs px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800';
                fetchData();
            }
        }

        function renderQuickTemplates() {
            const grid = document.getElementById('quickTemplatesGrid');
            grid.innerHTML = quickTemplates.map(tpl => \`
                <button type="button" onclick='applyTemplate(\${JSON.stringify(tpl)})'
                    class="bg-zinc-800/80 hover:bg-zinc-700 active:bg-blue-600 p-2 rounded-xl border border-zinc-700/80 text-left transition flex flex-col justify-between truncate">
                    <span class="font-bold text-zinc-200 truncate block">\${tpl.title}</span>
                    <span class="text-[9px] text-zinc-400 truncate block">\${tpl.category}</span>
                </button>
            \`).join('');
        }

        function applyTemplate(tpl) {
            document.getElementById('txCategory').value = tpl.category;
            document.getElementById('txNote').value = tpl.defaultNote || tpl.title;
            if (tpl.defaultAmount) {
                document.getElementById('txAmount').value = tpl.defaultAmount;
            }
            document.getElementById('txAmount').focus();
        }

        function openTemplateManager() {
            renderTemplateList();
            document.getElementById('tplModal').classList.remove('hidden');
        }

        function closeTemplateManager() {
            document.getElementById('tplModal').classList.add('hidden');
        }

        function renderTemplateList() {
            const list = document.getElementById('tplList');
            if (!list) return;
            list.innerHTML = quickTemplates.map(tpl => \`
                <div class="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <div class="truncate pr-2">
                        <span class="font-bold text-xs text-zinc-200 block truncate">\${tpl.title}</span>
                        <span class="text-[10px] text-zinc-400 block">\${tpl.category} \${tpl.defaultAmount ? '• ' + formatTRY(tpl.defaultAmount) : ''}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button type="button" onclick="editTemplate('\${tpl.id}')" class="p-1 text-zinc-400 hover:text-blue-400 text-xs">✏️</button>
                        <button type="button" onclick="deleteTemplate('\${tpl.id}')" class="p-1 text-zinc-400 hover:text-rose-400 text-xs">🗑️</button>
                    </div>
                </div>
            \`).join('');
        }

        function editTemplate(id) {
            const tpl = quickTemplates.find(t => t.id === id);
            if (!tpl) return;
            document.getElementById('tplId').value = tpl.id;
            document.getElementById('tplTitle').value = tpl.title;
            document.getElementById('tplCategory').value = tpl.category;
            document.getElementById('tplNote').value = tpl.defaultNote || '';
            document.getElementById('tplAmount').value = tpl.defaultAmount || '';
            document.getElementById('tplFormHeading').innerText = 'Şablonu Düzenle';
        }

        function deleteTemplate(id) {
            quickTemplates = quickTemplates.filter(t => t.id !== id);
            localStorage.setItem('local_tpls_v2', JSON.stringify(quickTemplates));
            renderQuickTemplates();
            renderTemplateList();
        }

        function saveCustomTemplate(e) {
            e.preventDefault();
            const id = document.getElementById('tplId').value;
            const title = document.getElementById('tplTitle').value.trim();
            const category = document.getElementById('tplCategory').value;
            const defaultNote = document.getElementById('tplNote').value.trim();
            const defaultAmount = parseFloat(document.getElementById('tplAmount').value) || undefined;

            if (id) {
                quickTemplates = quickTemplates.map(t => t.id === id ? { id, title, category, defaultNote, defaultAmount } : t);
            } else {
                quickTemplates.push({ id: 'tpl_' + Date.now(), title, category, defaultNote, defaultAmount });
            }
            localStorage.setItem('local_tpls_v2', JSON.stringify(quickTemplates));
            renderQuickTemplates();
            renderTemplateList();
            document.getElementById('tplForm').reset();
            document.getElementById('tplId').value = '';
            document.getElementById('tplFormHeading').innerText = 'Yeni Şablon Ekle';
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
                    function getVal(obj, ...keys) {
                        for (const k of keys) {
                            if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
                        }
                        const objKeys = Object.keys(obj);
                        for (const k of keys) {
                            const found = objKeys.find(ok => ok.toLowerCase().trim() === k.toLowerCase().trim());
                            if (found && obj[found] !== undefined && obj[found] !== null && obj[found] !== '') return obj[found];
                        }
                        return '';
                    }

                    transactions = data.map((item, idx) => {
                        const rawId = getVal(item, 'ID', 'id', 'Id', 'rowId', 'RowId', 'uuid');
                        const rawDate = getVal(item, 'Tarih', 'tarih', 'Date', 'date', 'TARİH', 'islemTarihi');
                        const rawCat = getVal(item, 'Kategori', 'kategori', 'Category', 'category', 'KATEGORİ');
                        let rawAmt = getVal(item, 'Tutar', 'tutar', 'Amount', 'amount', 'TUTAR', 'Deger');
                        const rawNote = getVal(item, 'Açıklama', 'aciklama', 'açıklama', 'Note', 'note', 'AÇIKLAMA', 'Not', 'not');

                        let parsedAmt = 0;
                        if (typeof rawAmt === 'number') {
                            parsedAmt = isNaN(rawAmt) ? 0 : rawAmt;
                        } else if (typeof rawAmt === 'string') {
                            const cleaned = rawAmt.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
                            parsedAmt = parseFloat(cleaned) || 0;
                        }

                        let normCat = 'Diğer Gider';
                        const catClean = String(rawCat || '').toLowerCase();
                        if (catClean.includes('sabit') || catClean.includes('maas') || catClean.includes('maaş')) normCat = 'Sabit Gelir';
                        else if (catClean.includes('kart') || catClean.includes('ekstre') || catClean.includes('kredi')) normCat = 'Kart Ekstresi';
                        else if (catClean.includes('transfer') || catClean.includes('havale') || catClean.includes('eft') || catClean.includes('kira')) normCat = 'Transfer Gideri';
                        else if (catClean.includes('nakit') || catClean.includes('atm') || catClean.includes('cekim') || catClean.includes('çekim')) normCat = 'Nakit Çekim';
                        else if (catClean.includes('ek') || catClean.includes('prim') || catClean.includes('faiz')) normCat = 'Ek Gelir';

                        return {
                            id: String(rawId || ('ID_' + Date.now() + '_' + idx)),
                            date: normalizeDateToYMD(rawDate),
                            category: normCat,
                            amount: parsedAmt,
                            note: String(rawNote || '')
                        };
                    });
                    localStorage.setItem('local_tx_v2', JSON.stringify(transactions));
                    
                    // Auto-align selectedMonth if empty
                    const curMonthVal = document.getElementById('selectedMonth').value;
                    const hasRecords = transactions.some(t => extractMonthKey(t.date) === curMonthVal);
                    if (!hasRecords && transactions.length > 0) {
                        const allMonths = Array.from(new Set(transactions.map(t => extractMonthKey(t.date)).filter(Boolean))).sort().reverse();
                        if (allMonths.length > 0) {
                            document.getElementById('selectedMonth').value = allMonths[0];
                        }
                    }

                    renderTable();
                    updateAnalysis();
                }
            } catch(e) {
                tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-rose-400">Veri çekilemedi. Apps Script URL veya internet bağlantısını kontrol edin.</td></tr>';
            }
        }

        // Form Submit
        document.getElementById('txForm').onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('txId').value;
            const date = document.getElementById('txDate').value;
            const category = document.getElementById('txCategory').value;
            const amount = parseFloat(document.getElementById('txAmount').value) || 0;
            const note = document.getElementById('txNote').value;

            const btn = document.getElementById('submitBtn');
            const spinner = document.getElementById('btnSpinner');
            const btnText = document.getElementById('btnText');
            btn.disabled = true;
            spinner.classList.remove('hidden');

            const newTx = {
                id: id || ('ID_' + Date.now()),
                date: date,
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

            if (tableFilterMode === 'month_only') {
                const newMonthKey = extractMonthKey(date);
                if (newMonthKey) {
                    document.getElementById('selectedMonth').value = newMonthKey;
                }
            }

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
            document.getElementById('txDate').value = tx.date;
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

        async function duplicateTx(id) {
            const item = transactions.find(t => t.id === id);
            if (!item) return;
            const duplicated = {
                id: 'ID_' + Date.now(),
                date: item.date,
                category: item.category,
                amount: item.amount,
                note: item.note ? item.note + ' (Kopya)' : 'Kopya'
            };
            transactions.unshift(duplicated);
            localStorage.setItem('local_tx_v2', JSON.stringify(transactions));
            renderTable();
            updateAnalysis();

            if (GAS_URL) {
                try {
                    await fetch(GAS_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'insert',
                            ...duplicated,
                            pin: STORED_PIN || undefined
                        })
                    });
                } catch(err) {
                    console.error('GAS Duplicate Error:', err);
                }
            }
        }

        // ==========================================
        // GELİŞMİŞ FİLTRELEME & TABLO GÖRÜNÜMÜ
        // ==========================================
        function setTableFilterMode(mode) {
            tableFilterMode = mode;
            const btnMonth = document.getElementById('tableFilterBtnMonth');
            const btnAll = document.getElementById('tableFilterBtnAll');
            if (btnMonth && btnAll) {
                if (mode === 'month_only') {
                    btnMonth.className = 'px-2.5 py-1 rounded-md font-bold uppercase text-[10px] tracking-wider transition bg-zinc-800 text-blue-400';
                    btnAll.className = 'px-2.5 py-1 rounded-md font-bold uppercase text-[10px] tracking-wider transition text-zinc-500 hover:text-zinc-300';
                } else {
                    btnMonth.className = 'px-2.5 py-1 rounded-md font-bold uppercase text-[10px] tracking-wider transition text-zinc-500 hover:text-zinc-300';
                    btnAll.className = 'px-2.5 py-1 rounded-md font-bold uppercase text-[10px] tracking-wider transition bg-zinc-800 text-blue-400';
                }
            }
            renderTable();
        }

        function setTableCategory(cat) {
            tableSelectedCat = cat;
            renderTable();
        }

        function handleSearchInput(val) {
            tableSearchQuery = val || '';
            renderTable();
        }

        function handleSortChange(val) {
            tableSortOrder = val || 'date_desc';
            renderTable();
        }

        function getScopedTransactions() {
            const currentMonth = document.getElementById('selectedMonth').value;
            return transactions.filter(t => {
                if (tableFilterMode === 'month_only' && currentMonth) {
                    return isSameMonth(t.date, currentMonth);
                }
                return true;
            });
        }

        function renderCategoryChips(scopedList) {
            const bar = document.getElementById('categoryChipsBar');
            if (!bar) return;

            let html = \`
                <button type="button" onclick="setTableCategory('all')"
                    class="px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition whitespace-nowrap \${tableSelectedCat === 'all' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}">
                    Hepsi (\${scopedList.length})
                </button>
            \`;

            CATEGORIES.forEach(cat => {
                const count = scopedList.filter(t => t.category === cat).length;
                const isSelected = tableSelectedCat === cat;
                html += \`
                    <button type="button" onclick="setTableCategory('\${cat}')"
                        class="px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition whitespace-nowrap \${isSelected ? 'bg-zinc-800 text-blue-400 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'}">
                        \${cat} (\${count})
                    </button>
                \`;
            });

            bar.innerHTML = html;
        }

        function renderTable() {
            const tbody = document.getElementById('tableBody');
            const currentMonth = document.getElementById('selectedMonth').value;
            const subtitleEl = document.getElementById('tablePeriodSubtitle');

            if (subtitleEl) {
                if (tableFilterMode === 'month_only' && currentMonth) {
                    subtitleEl.innerText = \`\${currentMonth} DÖNEMİ İŞLEM HAREKETLERİ\`;
                } else {
                    subtitleEl.innerText = 'TÜM KAYIT GEÇMİŞİ';
                }
            }

            const scoped = getScopedTransactions();
            renderCategoryChips(scoped);

            let filtered = scoped.filter(t => {
                // Category filter
                if (tableSelectedCat !== 'all' && t.category !== tableSelectedCat) {
                    return false;
                }

                // Search term
                if (tableSearchQuery.trim()) {
                    const q = tableSearchQuery.toLowerCase();
                    const matchNote = (t.note || '').toLowerCase().includes(q);
                    const matchCat = (t.category || '').toLowerCase().includes(q);
                    const matchAmount = (t.amount || '').toString().includes(q);
                    const matchDate = (t.date || '').includes(q);
                    if (!matchNote && !matchCat && !matchAmount && !matchDate) return false;
                }

                return true;
            });

            filtered.sort((a, b) => {
                if (tableSortOrder === 'date_desc') return new Date(b.date) - new Date(a.date);
                if (tableSortOrder === 'date_asc') return new Date(a.date) - new Date(b.date);
                if (tableSortOrder === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
                return 0;
            });

            const badge = document.getElementById('txCountBadge');
            if (badge) {
                badge.innerText = \`\${filtered.length} / \${scoped.length} Kayıt\`;
            }

            if (filtered.length === 0) {
                tbody.innerHTML = \`
                    <tr>
                        <td colspan="5" class="p-12 text-center text-zinc-500">
                            <div class="flex flex-col items-center justify-center space-y-2">
                                <div class="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 text-sm mb-1">🔍</div>
                                <p class="text-xs font-bold text-zinc-300 uppercase tracking-wider">Kayıt Bulunamadı</p>
                                <p class="text-[11px] text-zinc-500 font-mono">
                                    \${tableSearchQuery ? 'Arama kriterlerinize uygun hareket yok.' : 'Bu dönem veya kategori için henüz işlem girişi yapılmadı.'}
                                </p>
                            </div>
                        </td>
                    </tr>
                \`;
                return;
            }

            tbody.innerHTML = filtered.map(item => {
                const isIncome = item.category === 'Sabit Gelir' || item.category === 'Ek Gelir';
                let catBadge = 'bg-zinc-800 text-zinc-300 border border-zinc-700';
                if (item.category === 'Sabit Gelir') catBadge = 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/30 text-[10px] font-bold uppercase';
                else if (item.category === 'Ek Gelir') catBadge = 'bg-teal-900/20 text-teal-400 border border-teal-900/30 text-[10px] font-bold uppercase';
                else if (item.category === 'Kart Ekstresi') catBadge = 'bg-rose-900/20 text-rose-400 border border-rose-900/30 text-[10px] font-bold uppercase';
                else if (item.category === 'Transfer Gideri') catBadge = 'bg-amber-900/20 text-amber-400 border border-amber-900/30 text-[10px] font-bold uppercase';
                else if (item.category === 'Nakit Çekim') catBadge = 'bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold uppercase';
                else catBadge = 'bg-purple-900/20 text-purple-400 border border-purple-900/30 text-[10px] font-bold uppercase';

                const safeItem = JSON.stringify(item).replace(/"/g, '&quot;');

                return \`
                    <tr class="hover:bg-zinc-800/30 transition-colors group">
                        <td class="p-3.5 sm:p-4 font-mono text-zinc-400 text-xs">\${item.date}</td>
                        <td class="p-3.5 sm:p-4"><span class="px-2 py-0.5 rounded-md \${catBadge}">\${item.category}</span></td>
                        <td class="p-3.5 sm:p-4 text-zinc-300 font-medium text-xs">\${item.note || '-'}</td>
                        <td class="p-3.5 sm:p-4 text-right font-mono font-bold text-xs \${isIncome ? 'text-emerald-400' : 'text-zinc-200'}">
                            \${isIncome ? '+' : '-'}\${formatTRY(item.amount)}
                        </td>
                        <td class="p-3.5 sm:p-4 text-center">
                            <div class="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                                <button onclick="editTx(\${safeItem})" class="text-zinc-400 hover:text-blue-400 p-1 rounded hover:bg-zinc-800 transition" title="Düzenle">✏️</button>
                                <button onclick="duplicateTx('\${item.id}')" class="text-zinc-400 hover:text-emerald-400 p-1 rounded hover:bg-zinc-800 transition" title="Kopyala">📋</button>
                                <button onclick="deleteTx('\${item.id}')" class="text-zinc-400 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition" title="Sil">🗑️</button>
                            </div>
                        </td>
                    </tr>
                \`;
            }).join('');
        }

        function toggleAllTime() {
            isAllTimeMode = !isAllTimeMode;
            const btn = document.getElementById('allTimeBtn');
            const input = document.getElementById('selectedMonth');
            if (isAllTimeMode) {
                btn.className = 'text-[10px] uppercase font-bold px-2.5 py-1 bg-blue-600 text-white rounded-lg border border-blue-500 shadow transition';
                input.disabled = true;
                input.classList.add('opacity-40');
                setTableFilterMode('all_time');
            } else {
                btn.className = 'text-[10px] uppercase font-bold px-2.5 py-1 bg-zinc-900 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition';
                input.disabled = false;
                input.classList.remove('opacity-40');
                setTableFilterMode('month_only');
            }
            updateAnalysis();
        }

        function updateAnalysis() {
            const month = document.getElementById('selectedMonth').value;
            let income = 0, card = 0, transfer = 0, cash = 0, other = 0;

            transactions.forEach(t => {
                if (isAllTimeMode || isSameMonth(t.date, month)) {
                    const amt = parseFloat(t.amount) || 0;
                    if (t.category === 'Sabit Gelir' || t.category === 'Ek Gelir') {
                        income += amt;
                    } else if (t.category === 'Kart Ekstresi') {
                        card += amt;
                    } else if (t.category === 'Transfer Gideri') {
                        transfer += amt;
                    } else if (t.category === 'Nakit Çekim') {
                        cash += amt;
                    } else {
                        other += amt;
                    }
                }
            });

            const totalExpense = card + transfer + cash + other;
            const net = income - totalExpense;

            document.getElementById('metricIncome').innerText = formatTRY(income);
            document.getElementById('metricExpense').innerText = formatTRY(totalExpense);
            
            const netEl = document.getElementById('metricNet');
            netEl.innerText = formatTRY(net);
            
            const adviceCard = document.getElementById('adviceCard');
            const adviceTitle = document.getElementById('adviceTitle');
            const adviceDesc = document.getElementById('adviceDesc');

            if (income === 0 && totalExpense === 0) {
                netEl.className = 'text-lg font-bold font-mono text-zinc-400';
                adviceCard.className = 'p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 text-xs space-y-1';
                adviceTitle.innerHTML = '<span>ℹ️</span> <span>Kayıt Yok</span>';
                adviceDesc.innerText = isAllTimeMode ? 'Sistemde henüz kayıtlı gelir veya harcama yok.' : 'Seçilen ay için henüz gelir veya harcama girilmedi.';
            } else if (net >= 0) {
                netEl.className = 'text-lg font-bold font-mono text-emerald-400';
                adviceCard.className = 'p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/30 text-xs space-y-1';
                adviceTitle.innerHTML = isAllTimeMode ? '<span class="text-emerald-400">✅ KÜMÜLATİF ARTI BAKİYE</span>' : '<span class="text-emerald-400">✅ GELİRDEN KARŞILANDI</span>';
                adviceDesc.innerText = isAllTimeMode
                    ? \`Başlangıçtan bu yana tüm harcamalarınız gelirlerinizden karşılandı. Kümülatif net birikiminiz: \${formatTRY(net)}.\`
                    : \`Tüm harcamalarınız gelirden karşılandı. Kalan \${formatTRY(net)} tutarını birikim fonunuza aktarabilirsiniz.\`;
            } else {
                netEl.className = 'text-lg font-bold font-mono text-rose-400';
                adviceCard.className = 'p-4 rounded-xl border border-rose-900/60 bg-rose-950/30 text-xs space-y-1';
                adviceTitle.innerHTML = isAllTimeMode ? '<span class="text-rose-400">⚠️ KÜMÜLATİF NET AÇIK</span>' : '<span class="text-rose-400">⚠️ BİRİKİMDEN HARCANDI</span>';
                adviceDesc.innerText = isAllTimeMode
                    ? \`Başlangıçtan bu yana toplam harcamalarınız gelirlerinizi aştı. Toplam kümülatif açık: \${formatTRY(Math.abs(net))}.\`
                    : \`Aylık gelir harcamaları karşılamadı. Açığı kapatmak için birikimden \${formatTRY(Math.abs(net))} harcama yapıldı.\`;
            }

            const bar = document.getElementById('distributionBar');
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
                document.getElementById('expenseBreakdownText').innerText = \`Kart: %\${cardPct} | Transfer: %\${transPct} | Nakit: %\${cashPct}\`;
            } else {
                bar.innerHTML = '<div class="w-full bg-zinc-800 h-full"></div>';
                document.getElementById('expenseBreakdownText').innerText = 'Harcama yok';
            }
        }

        // Run lock check on load
        window.addEventListener('DOMContentLoaded', checkInitialLock);
    </script>
</body>
</html>`;
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
