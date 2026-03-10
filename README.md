# 🏃 RunTogether PWA

Arkadaşlarınla koşu rotalarını paylaş, birbirinizi koşuya davet edin!

**PWA** = Progressive Web App — tarayıcıdan "Ana Ekrana Ekle" diyerek telefona kurulur, uygulama gibi çalışır.

---

## 🚀 Vercel'e Deploy (5 Dakika, Tamamen Ücretsiz)

### Yöntem 1: GitHub üzerinden (Önerilen)

**1. GitHub'a yükle:**
```bash
cd runtogether-pwa
git init
git add .
git commit -m "RunTogether PWA"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/runtogether.git
git push -u origin main
```

**2. Vercel'e bağla:**
- https://vercel.com adresine git
- "Sign Up" → GitHub hesabınla giriş yap (ücretsiz)
- "New Project" → GitHub reposunu seç
- "Deploy" butonuna bas
- 1-2 dakika bekle → Canlı link hazır! 🎉

Link formatı: `https://runtogether-XXXXX.vercel.app`

**3. Arkadaşlarına gönder:**
Linki WhatsApp grubuna at. Herkes telefonundan açsın.

---

### Yöntem 2: Vercel CLI ile (Tek Komut)

```bash
# Vercel CLI yükle
npm install -g vercel

# Deploy et
cd runtogether-pwa
npm install
vercel
```

İlk seferde hesap açmanı ister, sonra tek komutla canlıya alır.

---

## 📱 Telefona "Uygulama" Olarak Kurma

### iPhone
1. Safari'de linki aç
2. Alt bardaki paylaş butonuna (↑) bas
3. "Ana Ekrana Ekle" seç
4. "Ekle" bas → Ana ekranda ikon belirir!

### Android
1. Chrome'da linki aç
2. Üstte çıkan "Uygulamayı yükle" bannerına bas
   (veya ⋮ menüden "Ana ekrana ekle")
3. "Yükle" bas → Uygulama yüklendi!

---

## 💻 Yerelde Çalıştırma (Geliştirme)

```bash
cd runtogether-pwa
npm install
npm run dev
```

Tarayıcıda http://localhost:5173 adresine git.

---

## 📂 Dosya Yapısı

```
runtogether-pwa/
├── index.html          ← PWA meta tagları
├── vite.config.js      ← Build ayarları
├── vercel.json         ← Deploy ayarları
├── package.json
├── public/
│   ├── manifest.json   ← PWA manifest (ikon, tema, isim)
│   ├── sw.js           ← Service Worker (offline destek)
│   ├── icon-192.svg    ← Uygulama ikonu
│   └── icon-512.svg    ← Büyük ikon
└── src/
    ├── main.jsx        ← Giriş noktası
    ├── App.jsx         ← Tüm ekranlar ve bileşenler
    └── data/
        └── index.js    ← Mock veriler ve sabitler
```

---

## 🔧 Özelleştirme

**Uygulama adını değiştir:** `public/manifest.json` → `name` alanı

**Tema rengini değiştir:** `public/manifest.json` → `theme_color`

**Kendi verini ekle:** `src/data/index.js` → MOCK_ROUTES ve MOCK_USERS

**Özel ikon:** `public/icon-192.svg` ve `icon-512.svg` dosyalarını değiştir

---

## ⏭️ İleri Adımlar

Bu şu an mock veriyle çalışan frontend prototipi. Gerçek backend eklemek istersen:

1. **Firebase Firestore** → Ücretsiz, gerçek zamanlı veritabanı
2. **Firebase Auth** → Google/Apple ile giriş
3. **Vercel KV** → Basit key-value depolama
4. **Supabase** → Açık kaynak Firebase alternatifi

Bunlardan birini eklemek istersen bana sor!
