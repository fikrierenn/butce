import React, { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { Transaction, Account, Category, Budget, TransactionType } from './types';

import Auth from './components/Auth';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import BudgetsScreen from './screens/BudgetsScreen';
import SettingsScreen from './screens/SettingsScreen';
import BottomNavBar from './components/BottomNavBar';
import TransactionForm from './components/TransactionForm';
import AddAccountModal from './components/AddAccountModal';
import InstallPWAButton from './components/InstallPWAButton';

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
    // Türkçe Açıklama:
    // Bütçeleri ay bazlı yönetmek için seçili ayı YYYY-MM formatında tutuyoruz.
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleDateString('en-CA').slice(0, 7));

    const [activeScreen, setActiveScreen] = useState('home');
    const [isTransactionFormOpen, setTransactionFormOpen] = useState(false);
    const [isAddAccountModalOpen, setAddAccountModalOpen] = useState(false);

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
            { data: budgetsData, error: bError }
        ] = await Promise.all([
            supabase.from('but_transactions').select('*').eq('user_id', currentUser.id).order('date', { ascending: false }).order('created_at', { ascending: false }),
            supabase.from('but_accounts').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }),
            supabase.from('but_categories').select('*').eq('user_id', currentUser.id).order('name'),
            supabase.from('but_budgets').select('*').eq('user_id', currentUser.id).eq('month', selectedMonth)
        ]);
        
        if (tError || aError || cError || bError) {
            console.error("Error fetching data:", tError || aError || cError || bError);
            setLoading(false);
            return;
        }

        setTransactions(transactionsData || []);
        setAccounts(accountsData || []);
        const categoryTree = buildCategoryTree(categoriesData || []);
        setCategories(categoryTree);
        setBudgets(budgetsData || []);
        setLoading(false);

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
                    } else {
                        // Türkçe Açıklama:
                        // Davet kodu yoksa, kullanıcının izinli olup olmadığını kontrol et
                        // Not: Eğer fonksiyon yoksa (SQL çalıştırılmadıysa), tüm kullanıcılara izin ver
                        try {
                            const { data: isAllowed, error: allowError } = await supabase.rpc('is_user_allowed', {
                                user_email: currentUser.email
                            });

                            // Eğer fonksiyon bulunamadıysa (42883 = undefined function), devam et
                            if (allowError && allowError.code !== '42883') {
                                console.error('İzin kontrolü hatası:', allowError);
                            }

                            // Fonksiyon varsa ve kullanıcı izinli değilse
                            if (!allowError && !isAllowed) {
                                setNeedsInviteCode(true);
                                await supabase.auth.signOut();
                                setLoading(false);
                                return;
                            }
                        } catch (err) {
                            // Hata varsa logla ama uygulamayı çalıştırmaya devam et
                            console.warn('İzin kontrolü atlandı:', err);
                        }
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
                }
            }
        );
        return () => subscription.unsubscribe();
    }, [fetchData]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };
    
    const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
        if (!user) return;
        
        const { data, error } = await supabase
            .from('but_transactions')
            .insert({ ...transaction, user_id: user.id })
            .select()
            .single();

        if (error || !data) {
            console.error('Error adding transaction:', error);
            return;
        }

        await fetchData(user); // Triggers will update balances, so we just refetch
    };
    
    const handleDeleteTransaction = async (id: number) => {
        if (!user) return;
        
        const { error } = await supabase.from('but_transactions').delete().match({ id });
        if (error) {
            console.error('Error deleting transaction:', error);
            return;
        }

        await fetchData(user); // Triggers will update balances, so we just refetch
    }

    const handleAddAccount = async (account: Omit<Account, 'id' | 'user_id'>) => {
        if (!user) return;
        const { error } = await supabase
            .from('but_accounts')
            .insert({ ...account, user_id: user.id });
        if (error) console.error('Error adding account:', error);
        else {
            setAddAccountModalOpen(false);
            await fetchData(user);
        }
    };
    
    const handleDeleteAccount = async (id: number) => {
         if (!user) return;
        const { error } = await supabase.from('but_accounts').delete().match({ id, user_id: user.id });
        if (error) console.error('Error deleting account:', error);
        else await fetchData(user);
    }

    const handleAddCategory = async (category: Omit<Category, 'id' | 'user_id' | 'subcategories'>) => {
        if (!user) return;
        const { error } = await supabase.from('but_categories').insert({ ...category, user_id: user.id });
        if (error) console.error('Error adding category:', error);
        else await fetchData(user);
    };

    const handleDeleteCategory = async (id: number) => {
        if (!user) return;
        const { error } = await supabase.from('but_categories').delete().match({ id, user_id: user.id });
        if (error) console.error('Error deleting category:', error);
        else await fetchData(user);
    }

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

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex justify-center items-center">Yükleniyor...</div>;
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
            <div className="bg-slate-50 min-h-screen font-sans flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4 text-center">🎟️ Davet Kodu Gerekli</h2>
                    <p className="text-gray-600 mb-6 text-center">
                        Bu uygulamayı kullanmak için bir davet koduna ihtiyacınız var. 
                        Lütfen size gönderilen davet linkini kullanın veya kodu aşağıya girin.
                    </p>
                    <input
                        type="text"
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        placeholder="DAVET KODU"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md mb-4 text-center font-mono text-lg"
                        maxLength={8}
                    />
                    <button
                        onClick={handleInviteSubmit}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
                    >
                        Devam Et
                    </button>
                    <button
                        onClick={() => setNeedsInviteCode(false)}
                        className="w-full mt-3 text-gray-600 py-2 hover:text-gray-800"
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
        settings: 'Ayarlar',
    };

    const renderScreen = () => {
        switch (activeScreen) {
            case 'home':
                return <HomeScreen accounts={accounts} transactions={transactions} categories={categories} budgets={budgets} onDeleteTransaction={handleDeleteTransaction} />;
            case 'transactions':
                return <TransactionsScreen accounts={accounts} transactions={transactions} categories={categories} onDeleteTransaction={handleDeleteTransaction} />;
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
            case 'settings':
                return <SettingsScreen 
                    user={user}
                    accounts={accounts} 
                    categories={categories}
                    budgets={budgets}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    onAddAccount={() => setAddAccountModalOpen(true)}
                    onDeleteAccount={handleDeleteAccount}
                    onAddCategory={handleAddCategory}
                    onDeleteCategory={handleDeleteCategory}
                    onAddBudget={handleAddOrUpdateBudget}
                />;
            default:
                return <HomeScreen accounts={accounts} transactions={transactions} categories={categories} onDeleteTransaction={handleDeleteTransaction}/>;
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen font-sans">
            <div className="max-w-2xl mx-auto bg-white min-h-screen flex flex-col">
                <Header title={screenTitles[activeScreen]} user={user} onLogout={handleLogout} />
                <main className="flex-grow p-4 sm:p-6 pb-24">
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
            <InstallPWAButton />
        </div>
    );
};

export default App;
