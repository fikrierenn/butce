import React, { useMemo, useState } from 'react';
import { Budget, Transaction, Category, TransactionType } from '../types';
import ExclamationIcon from './icons/ExclamationIcon';
import TrashIcon from './icons/TrashIcon';
import { formatCurrency } from '../lib/currency';

interface BudgetStatusProps {
    budgets: Budget[];
    transactions: Transaction[];
    categories: Category[];
    onUpdateBudget: (id: number, limit: number) => Promise<void>;
    onDeleteBudget: (id: number) => Promise<void>;
}

const getSpentAmountForCategory = (category: Category, transactions: Transaction[]): number => {
    let total = 0;
    const categoryIds = [category.id, ...(category.subcategories?.map(sc => sc.id) || [])];
    
    transactions.forEach(t => {
        if (t.type === TransactionType.EXPENSE && t.category_id && categoryIds.includes(t.category_id)) {
            total += t.amount;
        }
    });
    return total;
};

const BudgetStatus: React.FC<BudgetStatusProps> = ({ budgets, transactions, categories, onUpdateBudget, onDeleteBudget }) => {
    
    const flatCategories = useMemo(() => categories.flatMap(c => [c, ...(c.subcategories || [])]), [categories]);

    const budgetData = useMemo(() => {
        return budgets.map(budget => {
            const category = flatCategories.find(c => c.id === budget.category_id);
            if (!category) return null;

            const spent = getSpentAmountForCategory(category, transactions);
            const remaining = budget.limit - spent;
            const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

            return {
                ...budget,
                categoryName: category?.name || 'Bilinmeyen Kategori',
                spent,
                remaining,
                percentage: Math.min(percentage, 100)
            };
        }).filter(Boolean);
    }, [budgets, transactions, categories, flatCategories]);

    const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
    const [newLimit, setNewLimit] = useState('');

    const handleEdit = (budget: typeof budgetData[0]) => {
        if (!budget) return;
        setEditingBudgetId(budget.id);
        setNewLimit(String(budget.limit));
    };

    const handleSave = async (id: number) => {
        const limit = parseFloat(newLimit);
        if(!isNaN(limit) && limit > 0) {
            await onUpdateBudget(id, limit);
        }
        setEditingBudgetId(null);
        setNewLimit('');
    }

    const handleDelete = (id: number) => {
        if (window.confirm("Bu bütçeyi silmek istediğinizden emin misiniz?")) {
            onDeleteBudget(id);
        }
    }

    // Türkçe Açıklama:
    // Bütçeleri ana kategorilere göre grupla ve hiyerarşik göster
    const groupedBudgets = useMemo(() => {
        const grouped: { [key: string]: { parent: Category, budgets: typeof budgetData } } = {};
        
        budgetData.forEach(budget => {
            const category = flatCategories.find(c => c.id === budget.category_id);
            if (!category) return;
            
            // Ana kategoriyi bul (parent_id null olan)
            let parentCategory = category;
            if (category.parent_id) {
                parentCategory = flatCategories.find(c => c.id === category.parent_id) || category;
            }
            
            const groupKey = `${parentCategory.type}-${parentCategory.id}`;
            if (!grouped[groupKey]) {
                grouped[groupKey] = { parent: parentCategory, budgets: [] };
            }
            grouped[groupKey].budgets.push(budget);
        });
        
        return grouped;
    }, [budgetData, flatCategories]);

    const renderBudgetGroup = (groupKey: string, group: { parent: Category, budgets: typeof budgetData }, color: string) => {
        if (group.budgets.length === 0) return null;
        
        // Ana kategori bütçesi var mı kontrol et
        const parentBudget = group.budgets.find(b => b.category_id === group.parent.id);
        const subBudgets = group.budgets.filter(b => b.category_id !== group.parent.id);
        
        return (
            <div key={groupKey} className="mb-4 border border-brand-100 dark:border-slate-700 rounded-2xl p-4">
                <h4 className={`text-base font-bold mb-3 ${color}`}>
                    {group.parent.type === 'expense' ? '💸' : '📈'} {group.parent.name}
                </h4>
                
                {/* Ana kategori bütçesi */}
                {parentBudget && (
                    <div className="mb-4 p-3 bg-slate-50 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-slate-700">{parentBudget.categoryName}</span>
                            {editingBudgetId === parentBudget.id ? (
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="number"
                                        value={newLimit}
                                        onChange={(e) => setNewLimit(e.target.value)}
                                        className="w-24 text-right px-2 py-1 border border-slate-300 rounded-md text-sm"
                                    />
                                    <button onClick={() => handleSave(parentBudget.id)} className="text-brand-600 text-sm font-semibold">Kaydet</button>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-slate-500 cursor-pointer" onClick={() => handleEdit(parentBudget)}>{formatCurrency(parentBudget.spent)} / {formatCurrency(parentBudget.limit)}</span>
                                    <button onClick={() => handleDelete(parentBudget.id)} className="text-slate-400 hover:text-red-600">
                                        <TrashIcon />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                            <div 
                                className={`h-2.5 rounded-full ${parentBudget.percentage > 90 ? 'bg-red-500' : parentBudget.percentage > 75 ? 'bg-yellow-500' : 'bg-brand-500'}`}
                                style={{ width: `${parentBudget.percentage}%` }}
                            ></div>
                        </div>
                        {parentBudget.remaining < 0 && (
                            <p className="text-xs text-red-600 mt-1 flex items-center">
                                <ExclamationIcon className="h-4 w-4 mr-1" />
                                Bütçeyi {formatCurrency(Math.abs(parentBudget.remaining))} aştınız.
                            </p>
                        )}
                    </div>
                )}
                
                {/* Alt kategori bütçeleri */}
                {subBudgets.length > 0 && (
                    <div className="space-y-3">
                        <h5 className="text-sm font-medium text-slate-600">Alt Kategoriler:</h5>
                        {subBudgets.map(b => (
                            <div key={b.id} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-md">
                                <div className="flex-1">
                                    <span className="text-sm text-slate-700">- {b.categoryName}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    {editingBudgetId === b.id ? (
                                        <div className="flex items-center space-x-2">
                                            <input 
                                                type="number"
                                                value={newLimit}
                                                onChange={(e) => setNewLimit(e.target.value)}
                                                className="w-20 text-right px-2 py-1 border border-slate-300 rounded-md text-xs"
                                            />
                                            <button onClick={() => handleSave(b.id)} className="text-brand-600 text-xs font-semibold">Kaydet</button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-xs text-slate-500 cursor-pointer" onClick={() => handleEdit(b)}>{formatCurrency(b.spent)} / {formatCurrency(b.limit)}</span>
                                            <button onClick={() => handleDelete(b.id)} className="text-slate-400 hover:text-red-600">
                                                <TrashIcon />
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="w-16 bg-slate-200 rounded-full h-1.5 ml-2">
                                    <div 
                                        className={`h-1.5 rounded-full ${b.percentage > 90 ? 'bg-red-500' : b.percentage > 75 ? 'bg-yellow-500' : 'bg-brand-500'}`}
                                        style={{ width: `${b.percentage}%` }}
                                    ></div>
                                </div>
                                {b.remaining < 0 && (
                                    <ExclamationIcon className="h-3 w-3 text-red-500 ml-1" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-card border border-brand-100 dark:border-slate-700 p-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-4">Aylık Bütçeler</h3>
            {budgetData.length > 0 ? (
                <div>
                    {/* Gider kategorileri */}
                    {Object.entries(groupedBudgets)
                        .filter(([key]) => key.startsWith('expense-'))
                        .map(([key, group]) => renderBudgetGroup(key, group, "text-red-700"))}
                    
                    {/* Gelir kategorileri */}
                    {Object.entries(groupedBudgets)
                        .filter(([key]) => key.startsWith('income-'))
                        .map(([key, group]) => renderBudgetGroup(key, group, "text-brand-700"))}
                </div>
            ) : (
                <div className="text-center py-6">
                    <p className="text-slate-500">Henüz bütçe oluşturulmamış.</p>
                </div>
            )}
        </div>
    );
};

export default BudgetStatus;
