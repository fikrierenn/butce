import React from 'react';
import HomeIcon from './icons/HomeIcon';
import ListIcon from './icons/ListIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import CogIcon from './icons/CogIcon';
import PlusIcon from './icons/PlusIcon';
import { useI18n } from '../lib/i18n';

interface BottomNavBarProps {
    activeScreen: string;
    setActiveScreen: (screen: string) => void;
    onAddTransactionClick: () => void;
}

const NavItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    const activeClass = isActive ? 'nav-indicator active text-brand-600 font-medium' : 'nav-indicator text-slate-400';
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-all duration-150 hover:text-brand-600 ${activeClass}`}>
            {icon}
            <span className="text-[10px] mt-0.5 font-medium">{label}</span>
        </button>
    );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeScreen, setActiveScreen, onAddTransactionClick }) => {
    const { t } = useI18n();
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg shadow-nav max-w-2xl mx-auto z-30 pb-safe">
            <div className="flex justify-around items-center h-16">
                <NavItem
                    label={t('nav.home')}
                    icon={<HomeIcon />}
                    isActive={activeScreen === 'home'}
                    onClick={() => setActiveScreen('home')}
                />
                <NavItem
                    label={t('nav.transactions')}
                    icon={<ListIcon />}
                    isActive={activeScreen === 'transactions'}
                    onClick={() => setActiveScreen('transactions')}
                />

                <div className="w-16 h-16 flex items-center justify-center">
                    <button
                        onClick={onAddTransactionClick}
                        className="bg-gradient-to-br from-brand-400 to-brand-600 text-white rounded-2xl w-14 h-14 flex items-center justify-center shadow-fab hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 -mt-7"
                        aria-label={t('nav.addTransaction')}
                    >
                        <PlusIcon />
                    </button>
                </div>

                <NavItem
                    label={t('nav.reports')}
                    icon={<ChartBarIcon />}
                    isActive={activeScreen === 'reports'}
                    onClick={() => setActiveScreen('reports')}
                />
                <NavItem
                    label={t('nav.settings')}
                    icon={<CogIcon />}
                    isActive={activeScreen === 'settings'}
                    onClick={() => setActiveScreen('settings')}
                />
            </div>
        </nav>
    );
};

export default BottomNavBar;
