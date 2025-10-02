import React from 'react';
// Fix: Corrected import path for types
import { Account, Budget, Category } from '../types';
import { User } from '@supabase/supabase-js';
import AccountManager from '../components/AccountManager';
// Fix: Corrected import path for CategoryManager
import CategoryManager from '../components/CategoryManager';
import InviteManager from '../components/InviteManager';
import UserProfile from '../components/UserProfile';

interface SettingsScreenProps {
    user: User | null;
    accounts: Account[];
    categories: Category[];
    budgets: Budget[];
    selectedMonth: string;
    setSelectedMonth: (m: string) => void;
    onAddAccount: () => void;
    onDeleteAccount: (id: number) => Promise<void>;
    onAddCategory: (category: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
    onDeleteCategory: (id: number) => Promise<void>;
    onAddBudget: (categoryId: number, limit: number, month: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
    user,
    accounts, 
    categories,
    budgets,
    selectedMonth,
    setSelectedMonth,
    onAddAccount,
    onDeleteAccount,
    onAddCategory,
    onDeleteCategory,
    onAddBudget
}) => {
    return (
        <div className="space-y-6">
            <UserProfile user={user} />
            {/* Türkçe Açıklama: Ay seçici burada, ekranın üst kısmında tek yerde gösterilir */}
            <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
                <label className="text-sm text-slate-700">Ay (YYYY-MM):</label>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                />
            </div>
            <InviteManager />
            <AccountManager 
                accounts={accounts} 
                onAddAccount={onAddAccount} 
                onDeleteAccount={onDeleteAccount}
            />
            <CategoryManager 
                categories={categories}
                budgets={budgets}
                selectedMonth={selectedMonth}
                onAddBudget={onAddBudget}
                onAddCategory={onAddCategory}
                onDeleteCategory={onDeleteCategory}
            />
        </div>
    );
};

export default SettingsScreen;
