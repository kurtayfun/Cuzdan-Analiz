import React from 'react';
import { Trash2, AlertTriangle, X, Calendar, Tag, FileText, Banknote } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrencyTRY, formatDateTR } from '../services/exportService';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.category === 'Sabit Gelir' || transaction.category === 'Ek Gelir';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        id="delete-confirm-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-zinc-100 uppercase tracking-tight">
                İşlemi Sil
              </h2>
              <p className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">
                Kalıcı Silme Onayı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-3.5 flex items-start gap-3 text-rose-300 font-mono text-[11px]">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              Bu kayıt yerel bellekten ve bağlı Google E-Tablo veritabanınızdan kalıcı olarak kaldırılacaktır.
            </p>
          </div>

          {/* Transaction Summary Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2.5 font-mono">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-500 text-[11px] uppercase">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Tarih
              </span>
              <span className="text-zinc-200 font-bold">{formatDateTR(transaction.date)}</span>
            </div>

            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-500 text-[11px] uppercase">
                <Tag className="w-3.5 h-3.5 text-zinc-500" /> Kategori
              </span>
              <span className="text-zinc-200 font-bold">{transaction.category}</span>
            </div>

            {transaction.note && (
              <div className="flex items-start justify-between text-zinc-400 gap-2">
                <span className="flex items-center gap-1.5 text-zinc-500 text-[11px] uppercase shrink-0">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" /> Açıklama
                </span>
                <span className="text-zinc-300 italic text-right truncate max-w-[200px]">{transaction.note}</span>
              </div>
            )}

            <div className="border-t border-zinc-800/80 pt-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-zinc-500 text-[11px] uppercase">
                <Banknote className="w-3.5 h-3.5 text-zinc-500" /> Tutar
              </span>
              <span className={`text-base font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isIncome ? '+' : '-'}{formatCurrencyTRY(transaction.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-rose-950/50 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Siliniyor...' : 'Evet, Kaydı Sil'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
