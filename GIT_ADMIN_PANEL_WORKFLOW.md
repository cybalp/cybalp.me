# Admin Panel — Git Workflow

## Mevcut Durum (Yapıldı)

- **main**: `f574bd6` (Vault: fixes) — Admin Panel Test kaldırıldı
- **admin-panel**: Admin Panel Test + ADMIN_GITHUB_BRANCH — tüm admin panel kodu burada

## Senin Yapacakların

### 1. GitHub'a push et

SSH erişimin olduğunda terminalde:

```bash
# admin-panel branch'ini push et (ADMIN_GITHUB_BRANCH dahil)
git push origin admin-panel

# main'i force push et (Admin Panel Test commit'i kaldırır)
git push origin main --force
```

### 2. Vercel ayarları

- **Production (main)**: Site `main` branch'inden deploy olur — admin panel yok
- **Preview (admin-panel)**: PR açarsan veya admin-panel branch'ini deploy edersen admin panel görünür

Admin paneli test etmek için:
- Vercel'de `admin-panel` branch'ine preview deployment aç
- Veya PR aç: main ← admin-panel

### 3. Çalışma akışı (2–3 gün)

```bash
git checkout admin-panel
# ... değişiklikler ...
git add .
git commit -m "feat: ..."
git push origin admin-panel
```

Tüm admin panel işleri `admin-panel` branch'inde.

### 4. Bitince main'e merge

```bash
git checkout main
git merge admin-panel
git push origin main
```

---

## Özet

| Branch       | İçerik                          |
|-------------|----------------------------------|
| **main**    | Production site, admin panel yok |
| **admin-panel** | Admin panel + tüm geliştirmeler |
