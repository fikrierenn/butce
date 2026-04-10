import React from 'react';
import { User } from '@supabase/supabase-js';
import BellIcon from './icons/BellIcon';
import { useI18n } from '../lib/i18n';

interface HeaderProps {
    title: string;
    user: User | null;
    onLogout: () => void;
    activeScreen?: string;
}

const Header: React.FC<HeaderProps> = ({ title, user, activeScreen }) => {
    const { t } = useI18n();

    // Kullanıcı adını email'den türet (@ öncesi)
    const displayName = user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ') : 'User';
    const capitalized = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    const isHome = activeScreen === 'home' || !activeScreen;

    return (
        <header className="sticky top-0 z-40 max-w-2xl mx-auto w-full bg-brand-50/80 dark:bg-surface-dark/80 backdrop-blur-lg">
            <div className="px-5 pt-4 pb-3">
                <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                        {isHome ? (
                            <>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Hoş geldin <span aria-hidden>👋</span>
                                </p>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate mt-0.5">
                                    {capitalized}
                                </h1>
                            </>
                        ) : (
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                                {title}
                            </h1>
                        )}
                    </div>
                    <button
                        type="button"
                        className="relative w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 shadow-card border border-brand-100 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-brand-600 active:scale-95 transition-all"
                        aria-label="Notifications"
                    >
                        <BellIcon className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
