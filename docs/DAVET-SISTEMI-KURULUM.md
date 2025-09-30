# 🎟️ Davet Kodu Sistemi - Kurulum Kılavuzu

Bu kılavuz, SpendMe uygulamanızda davet kodu sisteminihazırlama ve yeni kullanıcıları davet etmek için gerekli adımları açıklar.

## 📋 Adım 1: SQL Tablosunu Oluşturun

1. **Supabase Dashboard**'a gidin
2. Sol menüden **SQL Editor**'ü açın
3. **New Query** butonuna tıklayın
4. `docs/invite-system-setup.sql` dosyasındaki **TÜM SQL kodunu** kopyalayıp yapıştırın
5. **RUN** butonuna basın

Bu script şunları oluşturur:
- `invite_codes` tablosu
- `allowed_users` tablosu (kullanıcı izin listesi)
- Davet kodu yönetim fonksiyonları

## ✅ Adım 2: Kendinizi İzinli Listeye Ekleyin

**ÖNEMLİ:** Önce kendinizi izinli listeye ekleyin, yoksa siz bile giremezsiniz!

SQL Editor'de şu komutu çalıştırın (kendi email adresinizi yazın):

```sql
INSERT INTO public.allowed_users (email, notes)
VALUES ('sizin-email@gmail.com', 'Admin - İlk kullanıcı');
```

## 🎫 Adım 3: İlk Davet Kodunuzu Oluşturun

### Yöntem 1: SQL ile

```sql
-- Genel davet kodu (herkes kullanabilir)
SELECT * FROM public.create_invite_code();

-- Belirli bir email için davet (sadece o kişi kullanabilir)
SELECT * FROM public.create_invite_code('arkadas@gmail.com', 'Arkadaşım Ali', 7);
```

### Yöntem 2: Uygulama Arayüzü ile (Önerilen)

1. Uygulamaya giriş yapın
2. **Ayarlar** (⚙️) sekmesine gidin
3. **Davet Kodu Yönetimi** bölümünü görünse  
4. Formu doldur ve **Davet Kodu Oluştur** butonuna bas
5. Oluşturulan linki kopyala ve gönderin

## 📧 Adım 4: Davet Linkini Gönderin

Davet kodu oluşturduktan sonra şu formatta bir link alırsınız:

```
https://butce.netlify.app?invite=ABC12345
```

Bu linki:
- WhatsApp ile gönderebilirsiniz
- Email ile gönderebilirsiniz
- SMS ile gönderebilirsiniz

Alternatif olarak, sadece **kodu** (örn: `ABC12345`) gönderip kullanıcının manuel girmesini isteyebilirsiniz.

## 🔍 Davet Kodlarınızı Yönetin

### Uygulama İçinden:

**Ayarlar** → **Davet Kodu Yönetimi** bölümünde:
- Tüm davetlerinizi görebilirsiniz
- Kullanılmış/kullanılmamış durumlarını takip edebilirsiniz
- Kullanılmayan davetleri silebilirsiniz
- Linki tek tıklamayla kopyalayabilirsiniz

### SQL ile:

```sql
-- Tüm davetleri listele
SELECT * FROM public.get_my_invites();

-- Kullanılmayan bir daveti sil
SELECT public.delete_invite('ABC12345');

-- İzinli kullanıcıları listele
SELECT * FROM public.allowed_users ORDER BY added_at DESC;
```

## 🚀 Kullanıcı Deneyimi Akışı

### 1. Yeni Kullanıcı İçin:

1. Davet linkine tıklar → `https://butce.netlify.app?invite=ABC12345`
2. Google ile giriş yapar
3. Sistem otomatik olarak davet kodunu doğrular
4. Kod geçerliyse, kullanıcı izinli listeye eklenir
5. Uygulamayı kullanmaya başlar

### 2. Davet Kodu Olmayan Kullanıcı:

1. Uygulamaya normal giriş yapar
2. İzinli listede değilse, **Davet Kodu Gerekli** ekranı gösterilir
3. Davet kodunu manuel girer
4. Doğrulanırsa uygulamaya erişim sağlar

## ⚙️ Ayarlar ve Özelleştirme

### Base URL Değiştirme

`docs/invite-system-setup.sql` dosyasında 2 yerde `base_url` değişkenini güncelleyin:

```sql
-- Satır 37
base_url text := 'https://sizin-domain.com';

-- Satır 124
'https://sizin-domain.com?invite=' || ic.code as invite_url
```

### Davet Geçerlilik Süresi

- Varsayılan: 7 gün
- Değiştirmek için: `create_invite_code` çağrısında `days_valid` parametresini kullanın

```sql
SELECT * FROM public.create_invite_code('user@gmail.com', 'Not', 30); -- 30 gün geçerli
```

## 🧪 Test Etme

1. İzinli listeye eklenmemiş bir Gmail hesabıyla giriş yapmayı deneyin
2. **"Davet Kodu Gerekli"** ekranını görmelisiniz
3. Geçerli bir davet kodu girin veya davet linkini kullanın
4. Başarılıyla giriş yapabilmelisiniz

## 📝 Güvenlik Notları

- ⚠️ **İLK ADIM:** Kendinizi mutlaka izinli listeye ekleyin!
- 🔒 Davet kodları 8 karakterli, benzersiz ve büyük harfle oluşturulur
- ⏰ Süresi dolan davet kodları otomatik olarak geçersiz olur
- 🚫 Kullanılmış davet kodları tekrar kullanılamaz
- 📧 Email-specific davetler sadece belirtilen email ile kullanılabilir

## 🔄 GitHub'a Push

Tüm değişiklikleri kaydetmek için:

```bash
git add .
git commit -m "feat: Davet kodu sistemi eklendi - kullanıcı yönetimi"
git push origin main
```

## 💡 İpuçları

1. **Toplu Davet:** Birden fazla kişiyi davet etmek için döngü kullanabilirsiniz:

```sql
DO $$
DECLARE
    i INT;
    new_code text;
BEGIN
    FOR i IN 1..10 LOOP
        SELECT code INTO new_code FROM public.create_invite_code() LIMIT 1;
        RAISE NOTICE 'Kod %: %', i, new_code;
    END LOOP;
END $$;
```

2. **Davet İstatistikleri:**

```sql
SELECT 
    COUNT(*) as toplam_davet,
    COUNT(*) FILTER (WHERE is_used) as kullanilmis,
    COUNT(*) FILTER (WHERE NOT is_used AND expires_at > now()) as aktif
FROM public.invite_codes
WHERE created_by = auth.uid();
```

## 🆘 Sorun Giderme

**Davet kodu çalışmıyor:**
- SQL scriptinin tamamen çalıştığından emin olun
- `allowed_users` tablosunun oluştuğunu kontrol edin
- Kodun doğru yazıldığından emin olun (büyük harf, 8 karakter)

**"is_user_allowed function not found" hatası:**
- `invite-system-setup.sql` scriptini tekrar çalıştırın
- Supabase'de **Database** → **Functions** bölümünü kontrol edin

**Davet linki localhost'a yönlendiriyor:**
- SQL scriptindeki `base_url` değerlerini güncelleyin
- Netlify URL'inizi doğru yazdığınızdan emin olun

