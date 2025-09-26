import { useState } from 'react';
import { compressImageToBase64 } from '../utils/imageCompress';

export default function useFileUpload() {
    const [uploads, setUploads] = useState<Record<string, { file: File; preview: string; base64?: string }>>({});

    const add = async (key: string, file: File) => {
        // create lightweight preview and compressed base64 for API
        const preview = URL.createObjectURL(file);
        let base64: string | undefined;
        try { base64 = await compressImageToBase64(file, 800, 800, 0.6); } catch (e) { /* fallback to raw */
            base64 = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); });
        }
        setUploads(prev => ({ ...prev, [key]: { file, preview, base64 } }));
    };
    const remove = (key: string) => { setUploads(prev => { const n = { ...prev }; const item = n[key]; if (item) URL.revokeObjectURL(item.preview); delete n[key]; return n; }); };
    const clearAll = () => { Object.values(uploads).forEach(i => URL.revokeObjectURL(i.preview)); setUploads({}); };
    return { uploads, add, remove, clearAll };
}
