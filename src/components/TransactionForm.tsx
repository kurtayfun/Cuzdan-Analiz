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
  Loader2 
} from 'lucide-react';
import { Transaction, TransactionCategory } from '../types';
import { formatCurrencyTRY } from '../services/exportService';

interface TransactionFormProps {
  onSave: (tx: Omit<Transaction, 'id'> & { id?: string }) => Promise<void>;
  editingTx: Transaction | null;
  onCancelEdit: () => void;
  selectedMonth: string;
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
}) => {
  const [date, setDate] = useState<string>(() => {
    const today = new Date().toISOString().substring(0, 10);
    return today;
  });
  const [category, setCategory] = useState<TransactionCategory>('Kart Ekstresi');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync state when editingTx changes
  useEffect(() => {
    if (editingTx) {
      setDate(editingTx.date);
      setCategory(editingTx.category);
      setAmount(editingTx.amount.toString());
      setNote(editingTx.note || '');
    } else {
      const today = new Date().toISOString().substring(0, 10);
      if (today.startsWith(selectedMonth)) {
        setDate(today);
      } else {
        setDate(`${selectedMonth}-01`);
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

  const handleApplyPreset = (presetCategory: TransactionCategory, presetNote: string) => {
    setCategory(presetCategory);
    setNote(presetNote);
    const input = document.getElementById('tx-amount-input');
    input?.focus();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Main Input Form Card */}
      <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center justify-between">
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
          <div className="mb-4">
            <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5">
              Hızlı Şablonlar
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('Sabit Gelir', 'Aylık Net Maaş')}
                className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-emerald-400 text-left transition-colors"
              >
                + Maaş
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Transfer Gideri', 'Kira & Aidat Transferi')}
                className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-blue-400 text-left transition-colors"
              >
                - Kira
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Kart Ekstresi', 'Kredi Kartı Ekstre Ödemesi')}
                className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-rose-400 text-left transition-colors"
              >
                - Kart
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Nakit Çekim', 'ATM Nakit Çekim')}
                className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-amber-400 text-left transition-colors"
              >
                - Nakit
              </button>
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
