import { Transaction } from '../types';

export const CODE_GS_SCRIPT = `// ==========================================
// Google Apps Script (Code.gs)
// Aylık Nakit Akışı ve Birikim Takip Veritabanı
// ==========================================

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return createJsonResponse([]);
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  const jsonData = rows.map((row, index) => {
    let obj = { rowId: index + 2 };
    headers.forEach((header, i) => {
      // Tarih formatını standart YYYY-MM-DD stringine çevir
      if (header === "Tarih" && row[i] instanceof Date) {
        obj[header] = Utilities.formatDate(row[i], Session.getScriptTimeZone() || "GMT+3", "yyyy-MM-dd");
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Tablo başlıklarını kontrol et ve gerekirse ekle
    if (sheet.getLastColumn() === 0 || sheet.getLastRow() === 0) {
      sheet.appendRow(["ID", "Tarih", "Kategori", "Tutar", "Açıklama", "Kayıt Tarihi"]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");
    }
    
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

    const { action, id, date, category, amount, note } = payload;
    const data = sheet.getDataRange().getValues();

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
            rowDate = Utilities.formatDate(data[i][1], Session.getScriptTimeZone() || "GMT+3", "yyyy-MM-dd");
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
    const rowData = [rowId, date, category, Number(amount) || 0, note || "", timestamp];

    if (action === "update" && id) {
      const targetId = String(id).trim();
      for (let i = 1; i < data.length; i++) {
        const currentId = String(data[i][0] || "").trim();
        if (currentId === targetId) {
          sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
          return createJsonResponse({ status: "success", message: "Kayıt güncellendi", data: rowData });
        }
      }
    }

    // 3. YENİ KAYIT EKLEME
    sheet.appendRow(rowData);
    return createJsonResponse({ status: "success", message: "Yeni kayıt eklendi", data: rowData });

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
      return parsed;
    }
    return INITIAL_SAMPLE_DATA;
  } catch {
    return INITIAL_SAMPLE_DATA;
  }
}

export function saveLocalTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions to localStorage', err);
  }
}

/**
 * Fetch data from Google Apps Script Web App URL.
 */
export async function fetchFromGas(url: string): Promise<Transaction[]> {
  if (!url || !url.startsWith('http')) {
    throw new Error('Geçerli bir Google Apps Script URL\'si belirtilmedi.');
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Google Apps Script isteği başarısız oldu (Durum: ${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('E-Tablodan beklenmeyen veri formatı döndü.');
  }

  // Parse Google Sheets rows into Transaction objects
  const transactions: Transaction[] = data.map((item: any) => {
    let dateStr = '';
    if (item.Tarih) {
      if (typeof item.Tarih === 'string') {
        dateStr = item.Tarih.substring(0, 10);
      } else {
        const d = new Date(item.Tarih);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().substring(0, 10);
        }
      }
    }

    return {
      id: String(item.ID || item.rowId || 'ID_' + Math.random().toString(36).substring(2, 9)),
      date: dateStr || new Date().toISOString().substring(0, 10),
      category: (item.Kategori as any) || 'Diğer Gider',
      amount: Number(item.Tutar) || 0,
      note: String(item.Açıklama || ''),
      createdAt: item['Kayıt Tarihi'] ? String(item['Kayıt Tarihi']) : undefined,
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
  }
): Promise<{ success: boolean; message: string }> {
  if (!url || !url.startsWith('http')) {
    return { success: false, message: 'Google Apps Script URL ayarlanmamış.' };
  }

  try {
    // Try standard fetch first
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Standard workaround for Google Apps Script Web App redirects
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return { success: true, message: 'İşlem Google Sheets veritabanına iletildi.' };
  } catch (err: any) {
    console.error('GAS POST Error:', err);
    return { success: false, message: err.message || 'Google Sheets gönderim hatası' };
  }
}
