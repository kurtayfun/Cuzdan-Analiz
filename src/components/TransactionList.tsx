import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Edit3, 
  Copy, 
  CreditCard, 
  Send, 
  Banknote, 
  Coins, 
  Sparkles, 
  Tag,
  AlertCircle
} from 'lucide-react';
import { Transaction, TransactionCategory } from '../types';
import { formatCurrencyTRY, formatDateTR } from '../services/exportService';
import { extractMonthKey, normalizeDateToYMD, isSameMonth } from '../services/gasService';

interface TransactionListProps {
  transactions: Transaction[];
  selectedMonth: string;
  onSelectMonth?: (month: string) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  onDuplicate: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  selectedMonth,
  onSelectMonth,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'amount_desc'>('date_desc');

  const isAllTime = selectedMonth === 'all';

  // Group other months with data for quick switching
  const otherMonthsWithData = useMemo(() => {
    const counts = new Map<string, number>();
    transactions.forEach((t) => {
      const m = extractMonthKey(t.date);
      if (m) {
        counts.set(m, (counts.get(m) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([mKey, count]) => ({ mKey, count }))
      .sort((a, b) => b.mKey.localeCompare(a.mKey));
  }, [transactions]);

  // Contextual transactions based on current month/all-time scope
  const scopedTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!isAllTime) {
        return isSameMonth(t.date, selectedMonth);
      }
      return true;
    });
  }, [transactions, selectedMonth, isAllTime]);

  // Filter & Sort
  const filteredTransactions = useMemo(() => {
    return scopedTransactions.filter((t) => {
      // Category filter
      if (selectedCat !== 'all' && t.category !== selectedCat) {
        return false;
      }

      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNote = (t.note || '').toLowerCase().includes(q);
        const matchCat = t.category.toLowerCase().includes(q);
        const matchAmount = t.amount.toString().includes(q);
        const matchDate = (t.date || '').includes(q);
        return matchNote || matchCat || matchAmount || matchDate;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'date_desc') return new Date(normalizeDateToYMD(b.date)).getTime() - new Date(normalizeDateToYMD(a.date)).getTime();
      if (sortOrder === 'date_asc') return new Date(normalizeDateToYMD(a.date)).getTime() - new Date(normalizeDateToYMD(b.date)).getTime();
      if (sortOrder === 'amount_desc') return b.amount - a.amount;
      return 0;
    });
  }, [scopedTransactions, selectedCat, search, sortOrder]);

  const getCategoryBadge = (category: TransactionCategory) => {
    switch (category) {
      case 'Sabit Gelir':
        return {
          badge: 'bg-emerald-900/20 text-emerald-400 border border-emerald-900/30 text-[10px] font-bold uppercase',
          isIncome: true,
        };
      case 'Ek Gelir':
        return {
          badge: 'bg-teal-900/20 text-teal-400 border border-teal-900/30 text-[10px] font-bold uppercase',
          isIncome: true,
        };
      case 'Kart Ekstresi':
        return {
          badge: 'bg-rose-900/20 text-rose-400 border border-rose-900/30 text-[10px] font-bold uppercase',
          isIncome: false,
        };
      case 'Transfer Gideri':
        return {
          badge: 'bg-amber-900/20 text-amber-400 border border-amber-900/30 text-[10px] font-bold uppercase',
          isIncome: false,
        };
      case 'Nakit Çekim':
        return {
          badge: 'bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold uppercase',
          isIncome: false,
        };
      default:
        return {
          badge: 'bg-purple-900/20 text-purple-400 border border-purple-900/30 text-[10px] font-bold uppercase',
          isIncome: false,
        };
    }
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="p-5 border-b border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-zinc-900/50">
        <div>
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            SON İŞLEMLER
          </h2>
          <p className="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">
            {!isAllTime ? `${selectedMonth} DÖNEMİ İŞLEM HAREKETLERİ (${scopedTransactions.length} KAYIT)` : `TÜM KAYIT GEÇMİŞİ (${scopedTransactions.length} KAYIT)`}
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Mode Switcher */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => {
                if (onSelectMonth) {
                  const latestMonth = otherMonthsWithData.find((m) => m.count > 0)?.mKey;
                  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                  onSelectMonth(latestMonth || currentMonthStr);
                }
              }}
              className={`px-2.5 py-1 rounded-md font-bold uppercase text-[10px] tracking-wider transition ${
                !isAllTime
                  ? 'bg-zinc-800 text-blue-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Dönem Bazlı
            </button>
            <button
              onClick={() => {
                if (onSelectMonth) {
                  onSelectMonth('all');
                }
              }}
              className={`px-2.5 py-1 rounded-md font-bold uppercase text-[10px] tracking-wider transition ${
                isAllTime
                  ? 'bg-zinc-800 text-blue-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Tümü
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Filtrele veya ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>

          {/* Sort Selector */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500 font-sans"
          >
            <option value="date_desc">Tarih (Yeni → Eski)</option>
            <option value="date_asc">Tarih (Eski → Yeni)</option>
            <option value="amount_desc">Tutar (Yüksek → Düşük)</option>
          </select>
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="px-5 py-2.5 bg-zinc-950/40 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition whitespace-nowrap ${
            selectedCat === 'all'
              ? 'bg-zinc-800 text-white border border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Hepsi ({scopedTransactions.length})
        </button>
        {(['Sabit Gelir', 'Kart Ekstresi', 'Transfer Gideri', 'Nakit Çekim', 'Ek Gelir', 'Diğer Gider'] as TransactionCategory[]).map((cat) => {
          const count = scopedTransactions.filter((t) => t.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider transition whitespace-nowrap ${
                selectedCat === cat
                  ? 'bg-zinc-800 text-blue-400 border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-950/50 text-zinc-500 text-[10px] uppercase font-bold sticky top-0 tracking-wider">
            <tr>
              <th className="p-4 border-b border-zinc-800">Tarih</th>
              <th className="p-4 border-b border-zinc-800">Kategori</th>
              <th className="p-4 border-b border-zinc-800">Açıklama</th>
              <th className="p-4 border-b border-zinc-800 text-right">Tutar</th>
              <th className="p-4 border-b border-zinc-800 text-center w-28">Eylem</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-zinc-800/50">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 sm:p-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                    <AlertCircle className="w-8 h-8 text-zinc-600" />
                    <div>
                      <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Kayıt Bulunamadı</p>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        {search 
                          ? 'Arama kriterlerinize uygun hareket yok.' 
                          : `${selectedMonth} dönemi için henüz işlem girişi yapılmadı.`}
                      </p>
                    </div>

                    {!search && !isAllTime && otherMonthsWithData.length > 0 && (
                      <div className="w-full pt-3 border-t border-zinc-800/60 flex flex-col items-center gap-2">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                          Mevcut Kayıt İçeren Dönemler:
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {otherMonthsWithData.map(({ mKey, count }) => {
                            const [y, mn] = mKey.split('-').map(Number);
                            const mDate = new Date(y, (mn || 1) - 1, 1);
                            const name = mDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                            return (
                              <button
                                key={mKey}
                                onClick={() => onSelectMonth && onSelectMonth(mKey)}
                                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-blue-400 hover:text-white border border-zinc-700 rounded-lg text-[10px] font-mono font-bold uppercase transition flex items-center gap-1"
                              >
                                <span>📅 {name}</span>
                                <span className="bg-blue-950/80 text-blue-300 px-1 rounded text-[9px]">({count})</span>
                              </button>
                            );
                          })}
                          <button
                            onClick={() => onSelectMonth && onSelectMonth('all')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-mono font-bold uppercase transition shadow-md shadow-blue-900/30"
                          >
                            🌐 Tüm Zamanları Göster ({transactions.length})
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const badgeInfo = getCategoryBadge(tx.category);

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    {/* Tarih */}
                    <td className="p-4 font-mono text-zinc-400 whitespace-nowrap">
                      {formatDateTR(tx.date)}
                    </td>

                    {/* Kategori Badge */}
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full ${badgeInfo.badge}`}>
                        {tx.category}
                      </span>
                    </td>

                    {/* Açıklama */}
                    <td className="p-4 text-zinc-300 italic max-w-xs truncate">
                      {tx.note || <span className="text-zinc-600 not-italic">-</span>}
                    </td>

                    {/* Tutar */}
                    <td className={`p-4 text-right font-mono text-xs font-bold whitespace-nowrap ${
                      badgeInfo.isIncome ? 'text-emerald-400' : 'text-zinc-200'
                    }`}>
                      {badgeInfo.isIncome ? '+' : '-'}{formatCurrencyTRY(tx.amount)}
                    </td>

                    {/* Eylemler */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEdit(tx)}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                          title="Düzenle"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicate(tx)}
                          className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                          title="Bugünün tarihiyle kopyala"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(tx)}
                          className="p-1.5 rounded-md hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 transition"
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer bar matching Technical Minimalist */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
        <span>Toplam Kayıt: {filteredTransactions.length}</span>
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SYNCED TO GOOGLE SHEETS</span>
        </div>
      </div>
    </section>
  );
};
