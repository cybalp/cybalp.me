# Admin Panel Kurulum Rehberi

## Özet

Admin panel `/admin-panel` adresinde çalışır. GitHub OAuth ile giriş yapılır. Post CRUD, Dashboard ve (yakında) Config/Media yönetimi sunar.

---

## 1. Bağımlılıkları Yükle

```bash
pnpm install
```

*(CodeMirror paketleri eklendi; ileride markdown editörü için kullanılacak.)*

---

## 2. GitHub OAuth Uygulaması

Admin panel, mevcut **Decap CMS** OAuth akışını kullanır. Zaten `astro-decap-cms-oauth` kurulu.

### GitHub OAuth App Oluşturma

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. **Application name:** `CybAlp Admin` (veya istediğin isim)
3. **Homepage URL:** `https://cybalp.me` (production) veya `http://localhost:4321` (local)
4. **Authorization callback URL:**
   - Production: `https://cybalp.me/oauth/callback`
   - Local: `http://localhost:4321/oauth/callback`
5. **Register application** → **Client ID** ve **Client secret** oluştur

### .env Dosyası

Proje kökünde `.env` oluştur:

```env
OAUTH_GITHUB_CLIENT_ID=your_client_id
OAUTH_GITHUB_CLIENT_SECRET=your_client_secret
```

> **@hint** Bu değişkenler `astro-decap-cms-oauth` tarafından kullanılır. Astro 5 env schema ile tanımlıdır.

### Opsiyonel: Repo Override

Varsayılan repo `cybalp/cybalp.me`. Farklı bir repo kullanacaksan:

```env
ADMIN_GITHUB_REPO_OWNER=your_org
ADMIN_GITHUB_REPO_NAME=your_repo
```

---

## 3. Local Geliştirme

```bash
pnpm dev
```

Tarayıcıda: **http://localhost:4321/admin-panel/**

1. "Sign in with GitHub" tıkla
2. Popup açılır → GitHub’da yetkilendir
3. Popup kapanır, admin panel açılır

> **Not:** Popup engelleyici kapalı olmalı.

---

## 4. Production Deploy (Vercel)

1. Vercel projesinde **Environment Variables** ekle:
   - `OAUTH_GITHUB_CLIENT_ID`
   - `OAUTH_GITHUB_CLIENT_SECRET`
   - (Opsiyonel) `ADMIN_GITHUB_REPO_OWNER`, `ADMIN_GITHUB_REPO_NAME`

2. GitHub OAuth App callback URL’ini production domain’e ayarla:
   - `https://cybalp.me/oauth/callback` (veya kendi domain’in)

3. Deploy sonrası: **https://cybalp.me/admin-panel/**

---

## 5. Kullanım

| Özellik | Açıklama |
|--------|----------|
| **Dashboard** | Post sayısı, hızlı aksiyonlar |
| **Posts** | Listele, düzenle, sil, yeni post oluştur |
| **Post Editor** | Frontmatter form + Markdown body + canlı önizleme |
| **Config** | *(Yakında)* `cybalp.config.yaml` düzenleme |
| **Media** | *(Yakında)* Albüm yönetimi |

### Yeni Post Oluşturma

1. **Posts** → **New Post**
2. Path: `APP!/my-slug.md` (kategori/slug)
3. Title, category, tags, description doldur
4. Body’ye Markdown yaz
5. **Save** → GitHub’a commit edilir

### Mevcut Post Düzenleme

1. **Posts** listesinde **Edit** (kalem ikonu)
2. Değişiklikleri yap
3. **Save** → GitHub’da güncellenir

---

## 6. Güvenlik

- Admin panel `noindex` ile işaretli (arama motorlarına kapalı)
- Tüm API istekleri Bearer token ile korunuyor
- Token localStorage’da tutuluyor; çıkış yapınca silinir

---

## 7. Sorun Giderme

### "Login timed out"
- Popup engelleyiciyi kapat
- Tarayıcıda `localhost` veya production domain’e izin ver

### "GitHub API failed"
- Token’ın `repo` scope’u olduğundan emin ol
- Repo adı ve branch (`main`) doğru mu kontrol et

### API 401 Unauthorized
- Yeniden giriş yap (Logout → Sign in with GitHub)
- Token süresi dolmuş olabilir
