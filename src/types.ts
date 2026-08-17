export type TransactionCategory =
  | 'Sabit Gelir'
  | 'Ek Gelir'
  | 'Kart Ekstresi'
  | 'Transfer Gideri'
  | 'Nakit Çekim'
  | 'Diğer Gider';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  category: TransactionCategory;
  amount: number;
  note: string;
  createdAt?: string;
}

export interface MonthlySummary {
  period: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  cardExpense: number;
  transferExpense: number;
  cashExpense: number;
  otherExpense: number;
  netBalance: number;
  savingsRate: number; // percentage (0 - 100)
  status: 'surplus' | 'deficit' | 'balanced' | 'empty';
}

export interface GasConfig {
  url: string;
  lastSyncTime: string | null;
  autoSync: boolean;
  isConnected: boolean;
}

export type ViewMode = 'dashboard' | 'transactions' | 'trends' | 'guide';
