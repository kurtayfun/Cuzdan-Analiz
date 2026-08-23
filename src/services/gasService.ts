import { Transaction, TransactionCategory, QuickTemplate } from '../types';
import { DEFAULT_QUICK_TEMPLATES } from '../components/TemplateManagerModal';

export const CODE_GS_SCRIPT = `// ==========================================
// Google Apps Script (Code.gs)
// Aylık Nakit Akışı ve Birikim Takip Veritabanı
// ==========================================

// 🛡️ GÜVENLİK AYARI (PIN KORUMASI)
// E-tablonuza izinsiz okuma ve yazma yapılmasını engellemek için
// 4-6 haneli bir PIN belirleyin (Örn: "1923" veya "1234").
// Boş bırakırsanız ("") PIN koruması devre dışı kalır.
const SECURITY_PIN = ""; 

function doGet(e) {
  // PIN Güvenlik Doğrulaması
  if (SECURITY_PIN && SECURITY_PIN.trim() !== "") {
    const clientPin = (e && e.parameter && (e.parameter.pin || e.parameter.key)) || "";
    if (String(clientPin).trim() !== String(SECURITY_PIN).trim()) {
      return createJsonResponse({ 
        status: "error", 
        code: "UNAUTHORIZED", 
        message: "Erişim reddedildi: Geçersiz veya eksik Güvenlik PIN Kodu." 
      });
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const displayData = sheet.getDataRange().getDisplayValues();
  
  if (data.length <= 1) {
    return createJsonResponse([]);
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  const displayRows = displayData.slice(1);
  const ssTz = ss.getSpreadsheetTimeZone() || "GMT+3";
  
  const jsonData = rows.map((row, index) => {
    let obj = { rowId: index + 2 };
    headers.forEach((header, i) => {
      if (header === "Tarih") {
        let dateVal = "";
        const displayVal = (displayRows[index] && displayRows[index][i]) ? String(displayRows[index][i]).trim() : "";
        if (displayVal && displayVal.match(/\\d/)) {
          dateVal = displayVal;
        } else if (row[i] instanceof Date) {
          dateVal = Utilities.formatDate(row[i], ssTz, "yyyy-MM-dd");
        } else {
          dateVal = String(row[i] || "").trim();
        }
        
        // 2001 veya 2024 öncesi gelen yılları otomatik 2026'ya eşitle
        if (dateVal) {
          if (dateVal.match(/^(\\d{4})[-/.]/)) {
            let y = parseInt(dateVal.substring(0, 4), 10);
            if (y < 2024) {
              dateVal = "2026" + dateVal.substring(4);
            }
          } else if (dateVal.match(/[-/.](\\d{4})$/)) {
            let parts = dateVal.split(/[-/.]/);
            let y = parseInt(parts[2], 10);
            if (y < 2024) {
              dateVal = parts[0] + "." + parts[1] + ".2026";
            }
          } else if (dateVal.match(/^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{2})$/)) {
            let m = dateVal.match(/^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{2})$/);
            dateVal = m[1] + "." + m[2] + ".2026";
          }
        }
        
        obj[header] = dateVal;
      } else if (header === "Kayıt Tarihi" && row[i] instanceof Date) {
        obj[header] = Utilities.formatDate(row[i], ssTz, "yyyy-MM-dd HH:mm:ss");
      } else {
        obj[header] = row[i];
      }
    });
    return obj;
  });

  return createJsonResponse(jsonData);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      return createJsonResponse({ status: "error", message: "Veri içeriği boş" });
    }

    // PIN Güvenlik Doğrulaması
    if (SECURITY_PIN && SECURITY_PIN.trim() !== "") {
      const clientPin = payload.pin || payload.key || (e && e.parameter && (e.parameter.pin || e.parameter.key)) || "";
      if (String(clientPin).trim() !== String(SECURITY_PIN).trim()) {
        return createJsonResponse({ 
          status: "error", 
          code: "UNAUTHORIZED", 
          message: "Yetkisiz işlem: Güvenlik PIN Kodu hatalı veya eksik." 
        });
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const ssTz = ss.getSpreadsheetTimeZone() || "GMT+3";
    
    // Tablo başlıklarını kontrol et ve gerekirse ekle
    if (sheet.getLastColumn() === 0 || sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "Tarih", "Kategori", "Tutar", "Açıklama", "Kayıt Tarihi"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");
      sheet.getRange("B:B").setNumberFormat("yyyy-mm-dd");
      sheet.getRange("D:D").setNumberFormat("#,##0.00");
    }

    const { action, id, date, category, amount, note } = payload;
    const data = sheet.getDataRange().getValues();

    // Tarihi saat dilimi farkı (UTC vs Yerel Saat) kaynaklı 1 gün geriye kaymayı önlemek için saat 12:00 olarak kaydet
    let entryDate = date;
    if (typeof date === "string" && date.match(/^\\d{4}-\\d{2}-\\d{2}/)) {
      const parts = date.substring(0, 10).split("-");
      let y = parseInt(parts[0], 10);
      if (y < 2024) y = 2026;
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      entryDate = new Date(y, m, d, 12, 0, 0);
    }

    // 1. SİLME İŞLEMİ
    if (action === "delete") {
      const targetId = String(id || "").trim();
      let deleted = false;

      // Öncelikle ID (Sütun A) eşleşmesine bak
      if (targetId) {
        for (let i = 1; i < data.length; i++) {
          const rowId = String(data[i][0] || "").trim();
          if (rowId && rowId === targetId) {
            sheet.deleteRow(i + 1);
            deleted = true;
            return createJsonResponse({ status: "success", message: "Kayıt başarıyla silindi", id: targetId });
          }
        }
      }

      // ID ile bulunamadıysa (örneğin manuel girilmiş veya harici satırlar), Tarih + Kategori + Tutar ile eşleştir
      if (!deleted && (date || amount !== undefined)) {
        for (let i = 1; i < data.length; i++) {
          let rowDate = "";
          if (data[i][1] instanceof Date) {
            rowDate = Utilities.formatDate(data[i][1], ssTz, "yyyy-MM-dd");
          } else {
            rowDate = String(data[i][1] || "").substring(0, 10);
          }
          const rowCat = String(data[i][2] || "").trim();
          const rowAmt = Number(data[i][3]) || 0;
          const targetAmt = Number(amount) || 0;

          const dateMatches = !date || rowDate === String(date).substring(0, 10);
          const catMatches = !category || rowCat.toLowerCase() === String(category).trim().toLowerCase();
          const amtMatches = amount === undefined || Math.abs(rowAmt - targetAmt) < 0.01;

          if (dateMatches && catMatches && amtMatches) {
            sheet.deleteRow(i + 1);
            deleted = true;
            return createJsonResponse({ status: "success", message: "Kayıt detaylarıyla eşleşti ve silindi", row: i + 1 });
          }
        }
      }

      if (!deleted) {
        return createJsonResponse({ status: "error", message: "Silinecek kayıt bulunamadı: " + targetId });
      }
    }

    // 2. GÜNCELLEME İŞLEMİ
    const timestamp = new Date();
    const rowId = id || "ID_" + timestamp.getTime();
    const rowData = [rowId, entryDate, category, Number(amount) || 0, note || "", timestamp];

    if (action === "update" && id) {
      const targetId = String(id).trim();
      for (let i = 1; i < data.length; i++) {
        const currentId = String(data[i][0] || "").trim();
        if (currentId === targetId) {
          sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          return createJsonResponse({ status: "success", message: "Kayıt güncellendi", data: [rowId, date, category, Number(amount) || 0, note || ""] });
        }
      }
    }

    // 3. YENİ KAYIT EKLEME
    sheet.appendRow(rowData);
    return createJsonResponse({ status: "success", message: "Yeni kayıt eklendi", data: [rowId, date, category, Number(amount) || 0, note || ""] });

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

const LOCAL_STORAGE_KEY = 'cashflow_transactions_v2';
const GAS_URL_KEY = 'cashflow_gas_url_v2';

export const INITIAL_SAMPLE_DATA: Transaction[] = [
  {
    id: 'ID_DEMO_1',
    date: '2026-08-01',
    category: 'Sabit Gelir',
    amount: 68000,
    note: 'Ağustos Maaşı',
    createdAt: new Date('2026-08-01T09:00:00').toISOString(),
  },
  {
    id: 'ID_DEMO_2',
    date: '2026-08-02',
    category: 'Transfer Gideri',
    amount: 19500,
    note: 'Kira & Aidat Ödemesi',
    createdAt: new Date('2026-08-02T10:30:00').toISOString(),
  },
  {
    id: 'ID_DEMO_3',
    date: '2026-08-05',
    category: 'Kart Ekstresi',
    amount: 21400,
    note: 'Bonus Kart Aylık Ekstre',
    createdAt: new Date('2026-08-05T14:15:00').toISOString(),
  },
  {
    id: 'ID_DEMO_4',
    date: '2026-08-08',
    category: 'Nakit Çekim',
    amount: 4000,
    note: 'ATM Haftalık Harçlık & Pazar',
    createdAt: new Date('2026-08-08T18:00:00').toISOString(),
  },
  {
    id: 'ID_DEMO_5',
    date: '2026-08-15',
    category: 'Nakit Çekim',
    amount: 3500,
    note: 'ATM Nakit İhtiyaç',
    createdAt: new Date('2026-08-15T11:20:00').toISOString(),
  },
  {
    id: 'ID_DEMO_6',
    date: '2026-08-16',
    category: 'Ek Gelir',
    amount: 8500,
    note: 'Serbest Çalışma & Danışmanlık',
    createdAt: new Date('2026-08-16T16:00:00').toISOString(),
  },
  // Previous month data for comparison
  {
    id: 'ID_DEMO_7',
    date: '2026-07-01',
    category: 'Sabit Gelir',
    amount: 68000,
    note: 'Temmuz Maaşı',
    createdAt: new Date('2026-07-01T09:00:00').toISOString(),
  },
  {
    id: 'ID_DEMO_8',
    date: '2026-07-03',
    category: 'Transfer Gideri',
    amount: 19500,
    note: 'Kira & Aidat',
    createdAt: new Date('2026-07-03T10:00:00').toISOString(),
  },
  {
    id: 'ID_DEMO_9',
    date: '2026-07-07',
    category: 'Kart Ekstresi',
    amount: 26800,
    note: 'Kredi Kartı Ekstresi (Tatil harcaması)',
    createdAt: new Date('2026-07-07T12:00:00').toISOString(),
  },
  {
    id: 'ID_DEMO_10',
    date: '2026-07-12',
    category: 'Nakit Çekim',
    amount: 6000,
    note: 'Nakit Çekim',
    createdAt: new Date('2026-07-12T15:00:00').toISOString(),
  },
];

export function getStoredGasUrl(): string {
  try {
    return localStorage.getItem(GAS_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredGasUrl(url: string): void {
  try {
    localStorage.setItem(GAS_URL_KEY, url.trim());
  } catch (err) {
    console.error('Failed to save GAS URL to localStorage', err);
  }
}

export function loadLocalTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // First time initialization
      saveLocalTransactions(INITIAL_SAMPLE_DATA);
      return INITIAL_SAMPLE_DATA;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const normalized = parsed.map((item: any) => ({
        id: String(item.id || item.ID || item.rowId || 'ID_' + Math.random().toString(36).substring(2, 9)),
        date: normalizeDateToYMD(item.date || item.Tarih || item.tarih),
        category: (item.category || item.Kategori || 'Diğer Gider') as any,
        amount: Number(item.amount || item.Tutar) || 0,
        note: String(item.note || item.Açıklama || ''),
        createdAt: item.createdAt || item['Kayıt Tarihi'] || undefined,
      }));
      saveLocalTransactions(normalized);
      return normalized;
    }
    return INITIAL_SAMPLE_DATA;
  } catch {
    return INITIAL_SAMPLE_DATA;
  }
}

const TEMPLATES_STORAGE_KEY = 'cashflow_templates_v2';

export function loadLocalTemplates(): QuickTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_QUICK_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_QUICK_TEMPLATES;
  } catch {
    return DEFAULT_QUICK_TEMPLATES;
  }
}

export function saveLocalTemplates(templates: QuickTemplate[]): void {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save templates to localStorage', err);
  }
}

export function saveLocalTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage', err);
  }
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const TURKISH_MONTHS_MAP: Record<string, string> = {
  'ocak': '01', 'oca': '01', 'january': '01', 'jan': '01', '1': '01', '01': '01',
  'şubat': '02', 'subat': '02', 'şub': '02', 'sub': '02', 'february': '02', 'feb': '02', '2': '02', '02': '02',
  'mart': '03', 'mar': '03', 'march': '03', '3': '03', '03': '03',
  'nisan': '04', 'nis': '04', 'april': '04', 'apr': '04', '4': '04', '04': '04',
  'mayıs': '05', 'mayis': '05', 'may': '05', '5': '05', '05': '05',
  'haziran': '06', 'haz': '06', 'june': '06', 'jun': '06', '6': '06', '06': '06',
  'temmuz': '07', 'tem': '07', 'july': '07', 'jul': '07', '7': '07', '07': '07',
  'ağustos': '08', 'agustos': '08', 'ağu': '08', 'agu': '08', 'august': '08', 'aug': '08', '8': '08', '08': '08',
  'eylül': '09', 'eylul': '09', 'eyl': '09', 'september': '09', 'sep': '09', '9': '09', '09': '09',
  'ekim': '10', 'eki': '10', 'october': '10', 'oct': '10', '10': '10',
  'kasım': '11', 'kasim': '11', 'kas': '11', 'november': '11', 'nov': '11', '11': '11',
  'aralık': '12', 'aralik': '12', 'ara': '12', 'december': '12', 'dec': '12', '12': '12'
};

// Helper to robustly extract 'YYYY-MM-DD' from whatever Google Sheets or JSON returns
export function normalizeDateToYMD(rawDate: any): string {
  if (rawDate === null || rawDate === undefined || rawDate === '') {
    return getLocalDateString();
  }

  // Base target year for modern entries (at least 2026)
  const currentYear = Math.max(new Date().getFullYear(), 2026);

  // Helper to repair year and format as YYYY-MM-DD
  const sanitizeYearMonthDay = (rawY: number, rawM: number, rawD: number): string => {
    let y = Number(rawY) || currentYear;
    let m = Number(rawM) || 1;
    let d = Number(rawD) || 1;

    // 2024 yılından küçük (özellikle 2001) veya geçersiz tüm yıllar kesin olarak 2026'ya dönüştürülür
    if (y < 2024 || isNaN(y)) {
      y = currentYear;
    }

    m = Math.min(Math.max(1, m), 12);
    d = Math.min(Math.max(1, d), 31);

    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // 1. Native Date object
  if (rawDate instanceof Date) {
    if (!isNaN(rawDate.getTime())) {
      return sanitizeYearMonthDay(rawDate.getFullYear(), rawDate.getMonth() + 1, rawDate.getDate());
    }
  }

  // 2. Google Sheets / Excel date serial number (e.g. 45525 or numeric value)
  if (typeof rawDate === 'number' || (typeof rawDate === 'string' && /^\d{4,6}(\.\d+)?$/.test(rawDate.trim()))) {
    const num = Number(rawDate);
    if (!isNaN(num) && num > 10000 && num < 90000) {
      const dt = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(dt.getTime())) {
        return sanitizeYearMonthDay(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
      }
    }
  }

  const str = String(rawDate).trim();
  if (!str) return getLocalDateString();

  // 3. Standalone Month Name (e.g. "Mart", "mart", "Ağustos", "Nisan", "Ocak")
  const singleWord = str.toLowerCase().trim();
  const cleanSingleWord = singleWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (TURKISH_MONTHS_MAP[singleWord] || TURKISH_MONTHS_MAP[cleanSingleWord]) {
    const monthNum = TURKISH_MONTHS_MAP[singleWord] || TURKISH_MONTHS_MAP[cleanSingleWord];
    return `${currentYear}-${monthNum}-01`;
  }

  // 4. ISO format "YYYY-MM-DD..." (e.g. "2026-08-15" or "2001-08-23" or "2026-08-15T12:00:00.000Z")
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    return sanitizeYearMonthDay(y, m, d);
  }

  // 5. Turkish / English text date format with year e.g. "23 Ağustos 2026", "23 Ağustos 2001", "15-Ağu-2026", "23.Ağustos.26", "Mart 2026"
  const textDateMatch = str.match(/^(\d{1,2})?[\s./-]+([a-zA-ZçğıöşüÇĞİÖŞÜ]+)[\s./-]+(\d{2,4})/i);
  if (textDateMatch) {
    const day = parseInt(textDateMatch[1] || '1', 10);
    const monthWord = textDateMatch[2].toLowerCase().trim();
    let yearStr = textDateMatch[3];
    if (yearStr.length === 2) yearStr = '20' + yearStr;
    const year = parseInt(yearStr, 10);
    const cleanWord = monthWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const monthNum = parseInt(TURKISH_MONTHS_MAP[monthWord] || TURKISH_MONTHS_MAP[cleanWord] || '1', 10);
    return sanitizeYearMonthDay(year, monthNum, day);
  }

  // 6. Text date WITHOUT year e.g. "23 Ağustos", "15-Ağu", "15 Ağu"
  const textDateNoYearMatch = str.match(/^(\d{1,2})[\s./-]+([a-zA-ZçğıöşüÇĞİÖŞÜ]+)$/i);
  if (textDateNoYearMatch) {
    const day = parseInt(textDateNoYearMatch[1], 10);
    const monthWord = textDateNoYearMatch[2].toLowerCase().trim();
    const cleanWord = monthWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const monthNum = parseInt(TURKISH_MONTHS_MAP[monthWord] || TURKISH_MONTHS_MAP[cleanWord] || '1', 10);
    return sanitizeYearMonthDay(currentYear, monthNum, day);
  }

  // 7. Month name + year e.g. "Ağustos 2026", "Mart 2001", "Ağustos-2026", "Mart/26"
  const monthTextYearMatch = str.match(/^([a-zA-ZçğıöşüÇĞİÖŞÜ]+)[\s./-]+(\d{2,4})$/i);
  if (monthTextYearMatch) {
    const monthWord = monthTextYearMatch[1].toLowerCase().trim();
    let yearStr = monthTextYearMatch[2];
    if (yearStr.length === 2) yearStr = '20' + yearStr;
    const year = parseInt(yearStr, 10);
    const cleanWord = monthWord.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const monthNum = parseInt(TURKISH_MONTHS_MAP[monthWord] || TURKISH_MONTHS_MAP[cleanWord] || '1', 10);
    return sanitizeYearMonthDay(year, monthNum, 1);
  }

  // 8. 3-part numeric date: "DD.MM.YYYY", "DD/MM/YYYY", "DD-MM-YYYY", "DD.MM.YY", "YYYY-MM-DD"
  const num3Match = str.match(/^(\d{1,4})[-/.](\d{1,2})[-/.](\d{1,4})/);
  if (num3Match) {
    const p1 = parseInt(num3Match[1], 10);
    const p2 = parseInt(num3Match[2], 10);
    const p3 = parseInt(num3Match[3], 10);

    if (p1 >= 1000) {
      // YYYY-MM-DD
      return sanitizeYearMonthDay(p1, p2, p3);
    } else if (p3 >= 1000) {
      // DD-MM-YYYY or MM-DD-YYYY
      if (p2 > 12 && p1 <= 12) {
        return sanitizeYearMonthDay(p3, p1, p2);
      } else {
        return sanitizeYearMonthDay(p3, p2, p1);
      }
    } else {
      // 2-digit years e.g. 23.08.26 or 01.08.26 or 26.08.01
      if (p1 > 12) {
        // p1 is definitely Day
        const y2 = p3 < 100 ? (p3 < 50 ? 2000 + p3 : 1900 + p3) : p3;
        return sanitizeYearMonthDay(y2, p2, p1);
      } else if (p2 > 12) {
        // US style MM.DD.YY
        const y2 = p3 < 100 ? (p3 < 50 ? 2000 + p3 : 1900 + p3) : p3;
        return sanitizeYearMonthDay(y2, p1, p2);
      } else if (p3 === 26 || p3 === 2026) {
        // Standard Turkish DD.MM.YY (e.g. 01.08.26 -> Day 1, Month 8, Year 2026)
        return sanitizeYearMonthDay(2026, p2, p1);
      } else if (p1 === 26 || p1 === 2026) {
        // YY.MM.DD (e.g. 26.08.01 -> Year 2026, Month 8, Day 1)
        return sanitizeYearMonthDay(2026, p2, p3);
      } else {
        const y2 = p3 < 100 ? (p3 < 50 ? 2000 + p3 : 1900 + p3) : p3;
        return sanitizeYearMonthDay(y2, p2, p1);
      }
    }
  }

  // 9. Numeric Day + Month WITHOUT year e.g. "15.08", "15/08", "15-08"
  const dayMonthMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (dayMonthMatch) {
    const part1 = parseInt(dayMonthMatch[1], 10);
    const part2 = parseInt(dayMonthMatch[2], 10);
    let day = part1;
    let month = part2;
    if (part1 <= 12 && part2 > 12) {
      month = part1;
      day = part2;
    }
    return sanitizeYearMonthDay(currentYear, month, day);
  }

  // 10. Year-Month only e.g. "2026-08", "08-2026", "2001-08"
  const ymMatch1 = str.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (ymMatch1) {
    const y = parseInt(ymMatch1[1], 10);
    const m = parseInt(ymMatch1[2], 10);
    return sanitizeYearMonthDay(y, m, 1);
  }
  const ymMatch2 = str.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (ymMatch2) {
    const m = parseInt(ymMatch2[1], 10);
    const y = parseInt(ymMatch2[2], 10);
    return sanitizeYearMonthDay(y, m, 1);
  }

  // 11. Fallback: Native Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return sanitizeYearMonthDay(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  const rawRes = str.substring(0, 10) || getLocalDateString();
  if (/^\d{4}/.test(rawRes)) {
    const y = parseInt(rawRes.substring(0, 4), 10);
    if (y < 2024) {
      return '2026' + rawRes.substring(4);
    }
  }
  return rawRes;
}

// Helper to extract 'YYYY-MM' month key from any date format
export function extractMonthKey(rawDate: any): string {
  if (!rawDate) return '';
  if (rawDate === 'all') return 'all';
  const str = String(rawDate).trim();
  if (str === 'all') return 'all';

  const ymd = normalizeDateToYMD(rawDate);
  if (ymd && ymd.length >= 7) {
    const match = ymd.match(/^(\d{4}-\d{2})/);
    if (match) return match[1];
    return ymd.substring(0, 7);
  }
  return '';
}

// Helper to check if a transaction belongs to a given month
export function isSameMonth(txDate: any, targetMonth: string): boolean {
  if (!targetMonth || targetMonth === 'all') return true;
  if (!txDate) return false;

  const txKey = extractMonthKey(txDate);
  const targetKey = extractMonthKey(targetMonth) || targetMonth;

  if (txKey && targetKey && txKey === targetKey) {
    return true;
  }

  // Also check month portion matching (e.g. if target is "2026-08" and txKey is "2026-08")
  if (txKey.includes('-') && targetKey.includes('-')) {
    const [, txM] = txKey.split('-');
    const [, targetM] = targetKey.split('-');
    if (txM === targetM) {
      return true;
    }
  }

  const normalized = normalizeDateToYMD(txDate);
  if (normalized.startsWith(targetKey)) {
    return true;
  }

  return false;
}

// Helper to find value from object matching multiple possible key names case-insensitively
function getObjectValue(item: any, possibleKeys: string[]): any {
  if (!item || typeof item !== 'object') return undefined;
  
  // 1. Direct match
  for (const k of possibleKeys) {
    if (item[k] !== undefined && item[k] !== null && item[k] !== '') {
      return item[k];
    }
  }

  // 2. Normalized match
  const itemKeys = Object.keys(item);
  for (const target of possibleKeys) {
    const targetClean = target.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '');
    for (const actualKey of itemKeys) {
      const actualClean = actualKey.toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '');
      if (actualClean === targetClean) {
        if (item[actualKey] !== undefined && item[actualKey] !== null && item[actualKey] !== '') {
          return item[actualKey];
        }
      }
    }
  }
  return undefined;
}

/**
 * Fetch data from Google Apps Script Web App URL.
 */
export async function fetchFromGas(url: string, pin?: string): Promise<Transaction[]> {
  if (!url || !url.startsWith('http')) {
    throw new Error('Geçerli bir Google Apps Script URL\'si belirtilmedi.');
  }

  let requestUrl = url;
  if (pin && pin.trim()) {
    const sep = requestUrl.includes('?') ? '&' : '?';
    requestUrl = `${requestUrl}${sep}pin=${encodeURIComponent(pin.trim())}`;
  }

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script isteği başarısız oldu (Durum: ${response.status})`);
  }

  const data = await response.json();

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (data.code === 'UNAUTHORIZED' || (data.status === 'error' && String(data.message).includes('PIN'))) {
      throw new Error('E-Tablo Güvenlik PIN Kodu hatalı veya eksik. Lütfen doğru PIN kodunu girin.');
    }
    if (data.status === 'error') {
      throw new Error(`Google Sheets Hatası: ${data.message || 'Bilinmeyen hata'}`);
    }
    throw new Error('E-Tablodan beklenmeyen veri formatı döndü.');
  }

  if (!Array.isArray(data)) {
    throw new Error('E-Tablodan liste formatında veri alınamadı.');
  }

  // Parse Google Sheets rows into Transaction objects safely
  const transactions: Transaction[] = data.map((item: any, idx: number) => {
    const rawDate = getObjectValue(item, ['Tarih', 'tarih', 'TARİH', 'date', 'Date', 'İşlem Tarihi', 'islem_tarihi', 'Tarih ']);
    const rawCategory = getObjectValue(item, ['Kategori', 'kategori', 'KAT', 'category', 'Category', 'Tür', 'tur', 'Kategori ']);
    const rawAmount = getObjectValue(item, ['Tutar', 'tutar', 'TUTAR', 'amount', 'Amount', 'Fiyat', 'Bedel', 'Tutar ']);
    const rawNote = getObjectValue(item, ['Açıklama', 'aciklama', 'AÇIKLAMA', 'note', 'Note', 'description', 'Detay', 'Açıklama ']);
    const rawId = getObjectValue(item, ['ID', 'id', 'Id', 'rowId', 'ID_NO', 'No', 'ID ']);
    const rawCreatedAt = getObjectValue(item, ['Kayıt Tarihi', 'kayit_tarihi', 'createdAt', 'timestamp', 'Kayıt Tarihi ']);

    // Amount cleaning: handle Turkish formats "1.250,50" or "1250,50" or numbers
    let cleanAmount = 0;
    if (typeof rawAmount === 'number') {
      cleanAmount = isNaN(rawAmount) ? 0 : rawAmount;
    } else if (typeof rawAmount === 'string') {
      let cleanStr = rawAmount.trim().replace(/[^0-9.,-]/g, '');
      if (cleanStr.includes(',') && cleanStr.includes('.')) {
        if (cleanStr.indexOf('.') < cleanStr.indexOf(',')) {
          cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
        } else {
          cleanStr = cleanStr.replace(/,/g, '');
        }
      } else if (cleanStr.includes(',')) {
        cleanStr = cleanStr.replace(',', '.');
      }
      cleanAmount = parseFloat(cleanStr) || 0;
    }

    // Category cleaning & normalization
    let category: TransactionCategory = 'Diğer Gider';
    if (rawCategory) {
      const catStr = String(rawCategory).trim().toLowerCase();
      if (catStr.includes('sabit') || catStr === 'maaş' || catStr === 'maas' || (catStr.includes('gelir') && !catStr.includes('ek'))) {
        category = 'Sabit Gelir';
      } else if (catStr.includes('ek') || catStr.includes('prim') || catStr.includes('ek gelir')) {
        category = 'Ek Gelir';
      } else if (catStr.includes('kart') || catStr.includes('ekstre') || catStr.includes('kredi')) {
        category = 'Kart Ekstresi';
      } else if (catStr.includes('transfer') || catStr.includes('eft') || catStr.includes('havale') || catStr.includes('kira')) {
        category = 'Transfer Gideri';
      } else if (catStr.includes('nakit') || catStr.includes('atm') || catStr.includes('cekim') || catStr.includes('çekim')) {
        category = 'Nakit Çekim';
      } else if (catStr.includes('diğer') || catStr.includes('diger') || catStr.includes('gider')) {
        category = 'Diğer Gider';
      } else if (['Sabit Gelir', 'Ek Gelir', 'Kart Ekstresi', 'Transfer Gideri', 'Nakit Çekim', 'Diğer Gider'].includes(rawCategory)) {
        category = rawCategory;
      }
    }

    const normalizedDate = normalizeDateToYMD(rawDate);

    return {
      id: String(rawId || `ID_${Date.now()}_${idx}`),
      date: normalizedDate,
      category,
      amount: cleanAmount,
      note: String(rawNote || ''),
      createdAt: rawCreatedAt ? String(rawCreatedAt) : undefined,
    };
  });

  return transactions;
}

/**
 * Send insert/update/delete command to Google Apps Script.
 */
export async function postToGas(
  url: string,
  payload: {
    action: 'insert' | 'update' | 'delete';
    id?: string;
    date?: string;
    category?: string;
    amount?: number;
    note?: string;
    pin?: string;
  },
  pin?: string
): Promise<{ success: boolean; message: string }> {
  if (!url || !url.startsWith('http')) {
    return { success: false, message: 'Google Apps Script URL ayarlanmamış.' };
  }

  try {
    const finalPayload = {
      ...payload,
      pin: payload.pin || (pin && pin.trim() ? pin.trim() : undefined),
    };

    // Try standard fetch
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Standard workaround for Google Apps Script Web App redirects
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    return { success: true, message: 'İşlem Google Sheets veritabanına iletildi.' };
  } catch (err: any) {
    console.error('GAS POST Error:', err);
    return { success: false, message: err.message || 'Google Sheets gönderim hatası' };
  }
}
