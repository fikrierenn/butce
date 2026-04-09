// Güncelleme indirme - platforma göre en iyi yöntemi dener
export const downloadUpdate = async (apkUrl: string) => {
    try {
        // Capacitor Browser plugin ile harici tarayıcıda aç
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: apkUrl });
        return;
    } catch {
        // Capacitor yoksa (web) normal aç
    }

    try {
        // window.open ile dene
        const w = window.open(apkUrl, '_blank');
        if (w) return;
    } catch {}

    // Son çare: location ile yönlendir
    window.location.href = apkUrl;
};
