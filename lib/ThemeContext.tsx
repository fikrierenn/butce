import React, { createContext, useContext, useEffect } from 'react';

// Türkçe Açıklama:
// Dark mode tamamen devre dışı. Context shape'i geriye dönük uyumluluk için
// korundu ama isDark her zaman false. Eski localStorage kaydı temizlenir ve
// html class'ından 'dark' her mount'ta kaldırılır. Bu sayede kod içinde
// kalan `dark:` Tailwind sınıfları etkisiz hale gelir — silmek zorunda
// değiliz, sadece asla aktive olmazlar.

interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ isDark: false, toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        try { localStorage.removeItem('spendme-theme'); } catch {}
    }, []);

    return (
        <ThemeContext.Provider value={{ isDark: false, toggleTheme: () => {} }}>
            {children}
        </ThemeContext.Provider>
    );
};
