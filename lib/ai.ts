// Türkçe Açıklama:
// AI çağrıları artık doğrudan client'tan değil, Supabase Edge Function
// üzerinden yapılır. API key'ler Edge Function'ın secrets'inde tutulur,
// bundle'a gömülmez — key leak sorunu tamamen çözülmüştür.
//
// Edge Function: ai-proxy (POST)
// Body: { mode: "text"|"receipt"|"sms", payload: string, categories: [...], accounts: [...] }

import { supabase } from './supabaseClient';
import { Category, Account } from '../types';

const AI_TIMEOUT_MS = 30_000;

async function callAIProxy(
    mode: 'text' | 'receipt' | 'sms',
    payload: string,
    categories: Category[],
    accounts: Account[],
    mimeType?: string,
): Promise<any> {
    const cats = categories.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        subcategories: c.subcategories?.map(s => ({ id: s.id, name: s.name })),
    }));
    const accs = accounts.map(a => ({ id: a.id, name: a.name, type: a.type }));

    // supabase.functions.invoke yerine düz fetch — AbortController ile
    // timeout kontrolü supabase client'ın internal fetch'ine müdahale edemez.
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = (supabase as any).supabaseUrl || process.env.SUPABASE_URL || '';
    const supabaseKey = (supabase as any).supabaseKey || process.env.SUPABASE_ANON_KEY || '';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
        const res = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token || supabaseKey}`,
                'apikey': supabaseKey,
            },
            body: JSON.stringify({ mode, payload, categories: cats, accounts: accs, mimeType }),
        });

        if (!res.ok) {
            const errBody = await res.text().catch(() => '');
            let msg = `AI proxy hatası (${res.status})`;
            try { msg = JSON.parse(errBody).error || msg; } catch {}
            throw new Error(msg);
        }

        const data = await res.json();
        if (data?.error) throw new Error(data.error);
        return data;
    } catch (e: any) {
        if (e.name === 'AbortError') {
            throw new Error('AI yanıt vermedi (30sn zaman aşımı). Tekrar deneyin.');
        }
        throw e;
    } finally {
        clearTimeout(timer);
    }
}

// Public API — TransactionForm ve diğer bileşenler bunları kullanır

export const parseTransactionWithAI = async (
    prompt: string,
    categories: Category[],
    accounts: Account[],
): Promise<any | null> => {
    return callAIProxy('text', prompt, categories, accounts, undefined);
};

export const parseReceiptWithAI = async (
    imageBase64: string,
    mimeType: string,
    categories: Category[],
    accounts: Account[],
): Promise<any | null> => {
    return callAIProxy('receipt', imageBase64, categories, accounts, mimeType);
};

export const parseSmsWithAI = async (
    smsText: string,
    categories: Category[],
    accounts: Account[],
): Promise<any[] | null> => {
    const result = await callAIProxy('sms', smsText, categories, accounts);
    return result?.transactions || [result];
};

// Backward compatibility — eski import'lar bozulmasın
export const parseTransactionWithGemini = parseTransactionWithAI;
export const parseReceiptWithGemini = parseReceiptWithAI;
export const parseSmsWithGemini = parseSmsWithAI;
