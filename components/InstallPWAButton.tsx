import React, { useEffect, useState } from 'react';

// Türkçe Açıklama:
// PWA kurulum butonu - Kullanıcıya uygulamayı ana ekrana ekleme imkanı sunar

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAButton: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        // PWA kurulum event'ini yakala
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowButton(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Zaten kurulmuş mu kontrol et
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowButton(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // Tarayıcı otomatik kurulum desteği vermiyor
            // Manuel talimatlar göster
            alert(
                '📱 Uygulamayı kurmak için:\n\n' +
                'Android (Chrome): Menü ⋮ → "Ana ekrana ekle"\n' +
                'iOS (Safari): Paylaş ⬆️ → "Ana Ekrana Ekle"'
            );
            return;
        }

        // Kurulum prompt'unu göster
        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ Kullanıcı PWA kurulumunu kabul etti');
            setShowButton(false);
        }
        
        setDeferredPrompt(null);
    };

    if (!showButton) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50">
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-slide-up">
                <div className="flex-1 mr-3">
                    <p className="font-semibold text-sm">Uygulamayı Kur</p>
                    <p className="text-xs text-brand-200">Ana ekranına ekle, hızlı erişim sağla!</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-brand-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-50 transition-colors"
                    >
                        Kur
                    </button>
                    <button
                        onClick={() => setShowButton(false)}
                        className="text-white hover:text-brand-200 px-2"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWAButton;

