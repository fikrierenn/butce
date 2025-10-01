import React from 'react';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
    title: string;
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, user, onLogout }) => {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-40 max-w-2xl mx-auto w-full">
            <div className="px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">
                    <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                    <div className="flex items-center space-x-4">
                        {user?.email && (
                            <span className="text-xs text-gray-500 hidden sm:inline">
                                {user.email}
                            </span>
                        )}
                        <button
                            onClick={onLogout}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;