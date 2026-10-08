# Yakın Arkadaşlar Odası — React

React + Vite + Firebase + WebRTC ile hazırlanmış sürüm.

## Kurulum

```bash
npm install
npm run dev
```

Ardından terminalde verilen localhost adresini aç.

## Firebase

Kök dizinde `.env` dosyası oluştur ve Firebase Web App bilgilerini ekle:

```env
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

Firebase Console'da:
1. Authentication > Sign-in method > Anonymous girişini etkinleştir.
2. Firestore Database oluştur.
3. Firestore kurallarında giriş yapmış kullanıcıların ilgili `rooms` verilerine erişmesine izin ver.

## Özellikler

- İsmi browser cache’te hatırlama
- Random oda ID’si oluşturma
- Kullanıcının Firebase’de üyesi olduğu odaları listeleme
- Oda üyeliğinden ayrılma
- Son açık oda ve Firebase anonim oturumunu yenilemeden sonra koruma
- Firebase Firestore gerçek zamanlı sohbet
- Sesli görüşme
- Görüntülü görüşme
- Mikrofon/kamera açıp kapatma
- WebRTC + STUN
- Açık/koyu sistem temasına uyum

## Not

Son açık oda ve kullanıcı adı browser cache’inde tutulur. Oda üyelikleri Firebase’de tutulur. Bir odadan ayrılmak yalnızca mevcut kullanıcı üyeliğini ve o kullanıcının oda kaydını kaldırır; odadaki Firestore mesajları ve diğer üyeler etkilenmez.

WebRTC tarafında yalnızca STUN kullanıldığı için bazı ağlarda bağlantı kurulamayabilir. Daha sağlam internet görüşmeleri için TURN sunucusu eklenebilir.
