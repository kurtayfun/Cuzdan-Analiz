import React from 'react';
import { 
  FileCode, 
  Download, 
  RefreshCw, 
  Settings,
  Layers,
  TrendingUp,
  Calendar,
  Database
} from 'lucide-react';
import { GasConfig, ViewMode } from '../types';

interface NavbarProps {
  gasConfig: GasConfig;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  onSync: () => void;
  isSyncing: boolean;
  onOpenGasModal: () => void;
  onExportHtml: () => void;
  onExportCsv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  gasConfig,
  activeView,
  setActiveView,
  selectedMonth,
  setSelectedMonth,
  onSync,
  isSyncing,
  onOpenGasModal,
  onExportHtml,
  onExportCsv,
}) => {
  // Navigation helpers for month
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonthStr);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  // Format month name in Turkish
  const [year, monthNum] = selectedMonth.split('-').map(Number);
  const monthDate = new Date(year, monthNum - 1, 1);
  const formattedMonth = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

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
          <div className="flex items-center gap-2 md:hidden">
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

        {/* Center: Technical Month Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2 py-1.5 rounded-xl">
          <button
            onClick={handlePrevMonth}
            className="w-7 h-7 flex items-center justify-center text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            title="Önceki Ay"
          >
            ‹
          </button>
          <div className="flex items-center gap-2 px-2 text-xs font-mono font-bold text-zinc-200 uppercase tracking-tight min-w-[130px] justify-center">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>{formattedMonth}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="w-7 h-7 flex items-center justify-center text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            title="Sonraki Ay"
          >
            ›
          </button>
          <button
            onClick={handleCurrentMonth}
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition ml-1 border border-zinc-700"
          >
            Bu Ay
          </button>
        </div>

        {/* Right: Technical Minimalist Actions & Connection Status */}
        <div className="hidden md:flex items-center gap-4">
          {/* Technical Status Indicator */}
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Bağlantı Durumu</p>
            <p className="text-xs font-mono flex items-center gap-1.5 justify-end">
              <span className={`w-2 h-2 rounded-full ${gasConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className={gasConfig.isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                {gasConfig.isConnected ? 'Google Cloud API Active' : 'Local Storage Mode'}
              </span>
            </p>
          </div>

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
            <span className="hidden lg:inline">Code.gs & Ayarlar</span>
          </button>

          {/* Download index.html Button */}
          <button
            onClick={onExportHtml}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20 flex items-center gap-1.5"
            title="GitHub Pages için tek dosya index.html indir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>index.html İndir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
