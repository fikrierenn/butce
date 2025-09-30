import React from 'react';
import HomeIcon from './icons/HomeIcon';
import ListIcon from './icons/ListIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import CogIcon from './icons/CogIcon';
import PlusIcon from './icons/PlusIcon';

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
    const activeClass = isActive ? 'text-indigo-600' : 'text-slate-500';
    return (
        <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ease-in-out hover:text-indigo-600 ${activeClass}`}>
            {icon}
            <span className="text-xs mt-1">{label}</span>
        </button>
    );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeScreen, setActiveScreen, onAddTransactionClick }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] max-w-2xl mx-auto border-t border-slate-200">
            <div className="flex justify-around items-center h-16">
                <NavItem 
                    label="Anasayfa"
                    icon={<HomeIcon />}
                    isActive={activeScreen === 'home'}
                    onClick={() => setActiveScreen('home')}
                />
                <NavItem 
                    label="İşlemler"
                    icon={<ListIcon />}
                    isActive={activeScreen === 'transactions'}
                    onClick={() => setActiveScreen('transactions')}
                />
                
                <div className="w-16 h-16 flex items-center justify-center">
                    <button
                        onClick={onAddTransactionClick}
                        className="bg-indigo-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 -mt-8 border-4 border-white"
                        aria-label="Yeni İşlem Ekle"
                    >
                        <PlusIcon />
                    </button>
                </div>
                
                <NavItem 
                    label="Bütçeler"
                    icon={<ChartPieIcon />}
                    isActive={activeScreen === 'budgets'}
                    onClick={() => setActiveScreen('budgets')}
                />
                <NavItem 
                    label="Ayarlar"
                    icon={<CogIcon />}
                    isActive={activeScreen === 'settings'}
                    onClick={() => setActiveScreen('settings')}
                />
            </div>
        </nav>
    );
};

export default BottomNavBar;