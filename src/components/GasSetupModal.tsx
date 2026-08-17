import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  FileCode, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Download, 
  Database, 
  ArrowRight, 
  ShieldAlert, 
  Loader2 
} from 'lucide-react';
import { CODE_GS_SCRIPT } from '../services/gasService';
import { generateSingleFileHtml, downloadFile } from '../services/exportService';

interface GasSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  gasUrl: string;
  onSaveGasUrl: (url: string) => Promise<boolean>;
  onTestConnection: (url: string) => Promise<{ success: boolean; message: string; count?: number }>;
}

export const GasSetupModal: React.FC<GasSetupModalProps> = ({
  isOpen,
  onClose,
  gasUrl,
  onSaveGasUrl,
  onTestConnection,
}) => {
  const [urlInput, setUrlInput] = useState<string>(gasUrl);
  const [activeTab, setActiveTab] = useState<'url' | 'code' | 'guide'>('url');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_GS_SCRIPT);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleTest = async () => {
    if (!urlInput.trim()) {
      setTestResult({ success: false, message: 'Lütfen önce geçerli bir URL girin.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(urlInput.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Bağlantı testi başarısız' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveGasUrl(urlInput.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadIndexHtml = () => {
    const html = generateSingleFileHtml(urlInput.trim());
    downloadFile('index.html', html, 'text/html');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div>
            <h2 className="font-bold text-base text-zinc-100 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              GOOGLE APPS SCRIPT ENTEGRASYON VE KURULUM
            </h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-0.5">
              GOOGLE CLOUD API & E-TABLO VERİTABANI BAĞLANTISI
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-zinc-800 px-6 bg-zinc-950/40 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'url'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>1. Web App URL</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>2. Code.gs Betiği</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>3. 4 Adımlı Rehber</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* TAB 1: URL Input & Test */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
                <label className="block font-bold text-zinc-300 text-[10px] uppercase tracking-wider">
                  Google Apps Script Web Uygulaması Dağıtım URL'si
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-100 font-mono outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={isTesting}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider whitespace-nowrap transition flex items-center justify-center gap-2 border border-zinc-700 disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span>TEST EDİLİYOR...</span>
                      </>
                    ) : (
                      <>
                        <span>BAĞLANTIYI TEST ET</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Feedback */}
                {testResult && (
                  <div
                    className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs font-mono ${
                      testResult.success
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800 text-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">{testResult.message}</p>
                      {testResult.count !== undefined && (
                        <p className="text-[11px] opacity-80">
                          E-tablodan toplam {testResult.count} adet kayıt başarıyla okundu.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-wider">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Erişim İzin Ayarı</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    Apps Script'i yayınlarken "Erişimi olanlar" seçeneğini mutlaka{' '}
                    <strong className="text-zinc-200 font-mono">"Herkes (Anyone)"</strong> olarak seçin.
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-[10px] tracking-wider">
                    <Download className="w-3.5 h-3.5" />
                    <span>GitHub Pages Sürümü</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    Bu URL'yi içine gömerek GitHub Pages üzerinde yayınlayabileceğiniz tek dosyalık HTML sürümünü indirebilirsiniz.
                  </p>
                  <button
                    onClick={handleDownloadIndexHtml}
                    className="mt-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>index.html dosyasını indir</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Code.gs */}
          {activeTab === 'code' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-xs">
                  Google Apps Script (Code.gs) kaynak kodu:
                </span>
                <button
                  onClick={handleCopyCode}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>KOPYALANDI!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>KODU KOPYALA</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-96 leading-relaxed">
                  <code>{CODE_GS_SCRIPT}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: 4 Step Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-3">
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs font-mono">1</span>
                  <h4 className="font-bold text-zinc-200 text-xs uppercase">Google E-Tablo Oluşturun</h4>
                </div>
                <p className="text-zinc-400 text-[11px] pl-7">
                  <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline inline-flex items-center gap-1 font-mono">
                    sheets.new <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  adresinden boş bir e-tablo oluşturup adını "Nakit Akış Takibi" yapın.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs font-mono">2</span>
                  <h4 className="font-bold text-zinc-200 text-xs uppercase">Apps Script Kodunu Yapıştırın</h4>
                </div>
                <p className="text-zinc-400 text-[11px] pl-7">
                  E-tablo menüsünden <strong className="text-zinc-300 font-mono">Uzantılar &gt; Apps Script</strong> kısmına tıklayın. Mevcut kodu silip Code.gs sekmesindeki kodu yapıştırıp kaydedin.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs font-mono">3</span>
                  <h4 className="font-bold text-zinc-200 text-xs uppercase">Web Uygulaması Olarak Dağıtın</h4>
                </div>
                <p className="text-zinc-400 text-[11px] pl-7">
                  Sağ üstteki <strong className="text-zinc-300 font-mono">Dağıt &gt; Yeni Dağıtım</strong> butonuna basın. Tür: Web Uygulaması, Erişimi Olanlar: <strong className="text-blue-400 font-mono">Herkes (Anyone)</strong> seçin.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs font-mono">4</span>
                  <h4 className="font-bold text-zinc-200 text-xs uppercase">Web App URL'sini Ekleyin</h4>
                </div>
                <p className="text-zinc-400 text-[11px] pl-7">
                  Dağıtım URL'sini kopyalayıp 1. sekmedeki alana yapıştırın ve "Ayarları Kaydet" butonuna basın.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider transition"
          >
            Kapat
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-blue-900/20"
          >
            <Check className="w-4 h-4" />
            <span>Ayarları Kaydet & Uygula</span>
          </button>
        </div>
      </div>
    </div>
  );
};
