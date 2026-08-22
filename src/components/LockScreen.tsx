import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Delete, 
  Check, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Smartphone
} from 'lucide-react';
import { unlockSession, getStoredPin, setStoredPin } from '../services/securityService';

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingNewPin, setIsSettingNewPin] = useState<boolean>(() => !getStoredPin());

  const storedPin = getStoredPin();

  const handleKeyPress = (num: string) => {
    if (pin.length < 12) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMessage(null);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMessage(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMessage('Lütfen PIN kodunuzu girin.');
      return;
    }

    if (isSettingNewPin) {
      if (pin.length < 4) {
        setErrorMessage('PIN kodu en az 4 haneli olmalıdır.');
        return;
      }
      setStoredPin(pin);
      unlockSession(pin, rememberDevice);
      onUnlock();
      return;
    }

    const success = unlockSession(pin, rememberDevice);
    if (success) {
      onUnlock();
    } else {
      setErrorMessage('Hatalı PIN Kodu! Lütfen tekrar deneyin.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 overflow-y-auto">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>

      <div className="relative w-full max-w-sm bg-zinc-900/90 border border-zinc-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 backdrop-blur-xl">
        {/* Security Shield Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-950">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100 uppercase">
              {isSettingNewPin ? 'Güvenlik PIN Kodu Belirleyin' : 'Cüzdan Analiz Koruması'}
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              {isSettingNewPin 
                ? 'Verilerinizi korumak için 4-6 haneli bir PIN oluşturun' 
                : 'Finansal kayıtlarınıza erişmek için PIN girin'}
            </p>
          </div>
        </div>

        {/* PIN Input Field */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="relative flex items-center">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="PIN Kodunuz"
                autoFocus
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-2xl py-3 px-4 text-center text-xl font-bold font-mono tracking-widest text-zinc-100 placeholder:text-zinc-600 placeholder:font-sans placeholder:tracking-normal placeholder:text-xs outline-none focus:border-blue-500 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 p-2 text-zinc-500 hover:text-zinc-300 transition"
                title={showPin ? 'Gizle' : 'Göster'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium px-1 justify-center animate-shake">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Touch Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-12 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:bg-blue-600 active:text-white border border-zinc-700/60 font-mono text-lg font-bold text-zinc-200 transition flex items-center justify-center select-none"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 font-mono text-xs font-bold text-zinc-400 hover:text-zinc-200 transition flex items-center justify-center uppercase select-none"
            >
              Sil
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 active:bg-blue-600 active:text-white border border-zinc-700/60 font-mono text-lg font-bold text-zinc-200 transition flex items-center justify-center select-none"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 font-mono text-zinc-400 hover:text-zinc-200 transition flex items-center justify-center select-none"
              title="Geri"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Remember Device Checkbox */}
          <label className="flex items-center justify-center gap-2 cursor-pointer pt-1 text-xs text-zinc-400 hover:text-zinc-300 select-none">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
            />
            <span>Bu cihazda beni hatırla</span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-4 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-blue-950 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSettingNewPin ? 'PIN Kaydet & Giriş Yap' : 'Kilidi Aç'}</span>
          </button>
        </form>

        {/* Security Info Footnote */}
        <div className="text-center pt-2 border-t border-zinc-800/80">
          <p className="text-[10px] text-zinc-500">
            🔒 GitHub Pages veya herkese açık bağlantılarda verileriniz PIN olmadan kimse tarafından görülemez.
          </p>
        </div>
      </div>
    </div>
  );
};
