// Türkçe Açıklama:
// Geriye dönük uyumluluk shim'i. Asıl kod lib/ai.ts'te (Grok primary,
// Gemini fallback). Eski import path'leri bozulmasın diye bu dosya
// sadece re-export yapar. Yeni kodda lib/ai.ts'i direkt import et.

export {
    parseTransactionWithAI as parseTransactionWithGemini,
    parseReceiptWithAI as parseReceiptWithGemini,
    parseSmsWithAI as parseSmsWithGemini,
    lastAIUsed,
} from './ai';
