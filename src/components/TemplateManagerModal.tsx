import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Tag, 
  FileText, 
  Banknote,
  Sliders
} from 'lucide-react';
import { QuickTemplate, TransactionCategory } from '../types';
import { formatCurrencyTRY } from '../services/exportService';

const CATEGORIES: { label: TransactionCategory; type: 'income' | 'expense' }[] = [
  { label: 'Sabit Gelir', type: 'income' },
  { label: 'Ek Gelir', type: 'income' },
  { label: 'Kart Ekstresi', type: 'expense' },
  { label: 'Transfer Gideri', type: 'expense' },
  { label: 'Nakit Çekim', type: 'expense' },
  { label: 'Diğer Gider', type: 'expense' },
];

export const DEFAULT_QUICK_TEMPLATES: QuickTemplate[] = [
  { id: 'tpl_salary', title: '+ Maaş', category: 'Sabit Gelir', defaultNote: 'Aylık Net Maaş' },
  { id: 'tpl_rent', title: '- Kira', category: 'Transfer Gideri', defaultNote: 'Kira & Aidat Transferi' },
  { id: 'tpl_card', title: '- Kart', category: 'Kart Ekstresi', defaultNote: 'Kredi Kartı Ekstre Ödemesi' },
  { id: 'tpl_credit', title: '- Kredi', category: 'Transfer Gideri', defaultNote: 'Banka Kredi Taksiti' },
  { id: 'tpl_cash', title: '- Nakit', category: 'Nakit Çekim', defaultNote: 'ATM Nakit Çekim' },
  { id: 'tpl_debt', title: '- Borç', category: 'Transfer Gideri', defaultNote: 'Borç / Elden Ödeme' },
  { id: 'tpl_side', title: '+ Ek Gelir', category: 'Ek Gelir', defaultNote: 'Freelance & Ek Kazanç' },
  { id: 'tpl_bill', title: '- Fatura', category: 'Transfer Gideri', defaultNote: 'Elektrik, Su, Doğalgaz Faturası' },
];

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: QuickTemplate[];
  onSaveTemplates: (templates: QuickTemplate[]) => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSaveTemplates,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<TransactionCategory>('Transfer Gideri');
  const [defaultNote, setDefaultNote] = useState<string>('');
  const [defaultAmount, setDefaultAmount] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingId(null);
    setTitle('');
    setCategory('Transfer Gideri');
    setDefaultNote('');
    setDefaultAmount('');
    setShowAddForm(true);
  };

  const handleStartEdit = (tpl: QuickTemplate) => {
    setEditingId(tpl.id);
    setTitle(tpl.title);
    setCategory(tpl.category);
    setDefaultNote(tpl.defaultNote || '');
    setDefaultAmount(tpl.defaultAmount ? tpl.defaultAmount.toString() : '');
    setShowAddForm(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedAmt = parseFloat(defaultAmount);
    const amountVal = !isNaN(parsedAmt) && parsedAmt > 0 ? parsedAmt : undefined;

    if (editingId) {
      // Update existing
      const updated = templates.map((t) =>
        t.id === editingId
          ? {
              ...t,
              title: title.trim(),
              category,
              defaultNote: defaultNote.trim(),
              defaultAmount: amountVal,
            }
          : t
      );
      onSaveTemplates(updated);
    } else {
      // Add new
      const newTpl: QuickTemplate = {
        id: `tpl_${Date.now()}`,
        title: title.trim(),
        category,
        defaultNote: defaultNote.trim(),
        defaultAmount: amountVal,
      };
      onSaveTemplates([...templates, newTpl]);
    }

    setShowAddForm(false);
    setEditingId(null);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    onSaveTemplates(updated);
    if (editingId === id) {
      setShowAddForm(false);
      setEditingId(null);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Tüm şablonları varsayılanlara sıfırlamak istiyor musunuz?')) {
      onSaveTemplates(DEFAULT_QUICK_TEMPLATES);
      setShowAddForm(false);
      setEditingId(null);
    }
  };

  const getBadgeClass = (cat: TransactionCategory) => {
    if (cat === 'Sabit Gelir' || cat === 'Ek Gelir') {
      return 'bg-emerald-950/60 text-emerald-400 border-emerald-800';
    }
    if (cat === 'Kart Ekstresi') {
      return 'bg-rose-950/60 text-rose-400 border-rose-800';
    }
    if (cat === 'Nakit Çekim') {
      return 'bg-amber-950/60 text-amber-400 border-amber-800';
    }
    return 'bg-blue-950/60 text-blue-400 border-blue-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-zinc-100 uppercase tracking-tight">
                Hızlı Şablon Yönetimi
              </h2>
              <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">
                Şablon Ekle, Düzenle ve Özelleştir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Top Actions */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleStartAdd}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-blue-900/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Şablon Ekle</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 font-bold px-3 py-2 rounded-lg text-xs uppercase tracking-wider transition flex items-center gap-1.5 border border-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılana Sıfırla</span>
            </button>
          </div>

          {/* Add / Edit Form Card */}
          {showAddForm && (
            <form
              onSubmit={handleSaveForm}
              className="bg-zinc-950 border border-blue-500/40 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold text-[11px] uppercase tracking-wider text-blue-400 font-mono">
                  {editingId ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Title */}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">
                    Buton Başlığı (Kısa)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: - Kredi veya - Borç"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">
                    İşlem Kategorisi
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.label} value={c.label}>
                        {c.label} {c.type === 'income' ? '(+)' : '(-)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Default Note */}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">
                    Otomatik Açıklama
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Aylık Konut Kredisi Taksiti"
                    value={defaultNote}
                    onChange={(e) => setDefaultNote(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Default Amount */}
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">
                    Sabit Tutar (Opsiyonel)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Örn: 5500 (Boş bırakılabilir)"
                    value={defaultAmount}
                    onChange={(e) => setDefaultAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase text-[10px] tracking-wider"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-900/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Template List */}
          <div className="space-y-2">
            <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
              Kayıtlı Şablonlar ({templates.length})
            </label>
            {templates.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 bg-zinc-950/40 border border-zinc-800 rounded-xl font-mono">
                Henüz kayıtlı şablon bulunmuyor. Yeni bir şablon ekleyin veya varsayılana sıfırlayın.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3 rounded-xl flex items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-100 font-mono">
                          {tpl.title}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md border font-mono ${getBadgeClass(tpl.category)}`}>
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate italic">
                        {tpl.defaultNote || <span className="text-zinc-600 not-italic">-</span>}
                      </p>
                      {tpl.defaultAmount && (
                        <p className="text-[10px] font-mono text-zinc-500">
                          Sabit: <strong className="text-zinc-300">{formatCurrencyTRY(tpl.defaultAmount)}</strong>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(tpl)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 transition"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
