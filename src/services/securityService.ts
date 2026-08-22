export const PIN_STORAGE_KEY = 'cashflow_security_pin_v2';
export const PIN_ENABLED_KEY = 'cashflow_pin_enabled_v2';
export const REMEMBER_DEVICE_KEY = 'cashflow_remember_device_v2';
export const SESSION_UNLOCKED_KEY = 'cashflow_session_unlocked_v2';

export function getStoredPin(): string {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredPin(pin: string): void {
  try {
    if (pin && pin.trim()) {
      localStorage.setItem(PIN_STORAGE_KEY, pin.trim());
      localStorage.setItem(PIN_ENABLED_KEY, 'true');
    } else {
      localStorage.removeItem(PIN_STORAGE_KEY);
      localStorage.setItem(PIN_ENABLED_KEY, 'false');
    }
  } catch (err) {
    console.error('Failed to save security PIN', err);
  }
}

export function isPinProtectionEnabled(): boolean {
  try {
    const enabled = localStorage.getItem(PIN_ENABLED_KEY);
    const pin = localStorage.getItem(PIN_STORAGE_KEY);
    return enabled === 'true' && Boolean(pin && pin.trim());
  } catch {
    return false;
  }
}

export function setPinProtectionEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(PIN_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set PIN protection', err);
  }
}

export function isRememberDeviceEnabled(): boolean {
  try {
    return localStorage.getItem(REMEMBER_DEVICE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setRememberDeviceEnabled(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_DEVICE_KEY, remember ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set remember device', err);
  }
}

export function isSessionUnlocked(): boolean {
  try {
    // If PIN protection is not enabled, it's always unlocked
    if (!isPinProtectionEnabled()) {
      return true;
    }

    // Check if device is remembered
    if (isRememberDeviceEnabled()) {
      const rememberedUnlocked = localStorage.getItem(SESSION_UNLOCKED_KEY);
      if (rememberedUnlocked === 'true') {
        return true;
      }
    }

    // Check sessionStorage for current browser tab
    return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function unlockSession(pin: string, rememberDevice: boolean = false): boolean {
  const storedPin = getStoredPin();
  
  // If no PIN set, allow unlock and optionally save this new PIN
  if (!storedPin) {
    if (pin && pin.trim()) {
      setStoredPin(pin.trim());
    }
    setRememberDeviceEnabled(rememberDevice);
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
    if (rememberDevice) {
      localStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
    }
    return true;
  }

  // Validate PIN match
  if (pin.trim() === storedPin.trim()) {
    setRememberDeviceEnabled(rememberDevice);
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
    if (rememberDevice) {
      localStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
    } else {
      localStorage.removeItem(SESSION_UNLOCKED_KEY);
    }
    return true;
  }

  return false;
}

export function lockSession(): void {
  try {
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
    localStorage.removeItem(SESSION_UNLOCKED_KEY);
  } catch (err) {
    console.error('Failed to lock session', err);
  }
}
