import { createClient } from '@supabase/supabase-js';

// Türkçe Açıklama:
// Supabase istemci kurulum dosyası. Güvenlik gereği URL ve Anon anahtarın
// ortam değişkenlerinde tutulması önerilir. Talebiniz doğrultusunda
// doğrudan sabit değerler kullanıyoruz.
// Lütfen gerçek projenizde bu değerleri .env üzerinden yönetmeyi değerlendirin.
const supabaseUrl = 'https://wrvjzzjvdnwfdxskwnof.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indydmp6emp2ZG53ZmR4c2t3bm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzQxODMsImV4cCI6MjA5MTI1MDE4M30._cDHpfvKQdjfshHYq4Dhj771tg-n1EDG1NEZbzrocf4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);