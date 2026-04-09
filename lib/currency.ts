// Global para birimi formatlama
const getCurrency = (): string => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('spendme-currency') || 'TRY';
    }
    return 'TRY';
};

const getLocale = (): string => {
    if (typeof window !== 'undefined') {
        const lang = localStorage.getItem('spendme-language') || 'tr';
        const localeMap: Record<string, string> = {
            tr: 'tr-TR', en: 'en-US', de: 'de-DE', fr: 'fr-FR',
            es: 'es-ES', ar: 'ar-SA', ru: 'ru-RU', ja: 'ja-JP',
            zh: 'zh-CN', pt: 'pt-BR',
        };
        return localeMap[lang] || 'tr-TR';
    }
    return 'tr-TR';
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(getLocale(), {
        style: 'currency',
        currency: getCurrency(),
    }).format(amount);
};

export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(getLocale(), {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
};
