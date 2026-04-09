export interface Session {
  provider_token?: string | null;
  access_token: string;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  token_type: string;
  user: User;
}

export interface User {
    id: string;
    email?: string;
}

export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
    TRANSFER = 'transfer',
}

export enum AccountType {
    BANK = 'bank',
    CREDIT_CARD = 'credit_card',
    CASH = 'cash',
}

export interface Transaction {
    id: number;
    user_id: string;
    date: string; // YYYY-MM-DD
    description: string;
    amount: number;
    type: TransactionType;
    category_id: number | null;
    account_id: number | null;
    from_account_id?: number | null;
    to_account_id?: number | null;
    ai_prompt?: string | null;
    // Türkçe Açıklama: Kredi kartı taksit bilgileri
    is_installment?: boolean; // Taksitli işlem mi?
    installment_count?: number | null; // Toplam taksit sayısı
    installment_current?: number | null; // Mevcut taksit numarası
    installment_parent_id?: number | null; // Ana taksit işleminin ID'si
    created_at: string;
}

export interface Category {
    id: number;
    user_id: string;
    name: string;
    type: 'income' | 'expense';
    parent_id: number | null;
    subcategories?: Category[]; // For tree structure
}

export interface Account {
    id: number;
    user_id: string;
    name: string;
    type: AccountType;
    balance: number;
    // Türkçe Açıklama: Kredi kartı özel bilgileri
    card_number?: string | null; // Kart numarası (son 4 hane)
    expiry_date?: string | null; // Son kullanma tarihi (MM/YY)
    statement_date?: number | null; // Ekstre kesim tarihi (1-31)
    payment_due_date?: number | null; // Ödeme vadesi (1-31)
    credit_limit?: number | null; // Kredi limiti
    available_credit?: number | null; // Kullanılabilir kredi
}

export enum RecurringFrequency {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export interface RecurringTransaction {
    id: number;
    user_id: string;
    type: TransactionType;
    amount: number;
    description: string;
    category_id: number | null;
    account_id: number | null;
    from_account_id?: number | null;
    to_account_id?: number | null;
    frequency: RecurringFrequency;
    day_of_month?: number | null;
    day_of_week?: number | null;
    start_date: string;
    end_date?: string | null;
    next_run_date: string;
    last_run_date?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Budget {
    id: number;
    user_id: string;
    category_id: number;
    limit: number;
    // Türkçe Açıklama:
    // Aylık bütçe tanımı için ay bilgisi (YYYY-MM)
    month?: string; 
    created_at: string;
}
