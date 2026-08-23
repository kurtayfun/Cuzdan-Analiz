import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Check, 
  RotateCcw, 
  Coins, 
  Sparkles, 
  CreditCard, 
  Send, 
  Banknote, 
  Tag, 
  Loader2,
  Sliders,
  Settings
} from 'lucide-react';
import { Transaction, TransactionCategory, QuickTemplate } from '../types';
import { formatCurrencyTRY } from '../services/exportService';
import { getLocalDateString, normalizeDateToYMD } from '../services/gasService';

interface TransactionFormProps {
  onSave: (tx: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  editingTx: Transaction | null;
  onCancelEdit: () => void;
  selectedMonth: string;
  templates: QuickTemplate[];
  onOpenTemplateManager: () => void;
}

const CATEGORIES: { label: TransactionCategory; type: 'income' | 'expense' }[] = [
  { label: 'Sabit Gelir', type: 'income' },
  { label: 'Ek Gelir', type: 'income' },
  { label: 'Kart Ekstresi', type: 'expense' },
  { label: 'Transfer Gideri', type: 'expense' },
  { label: 'Nakit Çekim', type: 'expense' },
  { label: 'Diğer Gider', type: 'expense' },
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSave,
  editingTx,
  onCancelEdit,
  selectedMonth,
  templates,
  onOpenTemplateManager,
}) => {
  const [date, setDate] = useState<string>(() => {
    return getLocalDateString();
  });
  const [category, setCategory] = useState<TransactionCategory>('Kart Ekstresi');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync state when editingTx changes
  useEffect(() => {
    if (editingTx) {
      setDate(normalizeDateToYMD(editingTx.date));
      setCategory(editingTx.category);
      setAmount(editingTx.amount.toString());
      setNote(editingTx.note || '');
    } else {
      const today = getLocalDateString();
      if (selectedMonth === 'all') {
        setDate(today);
      } else if (today.startsWith(selectedMonth)) {
        setDate(today);
      } else if (selectedMonth.includes('-')) {
        const [y, m] = selectedMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const curDay = parseInt(today.slice(8, 10), 10) || 1;
        const safeDay = Math.min(Math.max(1, curDay), lastDay);
        setDate(`${selectedMonth}-${String(safeDay).padStart(2, '0')}`);
      } else {
        setDate(today);
      }
    }
  }, [editingTx, selectedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Lütfen geçerli bir tutar girin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: editingTx ? editingTx.id : undefined,
        date,
        category,
        amount: numAmount,
        note: note.trim(),
      });

      setFeedbackMsg(editingTx ? 'Kayıt Güncellendi' : 'Kayıt Eklendi');
      setTimeout(() => setFeedbackMsg(null), 2500);

      if (!editingTx) {
        setAmount('');
        setNote('');
      }
    } catch (err: any) {
      alert('İşlem kaydedilemedi: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyTemplate = (tpl: QuickTemplate) => {
    setCategory(tpl.category);
    setNote(tpl.defaultNote || '');
    if (tpl.defaultAmount && tpl.defaultAmount > 0) {
      setAmount(tpl.defaultAmount.toString());
    }
    const input = document.getElementById('tx-amount-input');
    input?.focus();
  };

  const getTemplateStyle = (cat: TransactionCategory) => {
    if (cat === 'Sabit Gelir' || cat === 'Ek Gelir') {
      return 'text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/50 hover:border-emerald-700/60';
    }
    if (cat === 'Kart Ekstresi') {
      return 'text-rose-400 border-rose-900/40 hover:bg-rose-950/50 hover:border-rose-700/60';
    }
    if (cat === 'Nakit Çekim') {
      return 'text-amber-400 border-amber-900/40 hover:bg-amber-950/50 hover:border-amber-700/60';
    }
    if (cat === 'Transfer Gideri') {
      return 'text-blue-400 border-blue-900/40 hover:bg-blue-950/50 hover:border-blue-700/60';
    }
    return 'text-purple-400 border-purple-900/40 hover:bg-purple-950/50 hover:border-purple-700/60';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Main Input Form Card */}
      <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-5 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${editingTx ? 'bg-amber-400' : 'bg-blue-500'}`}></span>
            {editingTx ? 'İşlemi Düzenle' : 'İşlem Girişi'}
          </span>
          {feedbackMsg && (
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
              ● {feedbackMsg}
            </span>
          )}
        </h2>

        {/* Quick Presets */}
        {!editingTx && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                Hızlı Şablonlar
              </label>
              <button
                type="button"
                onClick={onOpenTemplateManager}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 hover:underline transition"
              >
                <Sliders className="w-3 h-3" />
                <span>Şablonları Özelleştir</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`bg-zinc-950 border rounded-lg p-2 text-xs font-mono text-left transition-all ${getTemplateStyle(tpl.category)}`}
                  title={`${tpl.category} - ${tpl.defaultNote || tpl.title}`}
                >
                  <div className="font-bold truncate">{tpl.title}</div>
                  <div className="text-[9px] text-zinc-500 truncate font-sans">{tpl.defaultNote || tpl.category}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">İşlem Tarihi</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 outline-none focus:border-blue-500 transition-colors font-sans"
            >
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label} {c.type === 'income' ? '(+)' : '(-)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 flex justify-between items-center">
              <span>Tutar (TRY)</span>
              {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                <span className="text-blue-400 font-mono font-bold lowercase">
                  {formatCurrencyTRY(parseFloat(amount))}
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-zinc-600 font-bold text-sm">₺</span>
              <input
                id="tx-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 pl-8 text-sm outline-none focus:border-blue-500 transition-colors font-mono text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">Açıklama</label>
            <input
              type="text"
              placeholder="Örn: Kasım ayı kredi kartı ekstresi"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 transition-colors text-zinc-100"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>KAYDEDİLİYOR...</span>
                </>
              ) : editingTx ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>GÜNCELLEMEYİ KAYDET</span>
                </>
              ) : (
                <>
                  <span>KAYDET VE GÖNDER</span>
                </>
              )}
            </button>

            {editingTx && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                VAZGEÇ
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Technical System Notes Card (Dashed pattern from design) */}
      <section className="bg-zinc-900/50 border border-dashed border-zinc-800 p-6 rounded-2xl">
        <h3 className="text-[10px] font-bold text-zinc-600 uppercase mb-4 tracking-widest">Sistem Notları</h3>
        <ul className="text-xs text-zinc-500 space-y-3">
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>Tüm kayıtlar anlık olarak Google Sheets'e yansıtılır.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>Negatif bakiye durumunda 'Birikimden Harcama' uyarısı aktifleşir.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-500">•</span>
            <span>Cash basis esas alınmıştır; kart ekstreleri ve nakit çekimler doğrudan o aya aittir.</span>
          </li>
        </ul>
      </section>
    </div>
  );
};
