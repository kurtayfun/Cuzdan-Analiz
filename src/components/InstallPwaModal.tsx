import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Share, 
  PlusSquare, 
  Download, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('ios');

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setActiveTab('ios');
    } else {
      setActiveTab('android');
    }

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-zinc-100 uppercase tracking-tight">
                TELEFONA UYGULAMA OLARAK YÜKLE
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono">
                PROGRESSIVE WEB APP (PWA) KURULUM REHBERİ
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
          {/* Quick 1-Click Install if browser supports it */}
          {deferredPrompt && (
            <div className="bg-gradient-to-r from-blue-950/40 to-emerald-950/40 border border-blue-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white block text-xs">Doğrudan Yüklemeye Hazır</span>
                <span className="text-[11px] text-zinc-400">Tek dokunuşla ana ekranınıza ekleyin.</span>
              </div>
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-blue-950 flex items-center justify-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Şimdi Yükle</span>
              </button>
            </div>
          )}

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl text-center space-y-1">
              <Zap className="w-4 h-4 text-emerald-400 mx-auto" />
              <div className="font-bold text-[11px] text-zinc-200">Tek Dokunuş</div>
              <div className="text-[10px] text-zinc-500">Tarayıcı çubuğu olmadan tam ekran</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl text-center space-y-1">
              <Shield className="w-4 h-4 text-blue-400 mx-auto" />
              <div className="font-bold text-[11px] text-zinc-200">PIN Korumalı</div>
              <div className="text-[10px] text-zinc-500">Sadece siz açıp görebilirsiniz</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800/80 p-3 rounded-xl text-center space-y-1">
              <Globe className="w-4 h-4 text-purple-400 mx-auto" />
              <div className="font-bold text-[11px] text-zinc-200">Hızlı & Hafif</div>
              <div className="text-[10px] text-zinc-500">App Store gerektirmez</div>
            </div>
          </div>

          {/* Platform Tabs */}
          <div className="space-y-3">
            <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl text-xs font-bold uppercase">
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2 rounded-lg transition text-center ${
                  activeTab === 'ios'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🍎 iPhone / iPad (Safari)
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2 rounded-lg transition text-center ${
                  activeTab === 'android'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🤖 Android (Chrome)
              </button>
              <button
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-2 rounded-lg transition text-center ${
                  activeTab === 'desktop'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                💻 Bilgisayar
              </button>
            </div>

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-blue-400 shrink-0">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200">Safari Tarayıcısında Açın</p>
                    <p className="text-[11px] text-zinc-400">GitHub Pages adresinizi veya tek dosya index.html bağlantınızı iPhone Safari'de açın.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-blue-400 shrink-0">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <span>"Paylaş" Butonuna Basın</span>
                      <Share className="w-3.5 h-3.5 text-blue-400 inline" />
                    </p>
                    <p className="text-[11px] text-zinc-400">Safari'nin alt menü çubuğunda bulunan ortadaki Paylaş simgesine dokunun.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-blue-400 shrink-0">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200 flex items-center gap-1.5">
                      <span>"Ana Ekrana Ekle" Seçeneğine Dokunun</span>
                      <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />
                    </p>
                    <p className="text-[11px] text-zinc-400">Menüyü biraz aşağı kaydırıp "Ana Ekrana Ekle" (Add to Home Screen) butonuna ve ardından sağ üstteki "Ekle"ye basın.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-emerald-400 shrink-0">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200">Chrome Tarayıcısında Açın</p>
                    <p className="text-[11px] text-zinc-400">Sayfayı Google Chrome mobil tarayıcısında ziyaret edin.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-emerald-400 shrink-0">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200">Sağ Üstteki Üç Noktaya (⋮) Dokunun</p>
                    <p className="text-[11px] text-zinc-400">Chrome menüsünü açın.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-emerald-400 shrink-0">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200">"Uygulamayı Yükle" veya "Ana Ekrana Ekle"yi Seçin</p>
                    <p className="text-[11px] text-zinc-400">Telefonunuzun ana ekranında bağımsız bir uygulama ikonu belirecektir.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Instructions */}
            {activeTab === 'desktop' && (
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3">
                <p className="text-[11px] text-zinc-300">
                  Google Chrome, Microsoft Edge veya Brave kullanıyorsanız, adres çubuğunun sağ tarafındaki <strong>"Uygulamayı Yükle (Install)"</strong> ikonuna tıklayarak masaüstü uygulaması olarak kullanabilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
