import React from 'react';
// Fix: Corrected import path for types
import { Account, Budget, Category } from '../types';
import AccountManager from '../components/AccountManager';
// Fix: Corrected import path for CategoryManager
import CategoryManager from '../components/CategoryManager';
import InviteManager from '../components/InviteManager';

interface SettingsScreenProps {
    accounts: Account[];
    categories: Category[];
    budgets: Budget[];
    onAddAccount: () => void;
    onDeleteAccount: (id: number) => Promise<void>;
    onAddCategory: (category: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
    onDeleteCategory: (id: number) => Promise<void>;
    onAddBudget: (categoryId: number, limit: number) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
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
