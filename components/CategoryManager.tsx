import React, { useState } from 'react';
import { Category, Budget, TransactionType } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface CategoryManagerProps {
    categories: Category[]; // Hierarchical
    budgets: Budget[];
    selectedMonth?: string;
    onAddCategory: (category: Omit<Category, 'id' | 'user_id' | 'subcategories'>) => Promise<void>;
    onDeleteCategory: (id: number) => Promise<void>;
    onAddBudget: (categoryId: number, limit: number, month: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, budgets, selectedMonth, onAddCategory, onDeleteCategory, onAddBudget }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
    const [parentId, setParentId] = useState<number | null>(null);
    const [budgetInputs, setBudgetInputs] = useState<{[key: number]: string}>({});
    // Türkçe Açıklama:
    // Üstten gelen ay değeri yoksa, güvenli varsayılan olarak bugünün ayını kullan.
    const month = selectedMonth ?? new Date().toLocaleDateString('en-CA').slice(0,7);

    // Türkçe Açıklama:
    // Belirli bir kategori için bütçe var mı kontrol et
    const getBudgetForCategory = (categoryId: number) => {
        return budgets.find(b => b.category_id === categoryId);
    };

    // Bütçe input değerini güncelle
    const handleBudgetInputChange = (categoryId: number, value: string) => {
        setBudgetInputs(prev => ({
            ...prev,
            [categoryId]: value
        }));
    };

    // Bütçe kaydet
    const handleSaveBudget = (categoryId: number) => {
        const amount = parseFloat(budgetInputs[categoryId] || '0');
        if (amount > 0) {
            onAddBudget(categoryId, amount);
            setBudgetInputs(prev => ({
                ...prev,
                [categoryId]: ''
            }));
        }
    };

    const handleAddCategory = async () => {
        if (newCategoryName.trim()) {
            await onAddCategory({
                name: newCategoryName.trim(),
                type: newCategoryType,
                parent_id: parentId,
            });
            setNewCategoryName('');
            setParentId(null);
        }
    };
    
    const handleDelete = (id: number, name: string) => {
        if(window.confirm(`'${name}' kategorisini ve tüm alt kategorilerini silmek istediğinizden emin misiniz?`)) {
            onDeleteCategory(id);
        }
    }
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-slate-700 mb-4">Kategori ve Bütçe Yönetimi</h2>

            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                <h3 className="font-semibold text-slate-800">Yeni Kategori Ekle</h3>
                 <select
                    value={parentId === null ? '' : parentId}
                    onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border-slate-300 rounded-md text-sm"
                >
                    <option value="">Ana Kategori Olarak Ekle</option>
                    {categories.filter(c => c.type === newCategoryType).map(c => (
                        <option key={c.id} value={c.id}>Alt Kategori Olarak Ekle: {c.name}</option>
                    ))}
                </select>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Kategori Adı"
                        className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md text-sm"
                    />
                    <select
                        value={newCategoryType}
                        onChange={(e) => {setNewCategoryType(e.target.value as any); setParentId(null);}}
                        className="px-3 py-2 border-slate-300 rounded-md text-sm"
                    >
                        <option value="expense">Gider</option>
                        <option value="income">Gelir</option>
                    </select>
                    <button
                        onClick={handleAddCategory}
                        className="p-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        <PlusIcon />
                    </button>
                </div>
            </div>

            <div className="mt-6">
                <h3 className="font-semibold text-slate-800 mb-4">📊 Gider Kategorileri ve Aylık Bütçeler</h3>
                {categories.filter(c => c.type === 'expense').map(parent => (
                    <div key={parent.id} className="mb-6 border border-slate-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-slate-800 text-lg">{parent.name}</h4>
                            <button onClick={() => handleDelete(parent.id, parent.name)} className="text-slate-400 hover:text-red-600">
                                <TrashIcon />
                            </button>
                        </div>

                        {/* Ana kategori bütçe girişi */}
                        <div className="mb-4 p-3 bg-slate-50 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-slate-700">Aylık Bütçe:</span>
                                {getBudgetForCategory(parent.id) && (
                                    <span className="text-sm text-green-600 font-medium">
                                        Mevcut: {getBudgetForCategory(parent.id)?.limit.toLocaleString('tr-TR')} ₺
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Aylık bütçe (₺)"
                                    value={budgetInputs[parent.id] || ''}
                                    onChange={(e) => handleBudgetInputChange(parent.id, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
                                />
                                <button
                                    onClick={() => onAddBudget(parent.id, parseFloat(budgetInputs[parent.id] || '0'), month)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                                >
                                    {getBudgetForCategory(parent.id) ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </div>

                        {/* Alt kategoriler */}
                        {parent.subcategories && parent.subcategories.length > 0 && (
                            <div className="space-y-3">
                                <h5 className="text-sm font-medium text-slate-600">Alt Kategoriler:</h5>
                                {parent.subcategories.map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-md">
                                        <div className="flex-1">
                                            <span className="text-sm text-slate-700">- {sub.name}</span>
                                            {getBudgetForCategory(sub.id) && (
                                                <span className="ml-2 text-xs text-green-600">
                                                    ({getBudgetForCategory(sub.id)?.limit.toLocaleString('tr-TR')} ₺/ay)
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                placeholder="Bütçe"
                                                value={budgetInputs[sub.id] || ''}
                                                onChange={(e) => handleBudgetInputChange(sub.id, e.target.value)}
                                                className="w-20 px-2 py-1 border border-slate-300 rounded text-xs"
                                            />
                                            <button
                                                onClick={() => onAddBudget(sub.id, parseFloat(budgetInputs[sub.id] || '0'), month)}
                                                className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs"
                                            >
                                                {getBudgetForCategory(sub.id) ? '↻' : '+'}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(sub.id, sub.name)} 
                                                className="text-slate-400 hover:text-red-600"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Ay seçici üst ekrana taşındı */}
        </div>
    );
};

export default CategoryManager;
