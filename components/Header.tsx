import React from 'react';
import { User } from '@supabase/supabase-js';
import SpendMeLogo from './icons/SpendMeLogo';
import { useTheme } from '../lib/ThemeContext';
import { useI18n } from '../lib/i18n';

interface HeaderProps {
    title: string;
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, user, onLogout }) => {
    const { isDark, toggleTheme } = useTheme();
    const { t } = useI18n();
    return (
        <header className="bg-gradient-to-r from-brand-600 to-brand-700 sticky top-0 z-40 max-w-2xl mx-auto w-full">
            <div className="px-4 sm:px-5">
                <div className="flex justify-between items-center h-14">
                    <div className="flex items-center gap-2.5">
                        <SpendMeLogo size={28} />
                        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {user?.email && (
                            <span className="text-xs text-brand-200 truncate max-w-28 sm:max-w-44 hidden sm:block">
                                {user.email}
                            </span>
                        )}
                        <button onClick={toggleTheme} className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors text-brand-100 hover:text-white">
                            {isDark ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            )}
                        </button>
                        <button
                            onClick={onLogout}
                            className="text-xs font-medium text-brand-100 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/10"
                        >
                            {t('settings.logout')}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
