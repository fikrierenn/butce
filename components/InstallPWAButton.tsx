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
            <div className="bg-indigo-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-between">
                <div className="flex-1 mr-3">
                    <p className="font-semibold">📱 Uygulamayı Kur</p>
                    <p className="text-sm text-indigo-100">Ana ekranına ekle, hızlı erişim sağla!</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-50 transition-colors"
                    >
                        Kur
                    </button>
                    <button
                        onClick={() => setShowButton(false)}
                        className="text-white hover:text-indigo-100 px-2"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWAButton;

