/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { AnalysisCard } from './components/AnalysisCard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { MonthlyTrends } from './components/MonthlyTrends';
import { GasSetupModal } from './components/GasSetupModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { 
  Transaction, 
  MonthlySummary, 
  GasConfig, 
  ViewMode 
} from './types';
import { 
  loadLocalTransactions, 
  saveLocalTransactions, 
  getStoredGasUrl, 
  setStoredGasUrl, 
  fetchFromGas, 
  postToGas 
} from './services/gasService';
import { 
  generateSingleFileHtml, 
  downloadFile, 
  exportTransactionsToCsv, 
  formatCurrencyTRY 
} from './services/exportService';
import { 
  FileCode, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Terminal
} from 'lucide-react';

export default function App() {
  // Current active month in format YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isGasModalOpen, setIsGasModalOpen] = useState<boolean>(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [gasConfig, setGasConfig] = useState<GasConfig>(() => {
    const url = getStoredGasUrl();
    return {
      url,
      lastSyncTime: null,
      autoSync: true,
      isConnected: Boolean(url && url.startsWith('http')),
    };
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial local storage load
  useEffect(() => {
    const initialData = loadLocalTransactions();
    setTransactions(initialData);

    const url = getStoredGasUrl();
    if (url && url.startsWith('http')) {
      handleSyncSilent(url);
    }
  }, []);

  const handleSyncSilent = async (url: string) => {
    try {
      setIsSyncing(true);
      const data = await fetchFromGas(url);
      if (Array.isArray(data) && data.length > 0) {
        setTransactions(data);
        saveLocalTransactions(data);
        setGasConfig(prev => ({
          ...prev,
          isConnected: true,
          lastSyncTime: new Date().toLocaleTimeString('tr-TR'),
        }));
      }
    } catch (err) {
      console.warn('Initial sync warning:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Explicit user manual sync
  const handleSync = async () => {
    if (!gasConfig.url) {
      setIsGasModalOpen(true);
      showToast('Lütfen önce Google Apps Script Web App URL\'nizi girin.', 'info');
      return;
    }

    setIsSyncing(true);
    try {
      const data = await fetchFromGas(gasConfig.url);
      setTransactions(data);
      saveLocalTransactions(data);
      setGasConfig(prev => ({
        ...prev,
        isConnected: true,
        lastSyncTime: new Date().toLocaleTimeString('tr-TR'),
      }));
      showToast(`Senkronize edildi: E-Tablodan ${data.length} kayıt güncellendi.`);
    } catch (err: any) {
      console.error(err);
      showToast(`Senkronizasyon hatası: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Save or update transaction
  const handleSaveTransaction = async (txData: Omit<Transaction, 'id'> & { id?: string }) => {
    const isEdit = Boolean(txData.id);
    const txId = txData.id || `ID_${Date.now()}`;

    const newTx: Transaction = {
      id: txId,
      date: txData.date,
      category: txData.category,
      amount: txData.amount,
      note: txData.note,
      createdAt: new Date().toISOString(),
    };

    let updatedList: Transaction[];
    if (isEdit) {
      updatedList = transactions.map((t) => (t.id === txId ? newTx : t));
    } else {
      updatedList = [newTx, ...transactions];
    }

    setTransactions(updatedList);
    saveLocalTransactions(updatedList);
    setEditingTx(null);

    if (gasConfig.url) {
      postToGas(gasConfig.url, {
        action: isEdit ? 'update' : 'insert',
        id: newTx.id,
        date: newTx.date,
        category: newTx.category,
        amount: newTx.amount,
        note: newTx.note,
      }).catch((err) => console.error('Background GAS Post Error:', err));
    }

    showToast(isEdit ? 'İşlem güncellendi.' : 'Yeni işlem eklendi.');
  };

  // Delete transaction trigger (opens custom modal)
  const handleDeleteTransaction = (tx: Transaction) => {
    setTxToDelete(tx);
  };

  // Confirm delete execution
  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);

    const targetTx = txToDelete;
    const updated = transactions.filter((t) => t.id !== targetTx.id);
    setTransactions(updated);
    saveLocalTransactions(updated);

    if (editingTx?.id === targetTx.id) {
      setEditingTx(null);
    }

    if (gasConfig.url) {
      postToGas(gasConfig.url, {
        action: 'delete',
        id: targetTx.id,
        date: targetTx.date,
        category: targetTx.category,
        amount: targetTx.amount,
        note: targetTx.note,
      }).catch((err) => console.error('Background GAS Delete Error:', err));
    }

    setIsDeleting(false);
    setTxToDelete(null);
    showToast(`"${targetTx.note || targetTx.category}" kaydı silindi.`);
  };

  // Duplicate transaction with today's date
  const handleDuplicateTransaction = (tx: Transaction) => {
    const today = new Date().toISOString().substring(0, 10);
    const duplicatedTx: Transaction = {
      ...tx,
      id: `ID_${Date.now()}`,
      date: today,
      note: tx.note ? `${tx.note} (Kopya)` : 'Kopya İşlem',
      createdAt: new Date().toISOString(),
    };

    const updated = [duplicatedTx, ...transactions];
    setTransactions(updated);
    saveLocalTransactions(updated);

    if (gasConfig.url) {
      postToGas(gasConfig.url, {
        action: 'insert',
        id: duplicatedTx.id,
        date: duplicatedTx.date,
        category: duplicatedTx.category,
        amount: duplicatedTx.amount,
        note: duplicatedTx.note,
      }).catch((err) => console.error('Background GAS Post Error:', err));
    }

    showToast('İşlem bugünün tarihiyle çoğaltıldı.');
  };

  // Save GAS URL from modal
  const handleSaveGasUrl = async (url: string) => {
    setStoredGasUrl(url);
    const hasUrl = Boolean(url && url.startsWith('http'));
    setGasConfig(prev => ({
      ...prev,
      url,
      isConnected: hasUrl,
    }));

    if (hasUrl) {
      showToast('Google Apps Script URL kaydedildi. Veriler çekiliyor...');
      await handleSync();
    } else {
      showToast('Yerel mod aktif.');
    }
    return true;
  };

  // Test GAS URL
  const handleTestConnection = async (url: string) => {
    try {
      const data = await fetchFromGas(url);
      return {
        success: true,
        message: 'Bağlantı Başarılı! E-Tabloya erişildi.',
        count: Array.isArray(data) ? data.length : 0,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Bağlantı hatası: ${err.message}. Lütfen "Erişimi Olanlar: Herkes (Anyone)" ayarlandığından emin olun.`,
      };
    }
  };

  // Export handlers
  const handleExportHtml = () => {
    const html = generateSingleFileHtml(gasConfig.url);
    downloadFile('index.html', html, 'text/html');
    showToast('Tek dosya index.html indirildi!');
  };

  const handleExportCsv = () => {
    const csv = exportTransactionsToCsv(transactions);
    downloadFile(`nakit_akisi_${selectedMonth}.csv`, csv, 'text/csv;charset=utf-8;');
    showToast('CSV dosyası indirildi!');
  };

  // Calculate Monthly Summary
  const monthlySummary = useMemo<MonthlySummary>(() => {
    let income = 0;
    let card = 0;
    let transfer = 0;
    let cash = 0;
    let other = 0;
    let hasEntries = false;

    transactions.forEach((t) => {
      if (t.date && t.date.startsWith(selectedMonth)) {
        hasEntries = true;
        const amt = t.amount || 0;
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
    const netBalance = income - totalExpense;
    const savingsRate = income > 0 ? (netBalance / income) * 100 : 0;

    let status: 'surplus' | 'deficit' | 'balanced' | 'empty' = 'empty';
    if (!hasEntries) {
      status = 'empty';
    } else if (netBalance > 0) {
      status = 'surplus';
    } else if (netBalance < 0) {
      status = 'deficit';
    } else {
      status = 'balanced';
    }

    return {
      period: selectedMonth,
      totalIncome: income,
      totalExpense,
      cardExpense: card,
      transferExpense: transfer,
      cashExpense: cash,
      otherExpense: other,
      netBalance,
      savingsRate: Math.max(0, savingsRate),
      status,
    };
  }, [transactions, selectedMonth]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        gasConfig={gasConfig}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        onSync={handleSync}
        isSyncing={isSyncing}
        onOpenGasModal={() => setIsGasModalOpen(true)}
        onExportHtml={handleExportHtml}
        onExportCsv={handleExportCsv}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-2xl border text-xs font-mono font-bold flex items-center gap-2.5 backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-zinc-900/95 text-emerald-400 border-emerald-500/50 shadow-emerald-950/40'
              : toastMessage.type === 'error'
              ? 'bg-zinc-900/95 text-rose-400 border-rose-500/50 shadow-rose-950/40'
              : 'bg-zinc-900/95 text-blue-400 border-blue-500/50 shadow-blue-950/40'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container - Technical Minimalist 12-Column Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Quick Connection Banner if offline */}
        {!gasConfig.isConnected && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-mono text-xs font-bold">
                API
              </div>
              <div className="text-xs font-mono">
                <p className="font-bold text-zinc-200 uppercase">Google E-Tablo Veritabanı Bağlantısı Bekleniyor</p>
                <p className="text-zinc-500">Verileriniz yerel depolamada saklanıyor. E-tablonuza otomatik yedekleme için Web App URL'nizi tanımlayın.</p>
              </div>
            </div>
            <button
              onClick={() => setIsGasModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-900/20 whitespace-nowrap"
            >
              Bağlantı Kur
            </button>
          </div>
        )}

        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (col-span-4): Form & System Notes */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <TransactionForm
                onSave={handleSaveTransaction}
                editingTx={editingTx}
                onCancelEdit={() => setEditingTx(null)}
                selectedMonth={selectedMonth}
              />
            </div>

            {/* Right Column (col-span-8): Metrics & Transaction Table */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              <AnalysisCard
                summary={monthlySummary}
                selectedMonth={selectedMonth}
              />
              <TransactionList
                transactions={transactions}
                selectedMonth={selectedMonth}
                onEdit={(tx) => {
                  setEditingTx(tx);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={handleDeleteTransaction}
                onDuplicate={handleDuplicateTransaction}
              />
            </div>
          </main>
        )}

        {/* Trends View */}
        {activeView === 'trends' && (
          <MonthlyTrends
            transactions={transactions}
            onSelectMonth={(month) => {
              setSelectedMonth(month);
              setActiveView('dashboard');
              showToast(`${month} dönemi seçildi.`, 'info');
            }}
          />
        )}
      </div>

      {/* Technical Minimalist Footer */}
      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-xs text-zinc-500 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-4 text-zinc-400 font-bold uppercase text-[10px] tracking-wider font-mono">
          <button
            onClick={() => setIsGasModalOpen(true)}
            className="hover:text-blue-400 transition flex items-center gap-1"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-500" />
            <span>Code.gs Betiği</span>
          </button>
          <span>•</span>
          <button
            onClick={handleExportHtml}
            className="hover:text-blue-400 transition flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>index.html İndir</span>
          </button>
          <span>•</span>
          <button
            onClick={handleExportCsv}
            className="hover:text-blue-400 transition flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>CSV Dışa Aktar</span>
          </button>
        </div>
        <p className="text-[11px] text-zinc-600 font-mono uppercase tracking-tight">
          Cüzdan Analiz v2.1 • Google Apps Script & Sheets API Entegre Nakit Akışı ve Birikim Takip Sistemi
        </p>
      </footer>

      {/* Google Apps Script Modal */}
      <GasSetupModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        gasUrl={gasConfig.url}
        onSaveGasUrl={handleSaveGasUrl}
        onTestConnection={handleTestConnection}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(txToDelete)}
        transaction={txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
