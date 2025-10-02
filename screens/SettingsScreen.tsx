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
    onAddAccount,
    onDeleteAccount,
    onAddCategory,
    onDeleteCategory,
    onAddBudget
}) => {
    return (
        <div className="space-y-6">
            <UserProfile user={user} />
            <InviteManager />
            <AccountManager 
                accounts={accounts} 
                onAddAccount={onAddAccount} 
                onDeleteAccount={onDeleteAccount}
            />
            <CategoryManager 
                categories={categories}
                budgets={budgets}
                onAddBudget={onAddBudget}
                onAddCategory={onAddCategory}
                onDeleteCategory={onDeleteCategory}
            />
        </div>
    );
};

export default SettingsScreen;
