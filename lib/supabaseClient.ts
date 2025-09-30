import { createClient } from '@supabase/supabase-js';

// Türkçe Açıklama:
// Supabase istemci kurulum dosyası. Güvenlik gereği URL ve Anon anahtarın
// ortam değişkenlerinde tutulması önerilir. Talebiniz doğrultusunda
// doğrudan sabit değerler kullanıyoruz.
// Lütfen gerçek projenizde bu değerleri .env üzerinden yönetmeyi değerlendirin.
const supabaseUrl = 'https://hyssdrivgkrydnharnhe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3Nkcml2Z2tyeWRuaGFybmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzU2MjMsImV4cCI6MjA3NDc1MTYyM30.aBOi5i3MIyoBGOU2LoxTHOkTcWDTIP71mvG0KN8D2_k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);