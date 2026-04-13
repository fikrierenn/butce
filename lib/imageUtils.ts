/**
 * Resim boyutlandırma utility'si
 * Fiş/makbuz fotoğraflarını Gemini API'ye göndermeden önce küçültür
 */
export const resizeImage = (file: File, maxSize: number = 512): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // En uzun kenarı maxSize'a ölçekle
                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context oluşturulamadı'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // JPEG sıkıştır — düşük kalite ama OCR için yeterli
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                console.log(`[imageUtils] Resized: ${width}x${height}, base64 len: ${dataUrl.length}`);
                const base64 = dataUrl.split(',')[1];

                resolve({ base64, mimeType: 'image/jpeg' });
            };
            img.onerror = () => reject(new Error('Resim yüklenemedi'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Dosya okunamadı'));
        reader.readAsDataURL(file);
    });
};
