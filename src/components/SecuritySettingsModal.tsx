import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Lock, 
  Unlock, 
  Check, 
  Copy, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Smartphone,
  Info
} from 'lucide-react';
import { 
  getStoredPin, 
  setStoredPin, 
  isPinProtectionEnabled, 
  setPinProtectionEnabled, 
  lockSession,
  isRememberDeviceEnabled,
  setRememberDeviceEnabled
} from '../services/securityService';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockNow: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  onLockNow,
  onShowToast,
}) => {
  const [currentPin, setCurrentPin] = useState<string>(() => getStoredPin());
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState<boolean>(() => isPinProtectionEnabled());
  const [rememberDevice, setRememberDevice] = useState<boolean>(() => isRememberDeviceEnabled());
  const [showPin, setShowPin] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim()) {
      onShowToast('Lütfen geçerli bir PIN kodu girin.', 'error');
      return;
    }
    if (newPin.length < 4) {
      onShowToast('PIN kodu en az 4 basamaklı olmalıdır.', 'error');
      return;
    }
    if (newPin !== confirmPin) {
      onShowToast('Girdiğiniz yeni PIN kodları birbiriyle eşleşmiyor.', 'error');
      return;
    }

    setStoredPin(newPin.trim());
    setCurrentPin(newPin.trim());
    setIsEnabled(true);
    setNewPin('');
    setConfirmPin('');
    onShowToast('Güvenlik PIN kodu başarıyla güncellendi!');
  };

  const handleToggleProtection = (checked: boolean) => {
    if (checked && !currentPin) {
      onShowToast('Korumayı açmadan önce lütfen aşağıdan bir PIN kodu belirleyin.', 'info');
      return;
    }
    setIsEnabled(checked);
    setPinProtectionEnabled(checked);
    onShowToast(checked ? 'PIN koruması etkinleştirildi.' : 'PIN koruması kapatıldı.', checked ? 'success' : 'info');
  };

  const handleToggleRemember = (checked: boolean) => {
    setRememberDevice(checked);
    setRememberDeviceEnabled(checked);
  };

  const handleCopyCodeSnippet = () => {
    const snippet = `const SECURITY_PIN = "${currentPin || '1234'}";`;
    navigator.clipboard.writeText(snippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
    onShowToast('Code.gs PIN satırı kopyalandı!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-zinc-100 uppercase tracking-tight">
                GÜVENLİK VE PIN KORUMASI
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono">
                GITHUB PUBLIC VE DIŞ ERİŞİM KORUMA AYARLARI
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status & Toggle */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-zinc-200 block text-xs">PIN Koruması Durumu</span>
                <span className="text-[11px] text-zinc-500">
                  {isEnabled ? 'Uygulama ve E-Tablo verileri PIN ile kilitli' : 'PIN koruması kapalı (herkese açık)'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => handleToggleProtection(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {currentPin && (
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-mono">Mevcut Kayıtlı PIN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-zinc-200 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    {showPin ? currentPin : '••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Set / Change PIN Form */}
          <form onSubmit={handleSavePin} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-wider font-mono">
                {currentPin ? 'PIN Kodunu Değiştir' : 'Yeni Güvenlik PIN Kodu Belirle'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  Yeni PIN (4-8 Hane)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={12}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Örn: 1923"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  Yeni PIN Tekrar
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={12}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Tekrar girin"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-zinc-100 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition"
              >
                PIN Kaydet
              </button>
            </div>
          </form>

          {/* Google Apps Script Sync Hint */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>Google Apps Script (Code.gs) Güvenlik Ayarı</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Google E-Tablonuzun internete tamamen açık olmaması için, Google Apps Script betiğinizin 
              en üstündeki <code className="bg-zinc-900 text-blue-300 px-1 py-0.5 rounded font-mono">SECURITY_PIN</code> alanına da aynı PIN kodunu yazmalısınız:
            </p>
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg font-mono text-[11px] text-zinc-200">
              <code>const SECURITY_PIN = "{currentPin || '1923'}";</code>
              <button
                type="button"
                onClick={handleCopyCodeSnippet}
                className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition flex items-center gap-1"
                title="Kopyala"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Device options */}
          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => handleToggleRemember(e.target.checked)}
                className="rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
              />
              <span>Bu cihazda beni hatırla (Her açılışta PIN sormaz)</span>
            </label>

            <button
              type="button"
              onClick={() => {
                onLockNow();
                onClose();
              }}
              className="bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 text-[11px] font-bold uppercase tracking-wider transition flex items-center gap-1.5"
            >
              <Lock className="w-3 h-3" />
              <span>Şimdi Kilitle</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-zinc-800 bg-zinc-950">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
