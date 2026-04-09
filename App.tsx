import React, { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { Transaction, Account, Category, Budget, TransactionType, RecurringTransaction, RecurringFrequency } from './types';

import Auth from './components/Auth';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import BudgetsScreen from './screens/BudgetsScreen';
import ReportsScreen from './screens/ReportsScreen';
import SettingsScreen from './screens/SettingsScreen';
import './lib/chartSetup';
import BottomNavBar from './components/BottomNavBar';
import TransactionForm from './components/TransactionForm';
import AddAccountModal from './components/AddAccountModal';
import EditAccountModal from './components/EditAccountModal';
import EditTransactionModal from './components/EditTransactionModal';
import InstallPWAButton from './components/InstallPWAButton';
import UpdateBanner from './components/UpdateBanner';
import SpendMeLogo from './components/icons/SpendMeLogo';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsInviteCode, setNeedsInviteCode] = useState(false);
    const [inviteCodeInput, setInviteCodeInput] = useState('');

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleDateString('en-CA').slice(0, 7));

    const [activeScreen, setActiveScreen] = useState('home');
    const [isTransactionFormOpen, setTransactionFormOpen] = useState(false);
    const [isAddAccountModalOpen, setAddAccountModalOpen] = useState(false);
    const [isEditAccountModalOpen, setEditAccountModalOpen] = useState(false);
    const [isEditTransactionModalOpen, setEditTransactionModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const buildCategoryTree = (categories: Category[]): Category[] => {
        const categoryMap: { [key: number]: Category & { subcategories: Category[] } } = {};
        const roots: Category[] = [];

        categories.forEach(category => {
            categoryMap[category.id] = { ...category, subcategories: [] };
        });

        categories.forEach(category => {
            if (category.parent_id && categoryMap[category.parent_id]) {
                categoryMap[category.parent_id].subcategories.push(categoryMap[category.id]);
            } else {
                roots.push(categoryMap[category.id]);
            }
        });
        return roots;
    };

    const fetchData = useCallback(async (currentUser: User) => {
        if (!currentUser) return;
        
        setLoading(true);
        const [
            { data: transactionsData, error: tError },
            { data: accountsData, error: aError },
            { data: categoriesData, error: cError },
            { data: budgetsData, error: bError },
            { data: recurringData, error: rError }
        ] = await Promise.all([
            supabase.from('but_transactions').select('*').eq('user_id', currentUser.id).order('date', { ascending: false }).order('created_at', { ascending: false }),
            supabase.from('but_accounts').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
            supabase.from('but_categories').select('*').eq('user_id', currentUser.id).order('name'),
            supabase.from('but_budgets').select('*').eq('user_id', currentUser.id).eq('month', selectedMonth),
            supabase.from('but_recurring_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
        ]);

        if (tError || aError || cError || bError || rError) {
            console.error("Error fetching data:", tError || aError || cError || bError || rError);
            setLoading(false);
            return;
        }

        setTransactions(transactionsData || []);
        setAccounts(accountsData || []);
        const categoryTree = buildCategoryTree(categoriesData || []);
        setCategories(categoryTree);
        setBudgets(budgetsData || []);
        setRecurringTransactions(recurringData || []);
        setLoading(false);

        // Vadesi gelen tekrarlayan işlemleri otomatik oluştur
        if (recurringData) {
            await processRecurringTransactions(currentUser, recurringData);
        }

    }, [selectedMonth]);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchData(session.user);
            } else {
                setLoading(false);
            }
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                 if (_event === 'SIGNED_IN' && currentUser) {
                    // Türkçe Açıklama:
                    // URL'den davet kodunu kontrol et
                    const urlParams = new URLSearchParams(window.location.search);
                    const inviteCode = urlParams.get('invite');
                    
                    if (inviteCode) {
                        // Davet kodunu doğrula ve kullan
                        const { data: isValid, error: inviteError } = await supabase.rpc('validate_and_use_invite', {
                            code_param: inviteCode,
                            user_email_param: currentUser.email
                        });

                        if (inviteError || !isValid) {
                            alert('Davet kodu geçersiz veya süresi dolmuş. Lütfen yeni bir davet kodu alın.');
                            await supabase.auth.signOut();
                            return;
                        }
                        // URL'den davet kodunu temizle
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }

                    const { error } = await supabase.rpc('add_initial_categories');
                    if (error) console.error("Error adding initial categories: ", error);
                    await fetchData(currentUser);
                }
                if (!session) {
                    setTransactions([]);
                    setAccounts([]);
                    setCategories([]);
                    setBudgets([]);
                    setRecurringTransactions([]);
                }
            }
        );
        return () => subscription.unsubscribe();
    }, [fetchData]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('Sign out error:', e);
        }
        // State temizle ve login ekranına dön
        setSession(null);
        setUser(null);
        setTransactions([]);
        setAccounts([]);
        setCategories([]);
        setBudgets([]);
        setRecurringTransactions([]);
        setActiveScreen('home');
        setLoading(false);
    };
    
    const handleEditAccount = (account: Account) => {
        setEditingAccount(account);
        setEditAccountModalOpen(true);
    };
    
    const handleUpdateAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        if (!user || !editingAccount) return;
        
        // Optimistic update
        setAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, ...account } : a));
        setEditAccountModalOpen(false);
        setEditingAccount(null);
        
        const { error } = await supabase
            .from('but_accounts')
            .update(account)
            .match({ id: editingAccount.id, user_id: user.id });
            
        if (error) {
            console.error('Error updating account:', error);
            // Hata durumunda optimistic update'i geri al
            setAccounts(prev => prev.map(a => a.id === editingAccount.id ? editingAccount : a));
            setEditAccountModalOpen(true);
            setEditingAccount(editingAccount);
        }
    };
    
    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setEditTransactionModalOpen(true);
    };
    
    const handleUpdateTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
        if (!user || !editingTransaction) return;

        // Eğer taksitli bir işlem düzenleniyorsa tüm seriyi güncelle
        const isSeries = (editingTransaction.is_installment && editingTransaction.installment_count) || (transaction.is_installment && transaction.installment_count);
        if (isSeries) {
            // 1) Eski seriyi topla (parent_id varsa ona göre)
            const series = transactions.filter(t => {
                if (editingTransaction.installment_parent_id) {
                    return t.installment_parent_id === editingTransaction.installment_parent_id;
                }
                return (
                    t.is_installment &&
                    t.installment_count === editingTransaction.installment_count &&
                    t.description.includes(editingTransaction.description.split(' (')[0])
                );
            });

            // 2) Optimistic olarak eski seriyi kaldır
            const backupSeries = series.map(s => ({ ...s }));
            setTransactions(prev => prev.filter(t => !series.some(s => s.id === t.id)));

            // 3) Eski seriyi DB'den sil
            const { error: delErr } = await supabase
                .from('but_transactions')
                .delete()
                .in('id', series.map(s => s.id));
            if (delErr) {
                console.error('Error deleting old series:', delErr);
                setTransactions(prev => [...prev, ...backupSeries]);
                return;
            }

            // 4) Yeni seriyi üret (2 hane yuvarla)
            const count = transaction.installment_count || editingTransaction.installment_count || 1;
            const baseAmount = transaction.amount;
            const toTwo = (n: number) => Number(n.toFixed(2));
            const perAmount = toTwo(baseAmount / count);

            const newSeries: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[] = [];
            for (let i = 1; i <= count; i++) {
                const d = new Date(transaction.date);
                d.setMonth(d.getMonth() + i - 1);
                newSeries.push({
                    ...transaction,
                    amount: perAmount,
                    description: `${transaction.description} (${i}/${count})`,
                    date: d.toISOString().split('T')[0],
                    installment_current: i,
                    is_installment: true,
                    installment_count: count,
                    installment_parent_id: null,
                });
            }

            // 5) Optimistic ekle
            const tempIds = newSeries.map(() => Math.floor(Math.random() * 1_000_000_000));
            const optimistic = newSeries.map((n, idx) => ({
                id: tempIds[idx],
                ...n,
                user_id: user.id,
                created_at: new Date().toISOString(),
            } as Transaction));
            setTransactions(prev => [...optimistic, ...prev]);

            // 6) DB'ye ekle ve parent id ata
            const { data, error: insErr } = await supabase
                .from('but_transactions')
                .insert(newSeries.map(n => ({ ...n, user_id: user.id })))
                .select();
            if (insErr || !data) {
                console.error('Error inserting new series:', insErr);
                setTransactions(prev => prev.filter(t => !tempIds.includes(t.id)));
                // Eski seriyi geri yükle
                setTransactions(prev => [...backupSeries, ...prev]);
                return;
            }

            const parentId = data[0]?.id;
            if (parentId) {
                await supabase
                    .from('but_transactions')
                    .update({ installment_parent_id: parentId })
                    .in('id', data.map((d: any) => d.id));
            }

            // optimistic -> gerçek id'lerle değiştir
            setTransactions(prev => {
                const arr = [...prev];
                data.forEach((real: any, index: number) => {
                    const i = arr.findIndex(t => t.id === tempIds[index]);
                    if (i !== -1) arr[i] = real;
                });
                return arr;
            });

            setEditTransactionModalOpen(false);
            setEditingTransaction(null);
            await fetchData(user);
            return;
        }

        // Tekil işlem güncelleme
        const backup = editingTransaction;
        setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...t, ...transaction } : t));
        const { error } = await supabase
            .from('but_transactions')
            .update(transaction)
            .match({ id: editingTransaction.id, user_id: user.id });
        if (error) {
            console.error('Error updating transaction:', error);
            setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? backup : t));
            return;
        }
        setEditTransactionModalOpen(false);
        setEditingTransaction(null);
        await fetchData(user);
    };
    
    const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;
        
        // Taksitli işlem ise özel handling
        if (transaction.is_installment && transaction.installment_count && transaction.installment_count >= 1) {
            // Taksitli işlemler için batch insert
            const installmentTransactions: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[] = [];
            const toTwo = (n: number) => Number(n.toFixed(2));
            const installmentAmount = toTwo(transaction.amount / transaction.installment_count);
            
            for (let i = 1; i <= transaction.installment_count; i++) {
                const installmentDate = new Date(transaction.date);
                installmentDate.setMonth(installmentDate.getMonth() + i - 1);
                
                installmentTransactions.push({
                    ...transaction,
                    amount: installmentAmount,
                    description: `${transaction.description} (${i}/${transaction.installment_count})`,
                    date: installmentDate.toISOString().split('T')[0],
                    installment_current: i,
                });
            }
            
            // Optimistic update - tüm taksitleri ekle
            const tempIds = installmentTransactions.map(() => Math.floor(Math.random() * 1_000_000_000));
            const optimisticTransactions: Transaction[] = installmentTransactions.map((t, index) => ({
                id: tempIds[index],
                ...t,
                user_id: user.id,
                created_at: new Date().toISOString(),
            }));
            
            setTransactions(prev => [...optimisticTransactions, ...prev]);
            
            // Batch insert
            const { data, error } = await supabase
                .from('but_transactions')
                .insert(installmentTransactions.map(t => ({ ...t, user_id: user.id })))
                .select();
            
            if (error || !data) {
                console.error('Error adding installment transactions:', error);
                // Hata durumunda optimistic update'i geri al
                setTransactions(prev => prev.filter(t => !tempIds.includes(t.id)));
                return;
            }
            
            // Gerçek verilerle değiştir ve parent id ata
            // Parent olarak ilk taksidin id'sini kullan
            const parentId = data[0]?.id;
            if (parentId) {
                await supabase.from('but_transactions')
                    .update({ installment_parent_id: parentId })
                    .in('id', data.map((d: any) => d.id));
            }

            setTransactions(prev => {
                const newTransactions = [...prev];
                data.forEach((realTransaction, index) => {
                    const optimisticIndex = newTransactions.findIndex(t => t.id === tempIds[index]);
                    if (optimisticIndex !== -1) {
                        newTransactions[optimisticIndex] = realTransaction;
                    }
                });
                return newTransactions;
            });
            
        } else {
            // Normal işlem için mevcut kod
            const tempId = Math.floor(Math.random() * 1_000_000_000);
            const optimisticTransaction: Transaction = {
                id: tempId,
                ...transaction,
                user_id: user.id,
                created_at: new Date().toISOString(),
            };
            
            setTransactions(prev => [optimisticTransaction, ...prev]);
            
            const { data, error } = await supabase
                .from('but_transactions')
                .insert({ ...transaction, user_id: user.id })
                .select()
                .single();

            if (error || !data) {
                console.error('Error adding transaction:', error);
                // Hata durumunda optimistic update'i geri al
                setTransactions(prev => prev.filter(t => t.id !== tempId));
                return;
            }

            // Gerçek veriyle değiştir
            setTransactions(prev => prev.map(t => t.id === tempId ? data : t));
        }
        
        // Account balance'ları güncelle
        await fetchData(user);
    };

    const handleAddMultipleTransactions = async (transactionsList: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]) => {
        if (!user || transactionsList.length === 0) return;

        // Optimistic update
        const tempIds = transactionsList.map(() => Math.floor(Math.random() * 1_000_000_000));
        const optimisticTransactions: Transaction[] = transactionsList.map((t, i) => ({
            id: tempIds[i],
            ...t,
            user_id: user.id,
            created_at: new Date().toISOString(),
        }));
        setTransactions(prev => [...optimisticTransactions, ...prev]);

        // Batch insert
        const { data, error } = await supabase
            .from('but_transactions')
            .insert(transactionsList.map(t => ({ ...t, user_id: user.id })))
            .select();

        if (error || !data) {
            console.error('Error adding batch transactions:', error);
            setTransactions(prev => prev.filter(t => !tempIds.includes(t.id)));
            return;
        }

        // Replace optimistic with real data
        setTransactions(prev => {
            const updated = [...prev];
            data.forEach((real: any, index: number) => {
                const i = updated.findIndex(t => t.id === tempIds[index]);
                if (i !== -1) updated[i] = real;
            });
            return updated;
        });

        await fetchData(user);
    };

    const handleDeleteTransaction = async (id: number) => {
        if (!user) return;
        
        const transactionToDelete = transactions.find(t => t.id === id);
        if (!transactionToDelete) return;
        
        // Taksitli işlem ise tüm taksitleri sil
        if (transactionToDelete.is_installment && (transactionToDelete.installment_parent_id || transactionToDelete.installment_count)) {
            // Parent id varsa ona göre; yoksa açıklama fallback
            const allInstallments = transactions.filter(t => {
                if (transactionToDelete.installment_parent_id) {
                    return t.installment_parent_id === transactionToDelete.installment_parent_id;
                }
                return (
                    t.is_installment &&
                    t.installment_count === transactionToDelete.installment_count &&
                    t.description.includes(transactionToDelete.description.split(' (')[0])
                );
            });
            
            // Optimistic update - tüm taksitleri kaldır
            setTransactions(prev => prev.filter(t => !allInstallments.some(inst => inst.id === t.id)));
            
            // Tüm taksitleri sil
            const installmentIds = allInstallments.map(t => t.id);
            const { error } = await supabase
                .from('but_transactions')
                .delete()
                .in('id', installmentIds);
            
            if (error) {
                console.error('Error deleting installment transactions:', error);
                // Hata durumunda geri ekle
                setTransactions(prev => [...prev, ...allInstallments]);
                return;
            }
        } else {
            // Normal işlem için mevcut kod
            setTransactions(prev => prev.filter(t => t.id !== id));
            
            const { error } = await supabase.from('but_transactions').delete().match({ id });
            
            if (error) {
                console.error('Error deleting transaction:', error);
                // Hata durumunda geri ekle
                if (transactionToDelete) {
                    setTransactions(prev => [...prev, transactionToDelete]);
                }
                return;
            }
        }

        // Account balance'ları güncelle
        await fetchData(user);
    };

    const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        if (!user) return;
        
        // Optimistic update
        const tempId = Math.floor(Math.random() * 1_000_000_000);
        const optimisticAccount: Account = {
            id: tempId,
            ...account,
            user_id: user.id,
        };
        
        setAccounts(prev => [...prev, optimisticAccount]);
        setAddAccountModalOpen(false);
        
        const { data, error } = await supabase
            .from('but_accounts')
            .insert({ ...account, user_id: user.id })
            .select()
            .single();
            
        if (error) {
            console.error('Error adding account:', error);
            // Hata durumunda optimistic update'i geri al
            setAccounts(prev => prev.filter(a => a.id !== tempId));
            setAddAccountModalOpen(true);
        } else if (data) {
            // Gerçek veriyle değiştir
            setAccounts(prev => prev.map(a => a.id === tempId ? data : a));
        }
    };
    
    const handleDeleteAccount = async (id: number) => {
        if (!user) return;
        
        // Optimistic update - hemen UI'dan kaldır
        const accountToDelete = accounts.find(a => a.id === id);
        setAccounts(prev => prev.filter(a => a.id !== id));
        
        const { error } = await supabase.from('but_accounts').delete().match({ id, user_id: user.id });
        
        if (error) {
            console.error('Error deleting account:', error);
            // Hata durumunda geri ekle
            if (accountToDelete) {
                setAccounts(prev => [...prev, accountToDelete]);
            }
        }
    };

    const handleAddCategory = async (category: Omit<Category, 'id' | 'user_id' | 'subcategories'>) => {
        if (!user) return;
        
        // Optimistic update
        const tempId = Math.floor(Math.random() * 1_000_000_000);
        const optimisticCategory: Category = {
            id: tempId,
            ...category,
            user_id: user.id,
            subcategories: [],
        };
        
        setCategories(prev => [...prev, optimisticCategory]);
        
        const { data, error } = await supabase
            .from('but_categories')
            .insert({ ...category, user_id: user.id })
            .select()
            .single();
            
        if (error) {
            console.error('Error adding category:', error);
            // Hata durumunda optimistic update'i geri al
            setCategories(prev => prev.filter(c => c.id !== tempId));
        } else if (data) {
            // Gerçek veriyle değiştir
            setCategories(prev => prev.map(c => c.id === tempId ? data : c));
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!user) return;
        
        // Optimistic update - hemen UI'dan kaldır
        const categoryToDelete = categories.find(c => c.id === id);
        setCategories(prev => prev.filter(c => c.id !== id));
        
        const { error } = await supabase.from('but_categories').delete().match({ id, user_id: user.id });
        
        if (error) {
            console.error('Error deleting category:', error);
            // Hata durumunda geri ekle
            if (categoryToDelete) {
                setCategories(prev => [...prev, categoryToDelete]);
            }
        }
    };

    const handleAddOrUpdateBudget = async (categoryId: number, limit: number, month: string) => {
        if (!user) return;
        const existingBudget = budgets.find(b => b.category_id === categoryId && b.month === month);

        if (existingBudget) {
            // Optimistic update
            setBudgets(prev => prev.map(b => b.id === existingBudget.id ? { ...b, limit } as Budget : b));
            const { error } = await supabase.from('but_budgets').update({ limit }).match({ id: existingBudget.id });
            if (error) console.error('Error updating budget:', error);
        } else {
            // Optimistic insert
            const tempId = Math.floor(Math.random() * 1_000_000_000);
            const optimistic: Budget = {
                id: tempId,
                user_id: user.id,
                category_id: categoryId,
                limit,
                month,
                created_at: new Date().toISOString(),
            };
            setBudgets(prev => [...prev, optimistic]);

            const { data, error } = await supabase
                .from('but_budgets')
                .insert({ category_id: categoryId, limit, user_id: user.id, month })
                .select()
                .single();
            if (error) {
                console.error('Error adding budget:', error);
                // Revert optimistic insert on error
                setBudgets(prev => prev.filter(b => b.id !== tempId));
            } else if (data) {
                // Replace optimistic with real row
                setBudgets(prev => prev.map(b => (b.id === tempId ? data : b)));
            }
        }
    }
    
    const handleDeleteBudget = async (id: number) => {
        if (!user) return;
        const { error } = await supabase.from('but_budgets').delete().match({ id, user_id: user.id });
        if (error) console.error('Error deleting budget:', error);
        else await fetchData(user);
    }

    // Tekrarlayan işlemleri otomatik çalıştır
    const processRecurringTransactions = async (currentUser: User, recurrings: RecurringTransaction[]) => {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

        for (const rec of recurrings) {
            if (!rec.is_active) continue;
            if (rec.end_date && rec.end_date < today) continue;
            if (rec.next_run_date > today) continue;

            // Bu tarih için işlem oluştur
            const txData: any = {
                user_id: currentUser.id,
                type: rec.type,
                amount: rec.amount,
                description: rec.description,
                date: rec.next_run_date,
                category_id: rec.category_id,
                account_id: rec.account_id,
                from_account_id: rec.from_account_id,
                to_account_id: rec.to_account_id,
            };

            const { error: txError } = await supabase.from('but_transactions').insert(txData);
            if (txError) {
                console.error('Recurring transaction error:', txError);
                continue;
            }

            // Sonraki çalışma tarihini hesapla
            const nextDate = new Date(rec.next_run_date);
            switch (rec.frequency) {
                case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
                case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
            }
            const nextRunDate = nextDate.toLocaleDateString('en-CA');

            await supabase.from('but_recurring_transactions')
                .update({ last_run_date: rec.next_run_date, next_run_date: nextRunDate })
                .eq('id', rec.id);
        }
    };

    // Tekrarlayan işlem CRUD
    const handleAddRecurring = async (recurring: Omit<RecurringTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        if (!user) return;

        const tempId = Math.floor(Math.random() * 1_000_000_000);
        const optimistic: RecurringTransaction = {
            id: tempId, ...recurring, user_id: user.id,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        };
        setRecurringTransactions(prev => [optimistic, ...prev]);

        const { data, error } = await supabase
            .from('but_recurring_transactions')
            .insert({ ...recurring, user_id: user.id })
            .select().single();

        if (error) {
            console.error('Error adding recurring:', error);
            setRecurringTransactions(prev => prev.filter(r => r.id !== tempId));
        } else if (data) {
            setRecurringTransactions(prev => prev.map(r => r.id === tempId ? data : r));
        }
    };

    const handleToggleRecurring = async (id: number, isActive: boolean) => {
        if (!user) return;
        setRecurringTransactions(prev => prev.map(r => r.id === id ? { ...r, is_active: isActive } : r));
        const { error } = await supabase.from('but_recurring_transactions').update({ is_active: isActive }).eq('id', id);
        if (error) {
            console.error('Error toggling recurring:', error);
            setRecurringTransactions(prev => prev.map(r => r.id === id ? { ...r, is_active: !isActive } : r));
        }
    };

    const handleDeleteRecurring = async (id: number) => {
        if (!user) return;
        const backup = recurringTransactions.find(r => r.id === id);
        setRecurringTransactions(prev => prev.filter(r => r.id !== id));
        const { error } = await supabase.from('but_recurring_transactions').delete().match({ id, user_id: user.id });
        if (error) {
            console.error('Error deleting recurring:', error);
            if (backup) setRecurringTransactions(prev => [...prev, backup]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center gap-4">
                <div className="animate-pulse-slow">
                    <SpendMeLogo size={56} />
                </div>
                <span className="text-sm font-medium text-slate-400">Yükleniyor...</span>
            </div>
        );
    }

    // Türkçe Açıklama:
    // Davet kodu gerekiyorsa, davet kodu giriş ekranını göster
    if (needsInviteCode) {
        const handleInviteSubmit = async () => {
            if (!inviteCodeInput.trim()) {
                alert('Lütfen bir davet kodu girin.');
                return;
            }
            // Davet koduyla birlikte sayfayı yeniden yükle
            window.location.href = `${window.location.origin}?invite=${inviteCodeInput.trim().toUpperCase()}`;
        };

        return (
            <div className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-20 -left-20 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 -right-20 w-96 h-96 bg-brand-300/10 rounded-full blur-3xl"></div>
                <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-modal p-8 max-w-sm w-full animate-scale-in">
                    <div className="flex items-center justify-center mx-auto mb-4">
                        <SpendMeLogo size={56} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 text-center">Davet Kodu Gerekli</h2>
                    <p className="text-sm text-slate-500 mb-6 mt-2 text-center">
                        Bu uygulamayı kullanmak için bir davet koduna ihtiyacınız var.
                    </p>
                    <input
                        type="text"
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        placeholder="DAVET KODU"
                        className="w-full px-3.5 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-center font-mono text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all mb-4"
                        maxLength={8}
                    />
                    <button
                        onClick={handleInviteSubmit}
                        className="w-full py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:bg-brand-800 transition-colors shadow-sm"
                    >
                        Devam Et
                    </button>
                    <button
                        onClick={() => setNeedsInviteCode(false)}
                        className="w-full mt-3 text-sm text-slate-500 py-2 hover:text-slate-700 transition-colors"
                    >
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    if (!session) {
        return <Auth />;
    }

    const screenTitles: { [key: string]: string } = {
        home: 'SpendMe',
        transactions: 'Tüm İşlemler',
        budgets: 'Bütçeler',
        reports: 'Raporlar',
        settings: 'Ayarlar',
    };

    const renderScreen = () => {
        switch (activeScreen) {
            case 'home':
                return <HomeScreen accounts={accounts} transactions={transactions} categories={categories} budgets={budgets} onDeleteTransaction={handleDeleteTransaction} onEditTransaction={handleEditTransaction} />;
            case 'transactions':
                return <TransactionsScreen accounts={accounts} transactions={transactions} categories={categories} onDeleteTransaction={handleDeleteTransaction} onEditTransaction={handleEditTransaction} />;
            case 'budgets':
                return <BudgetsScreen
                    budgets={budgets}
                    transactions={transactions}
                    categories={categories}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    onUpdateBudget={handleAddOrUpdateBudget}
                    onDeleteBudget={handleDeleteBudget}
                />;
            case 'reports':
                return <ReportsScreen
                    budgets={budgets}
                    transactions={transactions}
                    categories={categories}
                    accounts={accounts}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    onUpdateBudget={handleAddOrUpdateBudget}
                    onDeleteBudget={handleDeleteBudget}
                />;
            case 'settings':
                return <SettingsScreen
                    user={user}
                    accounts={accounts}
                    transactions={transactions}
                    categories={categories}
                    budgets={budgets}
                    recurringTransactions={recurringTransactions}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    onAddAccount={() => setAddAccountModalOpen(true)}
                    onEditAccount={handleEditAccount}
                    onDeleteAccount={handleDeleteAccount}
                    onAddCategory={handleAddCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onAddBudget={handleAddOrUpdateBudget}
                    onAddRecurring={handleAddRecurring}
                    onToggleRecurring={handleToggleRecurring}
                    onDeleteRecurring={handleDeleteRecurring}
                />;
            default:
                return <HomeScreen accounts={accounts} transactions={transactions} categories={categories} onDeleteTransaction={handleDeleteTransaction}/>;
        }
    };

    return (
        <div className="bg-slate-100/80 dark:bg-slate-950 min-h-screen font-sans">
            <div className="max-w-2xl mx-auto bg-slate-50 dark:bg-slate-900 min-h-screen flex flex-col shadow-lg">
                <Header title={screenTitles[activeScreen]} user={user} onLogout={handleLogout} />
                <main className="flex-grow p-4 pb-24">
                    {renderScreen()}
                </main>
                <BottomNavBar 
                    activeScreen={activeScreen} 
                    setActiveScreen={setActiveScreen} 
                    onAddTransactionClick={() => setTransactionFormOpen(true)} 
                />
            </div>
            {isTransactionFormOpen && (
                <TransactionForm
                    isOpen={isTransactionFormOpen}
                    onClose={() => setTransactionFormOpen(false)}
                    onSubmit={handleAddTransaction}
                    onSubmitMultiple={handleAddMultipleTransactions}
                    categories={categories}
                    accounts={accounts}
                />
            )}
            {isAddAccountModalOpen && (
                 <AddAccountModal
                    isOpen={isAddAccountModalOpen}
                    onClose={() => setAddAccountModalOpen(false)}
                    onSubmit={handleAddAccount}
                />
            )}
            {isEditAccountModalOpen && (
                <EditAccountModal
                    isOpen={isEditAccountModalOpen}
                    onClose={() => {
                        setEditAccountModalOpen(false);
                        setEditingAccount(null);
                    }}
                    onSubmit={handleUpdateAccount}
                    account={editingAccount}
                />
            )}
            {isEditTransactionModalOpen && (
                <EditTransactionModal
                    isOpen={isEditTransactionModalOpen}
                    onClose={() => {
                        setEditTransactionModalOpen(false);
                        setEditingTransaction(null);
                    }}
                    onSubmit={handleUpdateTransaction}
                    transaction={editingTransaction}
                    categories={categories}
                    accounts={accounts}
                />
            )}
            <InstallPWAButton />
            <UpdateBanner />
        </div>
    );
};

export default App;
