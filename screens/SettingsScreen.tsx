import React, { useState, useEffect } from 'react';
import { Account, Budget, Category, RecurringTransaction, Transaction } from '../types';
import { User } from '@supabase/supabase-js';
import { useI18n, SUPPORTED_CURRENCIES } from '../lib/i18n';
import { getAppVersion, checkForUpdate } from '../lib/updateChecker';
import SpendMeLogo from '../components/icons/SpendMeLogo';
import AccountManager from '../components/AccountManager';
import CategoryManager from '../components/CategoryManager';
import InviteManager from '../components/InviteManager';
import UserProfile from '../components/UserProfile';
import RecurringManager from '../components/RecurringManager';
import AddRecurringModal from '../components/AddRecurringModal';
import ExportImport from '../components/ExportImport';

const VersionCard: React.FC = () => {
    const [updateStatus, setUpdateStatus] = useState<'checking' | 'available' | 'latest' | 'error'>('checking');
    const [newVersion, setNewVersion] = useState('');
    const [apkUrl, setApkUrl] = useState('');
    const [releaseNotes, setReleaseNotes] = useState('');

    useEffect(() => {
        const check = async () => {
            const result = await checkForUpdate();
            if (result.hasUpdate && result.versionInfo) {
                setUpdateStatus('available');
                setNewVersion(result.versionInfo.version);
                setApkUrl(result.versionInfo.apkUrl);
                setReleaseNotes(result.versionInfo.releaseNotes);
            } else if (result.versionInfo) {
                setUpdateStatus('latest');
            } else {
                setUpdateStatus('error');
            }
        };
        check();
    }, []);

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-card dark:shadow-none border border-slate-100/60 dark:border-slate-700/60 p-5">
            <div className="flex flex-col items-center text-center">
                <SpendMeLogo size={40} />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-2">SpendMe</p>
                <p className="text-xs text-slate-400 mt-0.5">v{getAppVersion()}</p>

                {updateStatus === 'checking' && (
                    <p className="text-xs text-slate-400 mt-3 animate-pulse">Güncelleme kontrol ediliyor...</p>
                )}

                {updateStatus === 'latest' && (
                    <div className="mt-3 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ En güncel sürüm</p>
                    </div>
                )}

                {updateStatus === 'available' && (
                    <div className="mt-3 w-full">
                        <div className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl mb-2">
                            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                                🚀 Yeni sürüm mevcut: v{newVersion}
                            </p>
                            {releaseNotes && (
                                <p className="text-[11px] text-orange-500 mt-0.5">{releaseNotes}</p>
                            )}
                        </div>
                        <a
                            href={apkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors text-center shadow-sm"
                        >
                            Güncelle (v{newVersion})
                        </a>
                    </div>
                )}

                {updateStatus === 'error' && (
                    <p className="text-xs text-slate-400 mt-3">Güncelleme kontrol edilemedi</p>
                )}

                <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-3">Yapay zeka destekli kişisel finans</p>
            </div>
        </div>
    );
};

interface SettingsScreenProps {
    user: User | null;
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    budgets: Budget[];
    recurringTransactions: RecurringTransaction[];
    selectedMonth: string;
    setSelectedMonth: (m: string) => void;
    onAddAccount: () => void;
    onEditAccount: (account: Account) => void;
    onDeleteAccount: (id: number) => Promise<void>;
    onAddCategory: (category: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
    onDeleteCategory: (id: number) => Promise<void>;
    onAddBudget: (categoryId: number, limit: number, month: string) => void;
    onAddRecurring: (recurring: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
    onToggleRecurring: (id: number, isActive: boolean) => Promise<void>;
    onDeleteRecurring: (id: number) => Promise<void>;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
    user,
    accounts,
    transactions,
    categories,
    budgets,
    recurringTransactions,
    selectedMonth,
    setSelectedMonth,
    onAddAccount,
    onDeleteAccount,
    onAddCategory,
    onDeleteCategory,
    onAddBudget,
    onAddRecurring,
    onToggleRecurring,
    onDeleteRecurring,
}) => {
    const [isAddRecurringOpen, setAddRecurringOpen] = useState(false);

    const { currency, setCurrency } = useI18n();
    const selectClass = "px-3.5 py-2 bg-slate-50/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm dark:text-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all";

    return (
        <div className="space-y-4 animate-fade-in">
            <UserProfile user={user} />

            {/* Genel Ayarlar */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-card dark:shadow-none border border-slate-100/60 dark:border-slate-700/60 p-5">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-brand-100 dark:bg-brand-900/30 rounded-lg flex items-center justify-center text-sm">⚙️</span>
                    Genel Ayarlar
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Ay</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className={selectClass}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Para Birimi</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className={selectClass}
                        >
                            {SUPPORTED_CURRENCIES.map(cur => (
                                <option key={cur.code} value={cur.code}>{cur.symbol} {cur.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <RecurringManager
                recurringTransactions={recurringTransactions}
                categories={categories}
                accounts={accounts}
                onAddRecurring={() => setAddRecurringOpen(true)}
                onToggleRecurring={onToggleRecurring}
                onDeleteRecurring={onDeleteRecurring}
            />
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
            <ExportImport
                transactions={transactions}
                accounts={accounts}
                categories={categories}
            />
            {/* Uygulama Bilgisi + Güncelleme Kontrolü */}
            <VersionCard />

            {isAddRecurringOpen && (
                <AddRecurringModal
                    isOpen={isAddRecurringOpen}
                    onClose={() => setAddRecurringOpen(false)}
                    onSubmit={(data) => {
                        onAddRecurring(data);
                        setAddRecurringOpen(false);
                    }}
                    categories={categories}
                    accounts={accounts}
                />
            )}
        </div>
    );
};

export default SettingsScreen;
