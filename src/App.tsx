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
import { TemplateManagerModal } from './components/TemplateManagerModal';
import { LockScreen } from './components/LockScreen';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { InstallPwaModal } from './components/InstallPwaModal';
import { 
  Transaction, 
  MonthlySummary, 
  GasConfig, 
  ViewMode,
  QuickTemplate 
} from './types';
import { 
  loadLocalTransactions, 
  saveLocalTransactions, 
  loadLocalTemplates,
  saveLocalTemplates,
  getStoredGasUrl, 
  setStoredGasUrl, 
  fetchFromGas, 
  postToGas,
  getLocalDateString 
} from './services/gasService';
import { 
  generateSingleFileHtml, 
  downloadFile, 
  exportTransactionsToCsv, 
  formatCurrencyTRY 
} from './services/exportService';
import { 
  isPinProtectionEnabled, 
  isSessionUnlocked, 
  lockSession, 
  getStoredPin 
} from './services/securityService';
import { 
  FileCode, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Terminal,
  Lock,
  Smartphone
} from 'lucide-react';

export default function App() {
  // Current active month in format YYYY-MM or 'all'
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return getLocalDateString().substring(0, 7);
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [templates, setTemplates] = useState<QuickTemplate[]>(() => loadLocalTemplates());
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('dashboard');
  const [isGasModalOpen, setIsGasModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return isPinProtectionEnabled() && !isSessionUnlocked();
  });
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

  // Register PWA service worker if supported
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service Worker registration notice:', err);
      });
    }
  }, []);

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
      const pin = getStoredPin();
      const data = await fetchFromGas(url, pin);
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
      const pin = getStoredPin();
      const data = await fetchFromGas(gasConfig.url, pin);
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
      const pin = getStoredPin();
      postToGas(gasConfig.url, {
        action: isEdit ? 'update' : 'insert',
        id: newTx.id,
        date: newTx.date,
        category: newTx.category,
        amount: newTx.amount,
        note: newTx.note,
      }, pin).catch((err) => console.error('Background GAS Post Error:', err));
    }

    showToast(isEdit ? 'İşlem güncellendi.' : 'Yeni işlem eklendi.');
  };

  // Delete transaction trigger (opens custom modal)
  const handleDeleteTransaction = (tx: Transaction) => {
    setTxToDelete(tx);
  };

  // Duplicate transaction helper
  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicated: Transaction = {
      ...tx,
      id: `ID_${Date.now()}`,
      createdAt: new Date().toISOString(),
      note: tx.note ? `${tx.note} (Kopya)` : 'Kopya',
    };
    const updated = [duplicated, ...transactions];
    setTransactions(updated);
    saveLocalTransactions(updated);
    if (gasConfig.url) {
      const pin = getStoredPin();
      postToGas(gasConfig.url, {
        action: 'insert',
        id: duplicated.id,
        date: duplicated.date,
        category: duplicated.category,
        amount: duplicated.amount,
        note: duplicated.note,
      }, pin).catch((err) => console.error('Background GAS Duplicate Error:', err));
    }
    showToast('İşlem başarıyla kopyalandı.');
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    const targetTx = txToDelete;
    try {
      const updatedList = transactions.filter((t) => t.id !== targetTx.id);
      setTransactions(updatedList);
      saveLocalTransactions(updatedList);

      if (gasConfig.url) {
        const pin = getStoredPin();
        await postToGas(gasConfig.url, {
          action: 'delete',
          id: targetTx.id,
          date: targetTx.date,
          category: targetTx.category,
          amount: targetTx.amount,
          note: targetTx.note,
        }, pin);
      }

      showToast('Kayıt silindi.');
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(`Silme işlemi uyarısı: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
      setTxToDelete(null);
    }
  };

  // Save GAS Web App URL from modal
  const handleSaveGasUrl = async (url: string): Promise<boolean> => {
    setStoredGasUrl(url);
    const isConn = Boolean(url && url.startsWith('http'));
    setGasConfig((prev) => ({
      ...prev,
      url,
      isConnected: isConn,
    }));

    if (isConn) {
      showToast('Web App URL kaydedildi, veriler eşitleniyor...');
      await handleSyncSilent(url);
    } else {
      showToast('URL kaldırıldı. Uygulama yerel modda çalışıyor.', 'info');
    }
    return true;
  };

  // Test GAS connection with live probe
  const handleTestConnection = async (url: string) => {
    const pin = getStoredPin();
    const data = await fetchFromGas(url, pin);
    return {
      success: true,
      message: 'Google E-Tablo ve Apps Script bağlantısı başarılı!',
      count: data.length,
    };
  };

  // Save customized templates
  const handleSaveTemplates = (newTemplates: QuickTemplate[]) => {
    setTemplates(newTemplates);
    saveLocalTemplates(newTemplates);
    showToast('Hızlı şablonlar güncellendi.');
  };

  // Lock App manually
  const handleLockNow = () => {
    lockSession();
    setIsLocked(true);
    setIsSecurityModalOpen(false);
    showToast('Uygulama kilitlendi.', 'info');
  };

  // Single HTML Export
  const handleExportHtml = () => {
    const pin = getStoredPin();
    const htmlContent = generateSingleFileHtml(gasConfig.url, templates, pin);
    downloadFile('index.html', htmlContent, 'text/html');
    showToast('Tek dosyalık index.html indirildi (PWA ve PIN korumalı).');
  };

  // CSV Export
  const handleExportCsv = () => {
    const csvContent = exportTransactionsToCsv(transactions);
    downloadFile(`cuzdan_kayitlari_${new Date().toISOString().substring(0, 10)}.csv`, csvContent, 'text/csv;charset=utf-8;');
    showToast('CSV dökümü indirildi.');
  };

  // Calculate monthly summary
  const monthlySummary: MonthlySummary = useMemo(() => {
    const isAllTime = selectedMonth === 'all';
    const filtered = transactions.filter((t) => {
      if (isAllTime) return true;
      return t.date && t.date.substring(0, 7) === selectedMonth;
    });

    let income = 0;
    let card = 0;
    let transfer = 0;
    let cash = 0;
    let other = 0;

    for (const tx of filtered) {
      const amt = Number(tx.amount) || 0;
      if (tx.category === 'Sabit Gelir' || tx.category === 'Ek Gelir') {
        income += amt;
      } else if (tx.category === 'Kart Ekstresi') {
        card += amt;
      } else if (tx.category === 'Transfer Gideri') {
        transfer += amt;
      } else if (tx.category === 'Nakit Çekim') {
        cash += amt;
      } else {
        other += amt;
      }
    }

    const totalExpense = card + transfer + cash + other;
    const netBalance = income - totalExpense;
    const savingsRate = income > 0 ? ((income - totalExpense) / income) * 100 : 0;

    let status: MonthlySummary['status'] = 'surplus';
    if (income === 0 && totalExpense === 0) {
      status = 'empty';
    } else if (netBalance < 0) {
      status = 'deficit';
    } else if (netBalance === 0) {
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

  // If locked, render LockScreen immediately
  if (isLocked) {
    return (
      <LockScreen
        onUnlock={() => {
          setIsLocked(false);
          showToast('Kilit açıldı. Hoş geldiniz!');
        }}
      />
    );
  }

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
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
        isPinEnabled={isPinProtectionEnabled()}
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
                templates={templates}
                onOpenTemplateManager={() => setIsTemplateModalOpen(true)}
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
            onClick={() => setIsSecurityModalOpen(true)}
            className="hover:text-blue-400 transition flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span>Güvenlik & PIN</span>
          </button>
          <span>•</span>
          <button
            onClick={() => setIsPwaModalOpen(true)}
            className="hover:text-blue-400 transition flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
            <span>Telefona Yükle (PWA)</span>
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
          Cüzdan Analiz v2.2 • Güvenli PIN Korumalı & PWA Destekli Google Apps Script Nakit Akışı Sistemi
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

      {/* Security & PIN Settings Modal */}
      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onLockNow={handleLockNow}
        onShowToast={showToast}
      />

      {/* PWA Install Modal */}
      <InstallPwaModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(txToDelete)}
        transaction={txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Template Manager Modal */}
      <TemplateManagerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        onSaveTemplates={handleSaveTemplates}
      />
    </div>
  );
}
