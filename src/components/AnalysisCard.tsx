import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  PiggyBank
} from 'lucide-react';
import { MonthlySummary } from '../types';
import { formatCurrencyTRY } from '../services/exportService';

interface AnalysisCardProps {
  summary: MonthlySummary;
  selectedMonth: string;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ summary, selectedMonth }) => {
  const {
    totalIncome,
    totalExpense,
    cardExpense,
    transferExpense,
    cashExpense,
    otherExpense,
    netBalance,
    savingsRate,
    status,
  } = summary;

  // Formatting date for title
  const [year, monthNum] = selectedMonth.split('-').map(Number);
  const monthDate = new Date(year, monthNum - 1, 1);
  const monthName = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  // Calculate percentages of total expenses
  const cardPct = totalExpense > 0 ? (cardExpense / totalExpense) * 100 : 0;
  const transferPct = totalExpense > 0 ? (transferExpense / totalExpense) * 100 : 0;
  const cashPct = totalExpense > 0 ? (cashExpense / totalExpense) * 100 : 0;
  const otherPct = totalExpense > 0 ? (otherExpense / totalExpense) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 3 Core Metric Cards - Exact Technical Minimalist Pattern */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Toplam Gelir */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-wider">Toplam Gelir</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono tracking-tighter">
            +{formatCurrencyTRY(totalIncome)}
          </p>
          <p className="text-[10px] text-zinc-600 font-mono mt-1">Maaş & Ek Gelir</p>
        </div>

        {/* Toplam Gider */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-wider">Toplam Gider</p>
          <p className="text-2xl font-bold text-rose-400 font-mono tracking-tighter">
            -{formatCurrencyTRY(totalExpense)}
          </p>
          <p className="text-[10px] text-zinc-600 font-mono mt-1">Kart + Kira + Nakit</p>
        </div>

        {/* Net Tasarruf / Bakiye */}
        <div className={`p-5 rounded-2xl border shadow-lg transition-colors ${
          status === 'surplus'
            ? 'bg-emerald-950/20 border-emerald-900/50'
            : status === 'deficit'
            ? 'bg-rose-950/20 border-rose-900/50'
            : 'bg-zinc-900 border-zinc-800'
        }`}>
          <p className={`text-[10px] uppercase font-bold mb-1 tracking-wider ${
            status === 'surplus' ? 'text-emerald-500' : status === 'deficit' ? 'text-rose-500' : 'text-zinc-500'
          }`}>
            {status === 'surplus' ? 'Net Tasarruf' : status === 'deficit' ? 'Net Bütçe Açığı' : 'Net Bakiye'}
          </p>
          <p className={`text-2xl font-bold font-mono tracking-tighter ${
            status === 'surplus' ? 'text-emerald-500' : status === 'deficit' ? 'text-rose-400' : 'text-zinc-300'
          }`}>
            {netBalance >= 0 ? '+' : ''}{formatCurrencyTRY(netBalance)}
          </p>
          <p className="text-[10px] text-zinc-500 font-mono mt-1">
            {totalIncome > 0 ? `Tasarruf Oranı: %${savingsRate.toFixed(1)}` : 'Dönem Sonu Durumu'}
          </p>
        </div>
      </section>

      {/* Detailed Technical Status & Advice Card */}
      <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              {monthName} Dönemsel Konsolidasyon
            </h3>
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">
              DÖNEM: {selectedMonth} • CASH BASIS NAKİT DENGESİ
            </p>
          </div>

          <div className="flex items-center gap-2">
            {status === 'surplus' && (
              <span className="bg-emerald-900/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-900/40 text-[10px] font-bold uppercase tracking-wider font-mono">
                ● GELİRDEN KARŞILANDI
              </span>
            )}
            {status === 'deficit' && (
              <span className="bg-rose-900/20 text-rose-400 px-3 py-1 rounded-full border border-rose-900/40 text-[10px] font-bold uppercase tracking-wider font-mono animate-pulse">
                ▲ BİRİKİMDEN HARCANDI
              </span>
            )}
            {status === 'empty' && (
              <span className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full border border-zinc-700 text-[10px] font-bold uppercase tracking-wider font-mono">
                ● VERİ BEKLENİYOR
              </span>
            )}
            {status === 'balanced' && (
              <span className="bg-blue-900/20 text-blue-400 px-3 py-1 rounded-full border border-blue-900/40 text-[10px] font-bold uppercase tracking-wider font-mono">
                ● DENGEDE
              </span>
            )}
          </div>
        </div>

        {/* Narrative Status Box */}
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
          status === 'surplus'
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
            : status === 'deficit'
            ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
            : 'bg-zinc-950/40 border-zinc-800 text-zinc-400'
        }`}>
          {status === 'surplus' && (
            <p>
              Tüm harcamalar mevcut ay gelirinden karşılandı. Kalan <strong className="font-mono text-emerald-400">{formatCurrencyTRY(netBalance)}</strong> tutarındaki artı bakiye birikim ve yatırım portföyünüze eklenebilir.
            </p>
          )}
          {status === 'deficit' && (
            <p>
              Aylık nakit çıkışları geliri aştı. Oluşan <strong className="font-mono text-rose-400">{formatCurrencyTRY(Math.abs(netBalance))}</strong> tutarındaki açık geçmiş birikimlerinizden finanse edilmiştir.
            </p>
          )}
          {status === 'empty' && (
            <p>
              {selectedMonth} dönemi için henüz kayıt girilmedi. Sol taraftaki işlem formundan harcama ve gelir ekleyebilirsiniz.
            </p>
          )}
          {status === 'balanced' && (
            <p>
              Gelir ve harcamalar tam olarak eşit seviyede gerçekleşti.
            </p>
          )}
        </div>

        {/* Harcama Dağılım Çubuğu */}
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <span>Harcama Bileşenleri Dağılımı</span>
            <span className="font-mono text-zinc-400">Toplam: {formatCurrencyTRY(totalExpense)}</span>
          </div>

          <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
            {totalExpense > 0 ? (
              <>
                {cardPct > 0 && (
                  <div
                    style={{ width: `${cardPct}%` }}
                    className="bg-rose-500 h-full transition-all duration-300"
                    title={`Kart Ekstresi: %${cardPct.toFixed(1)}`}
                  />
                )}
                {transferPct > 0 && (
                  <div
                    style={{ width: `${transferPct}%` }}
                    className="bg-blue-500 h-full transition-all duration-300"
                    title={`Transfer: %${transferPct.toFixed(1)}`}
                  />
                )}
                {cashPct > 0 && (
                  <div
                    style={{ width: `${cashPct}%` }}
                    className="bg-amber-500 h-full transition-all duration-300"
                    title={`Nakit Çekim: %${cashPct.toFixed(1)}`}
                  />
                )}
                {otherPct > 0 && (
                  <div
                    style={{ width: `${otherPct}%` }}
                    className="bg-purple-500 h-full transition-all duration-300"
                    title={`Diğer: %${otherPct.toFixed(1)}`}
                  />
                )}
              </>
            ) : (
              <div className="w-full bg-zinc-800 h-full" />
            )}
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
            <div className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Kart Ekstresi</span>
              </div>
              <p className="text-xs font-bold text-zinc-200 mt-1">{formatCurrencyTRY(cardExpense)}</p>
              <p className="text-[9px] text-zinc-600">%{cardPct.toFixed(0)}</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Transfer / Kira</span>
              </div>
              <p className="text-xs font-bold text-zinc-200 mt-1">{formatCurrencyTRY(transferExpense)}</p>
              <p className="text-[9px] text-zinc-600">%{transferPct.toFixed(0)}</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Nakit ATM</span>
              </div>
              <p className="text-xs font-bold text-zinc-200 mt-1">{formatCurrencyTRY(cashExpense)}</p>
              <p className="text-[9px] text-zinc-600">%{cashPct.toFixed(0)}</p>
            </div>

            <div className="bg-zinc-950 border border-zinc-800/80 p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                <span>Diğer Çıkış</span>
              </div>
              <p className="text-xs font-bold text-zinc-200 mt-1">{formatCurrencyTRY(otherExpense)}</p>
              <p className="text-[9px] text-zinc-600">%{otherPct.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
