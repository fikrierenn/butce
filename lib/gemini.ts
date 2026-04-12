// Backward compatibility shim — lib/ai.ts üzerinden Supabase Edge Function proxy.
export {
    parseTransactionWithAI as parseTransactionWithGemini,
    parseReceiptWithAI as parseReceiptWithGemini,
    parseSmsWithAI as parseSmsWithGemini,
} from './ai';
