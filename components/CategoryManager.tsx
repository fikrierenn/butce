import React, { useState } from 'react';
import { Category, Budget, TransactionType } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface CategoryManagerProps {
    categories: Category[]; // Hierarchical
    budgets: Budget[];
    selectedMonth?: string;
    setSelectedMonth?: (m: string) => void;
    onAddCategory: (category: Omit<Category, 'id' | 'user_id' | 'subcategories'>) => Promise<void>;
    onDeleteCategory: (id: number) => Promise<void>;
    onAddBudget: (categoryId: number, limit: number, month: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, budgets, selectedMonth, setSelectedMonth, onAddCategory, onDeleteCategory, onAddBudget }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
    const [parentId, setParentId] = useState<number | null>(null);
    const [budgetInputs, setBudgetInputs] = useState<{[key: number]: string}>({});
    const [isAddingCategory, setIsAddingCategory] = useState(false); // AJAX loading state
    // Türkçe Açıklama:
    // Üstten gelen ay değeri yoksa, güvenli varsayılan olarak bugünün ayını kullan.
    const month = selectedMonth ?? new Date().toLocaleDateString('en-CA').slice(0,7);

    // Türkçe Açıklama:
    // Seçili aya ait tüm bütçelerin toplamını hesapla (genel özet için)
    const monthlyBudgets = budgets.filter(b => !b.month || b.month === month);
    const totalMonthlyBudget = monthlyBudgets.reduce((sum, b) => sum + (b.limit || 0), 0);

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
        if (newCategoryName.trim() && !isAddingCategory) {
            setIsAddingCategory(true);
            try {
                await onAddCategory({
                    name: newCategoryName.trim(),
                    type: newCategoryType,
                    parent_id: parentId,
                });
                setNewCategoryName('');
                setParentId(null);
            } catch (error) {
                console.error('Kategori ekleme hatası:', error);
                alert('Kategori eklenirken hata oluştu. Lütfen tekrar deneyin.');
            } finally {
                setIsAddingCategory(false);
            }
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
                        disabled={isAddingCategory}
                        className={`p-2 text-white rounded-md ${isAddingCategory ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isAddingCategory ? '⏳' : <PlusIcon />}
                    </button>
                </div>
            </div>

            <div className="mt-6">
                {/* Ay seçici bu bölümde gösterilir */}
                <div className="mb-4 p-3 bg-slate-50 rounded-md inline-flex items-center gap-2">
                    <label className="text-sm text-slate-700">Ay (YYYY-MM):</label>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => setSelectedMonth && setSelectedMonth(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-md text-sm"
                    />
                </div>
                {/* Toplam aylık bütçe özeti */}
                <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-md flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-900">Toplam Aylık Bütçe</span>
                    <span className="text-base font-bold text-indigo-900">{totalMonthlyBudget.toLocaleString('tr-TR')} ₺</span>
                </div>

                <h3 className="font-semibold text-slate-800 mb-4">📊 Kategoriler ve Aylık Bütçeler</h3>
                
                {/* Gider Kategorileri */}
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-red-700 mb-3">💸 Gider Kategorileri</h4>
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
                                {(() => {
                                    // Ana kategori için alt kategorilerin bütçe toplamını göster
                                    const childrenSum = (parent.subcategories || []).reduce((sum, sub) => {
                                        const b = getBudgetForCategory(sub.id);
                                        return sum + (b ? b.limit : 0);
                                    }, 0);
                                    return (
                                        <span className="text-sm text-green-600 font-medium">
                                            Mevcut (Alt Toplam): {childrenSum.toLocaleString('tr-TR')} ₺
                                        </span>
                                    );
                                })()}
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

                {/* Harçlık türü kaldırıldı: Harçlıkları gider olarak kullanın */}

                {/* Gelir Kategorileri */}
                {categories.filter(c => c.type === 'income').length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-blue-700 mb-3">📈 Gelir Kategorileri</h4>
                        {categories.filter(c => c.type === 'income').map(parent => (
                            <div key={parent.id} className="mb-6 border border-blue-200 rounded-lg p-4 bg-blue-50">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-semibold text-blue-800 text-lg">{parent.name}</h4>
                                    <button onClick={() => handleDelete(parent.id, parent.name)} className="text-blue-400 hover:text-red-600">
                                        <TrashIcon />
                                    </button>
                                </div>

                                {/* Gelir bütçe girişi */}
                                <div className="mb-4 p-3 bg-white rounded-md border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-blue-700">Beklenen Aylık Gelir:</span>
                                        {(() => {
                                            // Gelir için alt kategorilerin bütçe toplamını göster
                                            const childrenSum = (parent.subcategories || []).reduce((sum, sub) => {
                                                const b = getBudgetForCategory(sub.id);
                                                return sum + (b ? b.limit : 0);
                                            }, 0);
                                            return (
                                                <span className="text-sm text-blue-600 font-medium">
                                                    Mevcut (Alt Toplam): {childrenSum.toLocaleString('tr-TR')} ₺
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            placeholder="Beklenen gelir (₺)"
                                            value={budgetInputs[parent.id] || ''}
                                            onChange={(e) => handleBudgetInputChange(parent.id, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-blue-300 rounded-md text-sm"
                                        />
                                        <button
                                            onClick={() => onAddBudget(parent.id, parseFloat(budgetInputs[parent.id] || '0'), month)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                        >
                                            {getBudgetForCategory(parent.id) ? 'Güncelle' : 'Kaydet'}
                                        </button>
                                    </div>
                                </div>

                                {/* Alt kategoriler */}
                                {parent.subcategories && parent.subcategories.length > 0 && (
                                    <div className="space-y-3">
                                        <h5 className="text-sm font-medium text-blue-600">Alt Kategoriler:</h5>
                                        {parent.subcategories.map(sub => (
                                            <div key={sub.id} className="flex items-center justify-between p-2 bg-white border border-blue-200 rounded-md">
                                                <div className="flex-1">
                                                    <span className="text-sm text-blue-700">- {sub.name}</span>
                                                    {getBudgetForCategory(sub.id) && (
                                                        <span className="ml-2 text-xs text-blue-600">
                                                            ({getBudgetForCategory(sub.id)?.limit.toLocaleString('tr-TR')} ₺/ay)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Gelir"
                                                        value={budgetInputs[sub.id] || ''}
                                                        onChange={(e) => handleBudgetInputChange(sub.id, e.target.value)}
                                                        className="w-20 px-2 py-1 border border-blue-300 rounded text-xs"
                                                    />
                                                    <button
                                                        onClick={() => onAddBudget(sub.id, parseFloat(budgetInputs[sub.id] || '0'), month)}
                                                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                                    >
                                                        {getBudgetForCategory(sub.id) ? '↻' : '+'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(sub.id, sub.name)} 
                                                        className="text-blue-400 hover:text-red-600"
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
                )}
            </div>

            {/* Ay seçici üst ekrana taşındı */}
        </div>
    );
};

export default CategoryManager;
