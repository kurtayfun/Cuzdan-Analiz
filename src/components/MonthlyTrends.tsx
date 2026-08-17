import React, { useMemo } from 'react';
import { 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrencyTRY } from '../services/exportService';

interface MonthlyTrendsProps {
  transactions: Transaction[];
  onSelectMonth: (month: string) => void;
}

export const MonthlyTrends: React.FC<MonthlyTrendsProps> = ({ transactions, onSelectMonth }) => {
  // Group transactions by month (YYYY-MM)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const month = tx.date.substring(0, 7);
      const current = map.get(month) || { income: 0, expense: 0, count: 0 };
      const isIncome = tx.category === 'Sabit Gelir' || tx.category === 'Ek Gelir';

      if (isIncome) {
        current.income += tx.amount;
      } else {
        current.expense += tx.amount;
      }
      current.count += 1;
      map.set(month, current);
    });

    const list = Array.from(map.entries()).map(([month, data]) => {
      const net = data.income - data.expense;
      const savingsRate = data.income > 0 ? ((data.income - data.expense) / data.income) * 100 : 0;
      return {
        month,
        income: data.income,
        expense: data.expense,
        net,
        savingsRate,
        count: data.count,
      };
    });

    return list.sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions]);

  // Max value for bar scaling
  const maxAmount = useMemo(() => {
    let max = 1;
    monthlyData.forEach((d) => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    return max;
  }, [monthlyData]);

  // Cumulative calculations
  const cumulativeSavings = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.net, 0);
  }, [monthlyData]);

  const totalIncomeAll = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.income, 0);
  }, [monthlyData]);

  const totalExpenseAll = useMemo(() => {
    return monthlyData.reduce((acc, curr) => acc + curr.expense, 0);
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* 3 Overview Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cumulative Savings */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-wider">Kümülatif Net Birikim</p>
          <p className={`text-2xl font-bold font-mono tracking-tighter ${
            cumulativeSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {cumulativeSavings >= 0 ? '+' : ''}{formatCurrencyTRY(cumulativeSavings)}
          </p>
          <p className="text-[10px] text-zinc-600 font-mono mt-1">Kayıtlı Tüm Ayların Net Toplamı</p>
        </div>

        {/* Total Income */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-wider">Genel Toplam Gelir</p>
          <p className="text-2xl font-bold text-emerald-400 font-mono tracking-tighter">
            +{formatCurrencyTRY(totalIncomeAll)}
          </p>
          <p className="text-[10px] text-zinc-600 font-mono mt-1">{monthlyData.length} Farklı Ay Kaydedildi</p>
        </div>

        {/* Total Expense */}
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-lg">
          <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-wider">Genel Toplam Çıkış</p>
          <p className="text-2xl font-bold text-rose-400 font-mono tracking-tighter">
            -{formatCurrencyTRY(totalExpenseAll)}
          </p>
          <p className="text-[10px] text-zinc-600 font-mono mt-1">Tüm Çıkışlar (Cash Basis)</p>
        </div>
      </section>

      {/* Monthly Bar Chart Comparison */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
          <div>
            <h3 className="font-bold text-sm text-zinc-200 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Aylara Göre Nakit Akışı & Birikim Trendi
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest mt-0.5">
              GELİR, GİDER VE NET TASARRUF ORANLARININ AYLIK DEĞİŞİMİ
            </p>
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase font-mono text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Gelir
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Gider
            </div>
          </div>
        </div>

        {/* Month Rows */}
        <div className="space-y-3">
          {monthlyData.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">
              HENÜZ TREND OLUŞTURACAK KAYIT BULUNMUYOR.
            </div>
          ) : (
            monthlyData.map((d) => {
              const [y, m] = d.month.split('-').map(Number);
              const dateObj = new Date(y, m - 1, 1);
              const label = dateObj.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
              const incomeWidth = (d.income / maxAmount) * 100;
              const expenseWidth = (d.expense / maxAmount) * 100;

              return (
                <div
                  key={d.month}
                  onClick={() => onSelectMonth(d.month)}
                  className="bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-800 hover:border-blue-500/50 p-4 rounded-xl space-y-3 cursor-pointer transition group"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition" />
                      <span className="font-bold text-xs text-zinc-200 capitalize font-sans">
                        {label}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        [{d.count} İŞLEM]
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-zinc-400">
                        Net:{' '}
                        <strong className={d.net >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {d.net >= 0 ? '+' : ''}{formatCurrencyTRY(d.net)}
                        </strong>
                      </span>
                      {d.income > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.savingsRate >= 20 
                            ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/40' 
                            : d.savingsRate > 0 
                            ? 'bg-amber-900/20 text-amber-400 border border-amber-900/40' 
                            : 'bg-rose-900/20 text-rose-400 border border-rose-900/40'
                        }`}>
                          %{d.savingsRate.toFixed(1)} BİRİKİM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual Bar Graphic */}
                  <div className="space-y-1.5">
                    {/* Gelir bar */}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="w-10 text-[10px] text-zinc-500 font-bold text-right uppercase">Gelir</span>
                      <div className="flex-1 bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          style={{ width: `${incomeWidth}%` }}
                          className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                        />
                      </div>
                      <span className="w-28 text-right font-bold text-emerald-400 text-xs">
                        {formatCurrencyTRY(d.income)}
                      </span>
                    </div>

                    {/* Gider bar */}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="w-10 text-[10px] text-zinc-500 font-bold text-right uppercase">Gider</span>
                      <div className="flex-1 bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          style={{ width: `${expenseWidth}%` }}
                          className="bg-rose-500 h-full transition-all duration-300 rounded-full"
                        />
                      </div>
                      <span className="w-28 text-right font-bold text-rose-400 text-xs">
                        {formatCurrencyTRY(d.expense)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
