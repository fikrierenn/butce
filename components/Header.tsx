import React from 'react';
import { User } from '@supabase/supabase-js';
import BellIcon from './icons/BellIcon';

interface HeaderProps {
    title: string;
    user: User | null;
    onLogout: () => void;
    activeScreen?: string;
    unreadCount?: number;
    onBellClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, user, activeScreen, unreadCount = 0, onBellClick }) => {
    // Kullanıcı adını email'den türet (@ öncesi)
    const displayName = user?.email ? user.email.split('@')[0].replace(/[._-]/g, ' ') : 'User';
    const capitalized = displayName.charAt(0).toUpperCase() + displayName.slice(1);

    const isHome = activeScreen === 'home' || !activeScreen;
    const showBadge = unreadCount > 0;

    return (
        <header className="sticky top-0 z-40 max-w-2xl mx-auto w-full bg-brand-50/80 backdrop-blur-lg">
            <div className="px-5 pt-4 pb-3">
                <div className="flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                        {isHome ? (
                            <>
                                <p className="text-xs font-medium text-slate-500">
                                    Hoş geldin <span aria-hidden>👋</span>
                                </p>
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate mt-0.5">
                                    {capitalized}
                                </h1>
                            </>
                        ) : (
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight truncate">
                                {title}
                            </h1>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onBellClick}
                        className="relative w-11 h-11 rounded-2xl bg-white shadow-card border border-brand-100 flex items-center justify-center text-slate-700 hover:text-brand-600 active:scale-95 transition-all"
                        aria-label={`Bildirimler${showBadge ? ` (${unreadCount} okunmamış)` : ''}`}
                    >
                        <BellIcon className="w-5 h-5" />
                        {showBadge && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full ring-2 ring-white flex items-center justify-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
