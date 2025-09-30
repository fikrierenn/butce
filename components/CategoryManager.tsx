import React, { useState } from 'react';
import { Category, Budget, TransactionType } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

interface CategoryManagerProps {
    categories: Category[]; // Hierarchical
    budgets: Budget[];
    onAddCategory: (category: Omit<Category, 'id' | 'user_id' | 'subcategories'>) => Promise<void>;
    onDeleteCategory: (id: number) => Promise<void>;
    onAddBudget: (categoryId: number, limit: number) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, budgets, onAddCategory, onDeleteCategory, onAddBudget }) => {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
    const [parentId, setParentId] = useState<number | null>(null);

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
                 {categories.filter(c => c.type === 'expense').map(parent => (
                    <div key={parent.id} className="mb-4">
                        <div className="flex justify-between items-center bg-slate-100 p-2 rounded-md">
                            <h4 className="font-semibold text-slate-800">{parent.name}</h4>
                            <button onClick={() => handleDelete(parent.id, parent.name)} className="text-slate-400 hover:text-red-600"><TrashIcon /></button>
                        </div>
                        <ul className="pl-4 mt-2 space-y-2">
                            {parent.subcategories?.map(sub => (
                                <li key={sub.id} className="flex justify-between items-center">
                                    <span>- {sub.name}</span>
                                    <button onClick={() => handleDelete(sub.id, sub.name)} className="text-slate-400 hover:text-red-600"><TrashIcon /></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManager;
