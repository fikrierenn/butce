import React from 'react';

interface HeaderProps {
    title: string;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onLogout }) => {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-40 max-w-2xl mx-auto w-full">
            <div className="px-4 sm:px-6">
                <div className="flex justify-between items-center h-16">
                    <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                    <div className="flex items-center space-x-4">
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