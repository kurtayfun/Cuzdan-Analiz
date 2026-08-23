import React from 'react';
import { 
  FileCode, 
  Download, 
  RefreshCw, 
  Settings,
  Layers,
  TrendingUp,
  Calendar,
  Database,
  Globe,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Lock
} from 'lucide-react';
import { GasConfig, ViewMode, Transaction } from '../types';
import { extractMonthKey } from '../services/gasService';

interface NavbarProps {
  gasConfig: GasConfig;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  transactions?: Transaction[];
  onSync: () => void;
  isSyncing: boolean;
  onOpenGasModal: () => void;
  onOpenSecurityModal: () => void;
  onOpenPwaModal: () => void;
  isPinEnabled: boolean;
  onExportHtml: () => void;
  onExportCsv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  gasConfig,
  activeView,
  setActiveView,
  selectedMonth,
  setSelectedMonth,
  transactions = [],
  onSync,
  isSyncing,
  onOpenGasModal,
  onOpenSecurityModal,
  onOpenPwaModal,
  isPinEnabled,
  onExportHtml,
  onExportCsv,
}) => {
  const isAllTime = selectedMonth === 'all';
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Extract available months from transactions
  const availableMonthsWithCount = React.useMemo(() => {
    const monthCounts = new Map<string, number>();
    transactions.forEach((t) => {
      const m = extractMonthKey(t.date);
      if (m && m !== 'all') {
        monthCounts.set(m, (monthCounts.get(m) || 0) + 1);
      }
    });

    const monthSet = new Set<string>(monthCounts.keys());

    // If currently selected month is a valid specific month, include it
    if (selectedMonth && selectedMonth !== 'all') {
      monthSet.add(selectedMonth);
    }

    // If no transactions exist at all, at least provide current month
    if (monthSet.size === 0) {
      monthSet.add(currentMonthStr);
    }

    const sortedMonths = Array.from(monthSet).sort().reverse();
    return sortedMonths.map((m) => ({
      key: m,
      count: monthCounts.get(m) || 0,
    }));
  }, [transactions, selectedMonth, currentMonthStr]);

  // Navigation helpers for month (cycles through available data or steps chronologically)
  const handlePrevMonth = () => {
    if (selectedMonth === 'all') {
      const latest = availableMonthsWithCount[0]?.key || currentMonthStr;
      setSelectedMonth(latest);
      return;
    }

    const keys = availableMonthsWithCount.map((item) => item.key);
    const currentIndex = keys.indexOf(selectedMonth);
    if (currentIndex !== -1 && currentIndex + 1 < keys.length) {
      setSelectedMonth(keys[currentIndex + 1]);
      return;
    }

    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, (m || 1) - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevMonthStr);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'all') {
      const latest = availableMonthsWithCount[0]?.key || currentMonthStr;
      setSelectedMonth(latest);
      return;
    }

    const keys = availableMonthsWithCount.map((item) => item.key);
    const currentIndex = keys.indexOf(selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(keys[currentIndex - 1]);
      return;
    }

    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m || 1, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonthStr);
  };

  const handleCurrentMonth = () => {
    // If currentMonthStr has records, pick it. Otherwise pick the latest month with records.
    const hasCurrentRecords = transactions.some((t) => extractMonthKey(t.date) === currentMonthStr);
    if (hasCurrentRecords || transactions.length === 0) {
      setSelectedMonth(currentMonthStr);
      return;
    }
    const latestWithData = availableMonthsWithCount.find((item) => item.count > 0)?.key;
    setSelectedMonth(latestWithData || currentMonthStr);
  };

  const handleToggleAllTime = () => {
    if (selectedMonth === 'all') {
      const latestWithData = availableMonthsWithCount.find((item) => item.count > 0)?.key || currentMonthStr;
      setSelectedMonth(latestWithData);
    } else {
      setSelectedMonth('all');
    }
  };

  // Format month name in Turkish
  let formattedMonth = 'Tüm Zamanlar';
  if (!isAllTime) {
    const [year, monthNum] = selectedMonth.split('-').map(Number);
    const monthDate = new Date(year, (monthNum || 1) - 1, 1);
    formattedMonth = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  }

  return (
    <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-800 px-4 sm:px-8 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & System Title */}
        <div className="flex items-center justify-between w-full md:w-auto gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter text-white uppercase">
              CÜZDAN <span className="text-blue-500">ANALİZ</span>
            </h1>
            <p className="text-zinc-500 text-[11px] sm:text-xs font-medium uppercase tracking-widest">
              Nakit Akışı ve Birikim Takip Sistemi v2.1
            </p>
          </div>

          {/* Mobile Quick Action */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onOpenPwaModal}
              className="bg-zinc-900 hover:bg-zinc-800 text-blue-400 p-2 rounded-lg border border-zinc-800 transition-all"
              title="Telefona Yükle (PWA)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenSecurityModal}
              className={`p-2 rounded-lg border transition-all ${
                isPinEnabled 
                  ? 'bg-blue-950/40 text-blue-400 border-blue-800/60' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
              title="Güvenlik ve PIN Ayarları"
            >
              {isPinEnabled ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
            </button>
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-lg border border-zinc-700 transition-all"
              title="Senkronize Et"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
              onClick={onOpenGasModal}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-lg border border-zinc-700 transition-all"
              title="Ayarlar & Code.gs"
            >
              <Settings className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        </div>

        {/* Center: Technical Month Selector with Tümü Option */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2 py-1.5 rounded-xl">
          <button
            onClick={handlePrevMonth}
            className="w-7 h-7 flex items-center justify-center text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            title="Önceki Ay"
          >
            ‹
          </button>
          
            {/* Direct Month Dropdown Selector */}
            <div className="relative flex items-center">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-zinc-950/80 hover:bg-zinc-800/80 text-zinc-200 border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-tight outline-none focus:border-blue-500 transition cursor-pointer pr-7 text-center min-w-[170px]"
                title="Dönem / Ay Seçin"
              >
                <option value="all" className="bg-zinc-900 text-blue-400 font-bold">
                  🌐 TÜM ZAMANLAR ({transactions.length})
                </option>
                {availableMonthsWithCount.map(({ key: m, count }) => {
                  const [y, mn] = m.split('-').map(Number);
                  const mDate = new Date(y, (mn || 1) - 1, 1);
                  const name = mDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                  return (
                    <option key={m} value={m} className="bg-zinc-900 text-zinc-100">
                      📅 {name.toUpperCase()} ({count})
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute right-2 text-[10px] text-zinc-400">
                ▼
              </div>
            </div>

          <button
            onClick={handleNextMonth}
            className="w-7 h-7 flex items-center justify-center text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            title="Sonraki Ay"
          >
            ›
          </button>
          
          <div className="h-4 w-px bg-zinc-800 mx-1"></div>

          {/* Bu Ay Button */}
          <button
            onClick={handleCurrentMonth}
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition border ${
              !isAllTime && selectedMonth === currentMonthStr
                ? 'bg-blue-600/30 text-blue-400 border-blue-500/50'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
            title="Mevcut Aya Git"
          >
            Bu Ay
          </button>

          {/* Tümü (All Time) Button */}
          <button
            onClick={handleToggleAllTime}
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition border flex items-center gap-1 ${
              isAllTime
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
            title="Başlangıçtan bu yana tüm gelir-gider dengesini göster"
          >
            <Globe className="w-3 h-3" />
            <span>Tümü</span>
          </button>
        </div>

        {/* Right: Technical Minimalist Actions & Connection Status */}
        <div className="hidden md:flex items-center gap-3">
          {/* Security Button */}
          <button
            onClick={onOpenSecurityModal}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
              isPinEnabled
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
            }`}
            title="Güvenlik ve PIN Ayarları"
          >
            {isPinEnabled ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">PIN Aktif</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-zinc-400" />
                <span className="text-[11px] text-zinc-400">Güvenlik</span>
              </>
            )}
          </button>

          {/* PWA Mobile Install Button */}
          <button
            onClick={onOpenPwaModal}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 p-2.5 rounded-xl border border-zinc-800 transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
            title="Telefonunuza Uygulama Olarak Yükleyin"
          >
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span className="text-[11px]">Telefona Yükle</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Panel</span>
            </button>
            <button
              onClick={() => setActiveView('trends')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeView === 'trends'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trendler</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2.5 rounded-lg border border-zinc-700 transition-all disabled:opacity-50"
            title="Google E-Tablolardan Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Setup / Settings Button */}
          <button
            onClick={onOpenGasModal}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2.5 rounded-lg border border-zinc-700 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            title="Google Apps Script ve Ayarlar"
          >
            <Settings className="w-4 h-4 text-blue-500" />
            <span className="hidden xl:inline">Code.gs</span>
          </button>

          {/* Download index.html Button */}
          <button
            onClick={onExportHtml}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20 flex items-center gap-1.5"
            title="GitHub Pages için tek dosya index.html indir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>index.html</span>
          </button>
        </div>
      </div>
    </header>
  );
};

