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
    card_number?: string | null;
    expiry_date?: string | null;
    statement_date?: number | null;
    payment_due_date?: number | null;
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
