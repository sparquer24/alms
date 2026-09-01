export async function compressImageToBase64(file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            // Non images: resolve with original file as data URL (reader)
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
            return;
        }

        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => { img.src = String(reader.result); };
        reader.onerror = reject;
        img.onload = () => {
            let { width, height } = img;
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(50, width);
            canvas.height = Math.max(50, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Cannot get canvas context'));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            try {
                const base64 = canvas.toDataURL('image/jpeg', quality);
                resolve(base64);
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = () => reject(new Error('Image load error'));
        reader.readAsDataURL(file);
    });
}
