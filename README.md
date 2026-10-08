# Seven — 7-day fitness tracker

Expo SDK 54 / React Native 0.81.5 / TypeScript. Port React Native dari canvas
Claude Design `Seven.dc.html` — semua tabel data (LIB, ALIAS, POOL, DAYS, HOWTO,
MANDARIN, GIF_ID) disalin langsung dari sumber design, jadi keduanya selalu sama.

## Cara dapat QR code untuk Expo Go

```bash
npm install
npx expo start
```

QR code muncul di terminal. Scan pakai Expo Go (Android: aplikasi Expo Go
langsung; iOS: kamera bawaan). HP dan laptop harus di Wi-Fi yang sama.

Kalau beda jaringan atau Wi-Fi kantor memblokir:

```bash
npx expo start --tunnel
```

Tekan `r` untuk reload, `j` untuk buka debugger.

## Build APK otomatis di GitHub (gratis)

Repo ini punya workflow `.github/workflows/android.yml`. APK dibangun di runner
GitHub pakai Gradle — **tidak lewat server Expo**, jadi tidak ada kuota EAS dan
tidak perlu token apa pun. Yang terpakai hanya menit GitHub Actions (repo public:
menit standar tidak dibatasi).

Sekali setup:

```bash
tar -xzf seven-app-sdk54-v16.tar.gz && cd seven-app
git init -b main
git add -A && git commit -m "Seven v3"
# bikin repo kosong di github.com dulu, lalu:
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

Habis itu buka tab **Actions** di repo. Build jalan sendiri tiap `git push`, atau
tekan **Run workflow** untuk jalan manual. Kalau sudah hijau, buka run-nya dan
download APK di bagian **Artifacts** (`seven-1.0.0-buildN.apk`), lalu install di
HP (izinkan "install from unknown sources").

Folder `android/` tidak ikut di git — workflow bikin ulang lewat `expo prebuild`
tiap build, jadi perubahan di `app.json` selalu kebawa.

### Catatan soal tanda tangan APK

Template Expo SDK 54 menandatangani build release pakai `debug.keystore` bawaan.
Artinya APK-nya **langsung bisa dipasang** tanpa setup, dan karena keystore-nya
tetap sama tiap build, update bisa di-install menimpa versi sebelumnya. Itu cukup
untuk pakai sendiri. Untuk Play Store nanti perlu keystore sendiri — simpan
sebagai GitHub secret dan arahkan `signingConfigs.release` ke situ.

### iOS

Tidak ada job iOS di workflow ini: butuh runner macOS (menitnya dihitung 10x) dan
akun Apple Developer ($99/tahun) untuk bisa install ke iPhone. Untuk sekarang
`npx expo start` + Expo Go sudah cukup buat tes di iOS.

## Build APK manual di laptop sendiri

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Profil `preview` menghasilkan file `.apk` yang bisa langsung di-install. Untuk
Play Store pakai `--profile production` (hasilnya `.aab`).

iOS butuh akun Apple Developer:

```bash
eas build -p ios --profile preview
```

## Struktur

| file | isi |
| --- | --- |
| `src/data.ts` | LIB, ALIAS/CANON, PAT, EXTRA, POOL, dan rencana 7 hari |
| `src/content.ts` | cue gerakan, breakdown otot, nama Mandarin |
| `src/gifs.ts` | demo GIF: id ExerciseDB yang sudah dicek + fuzzy-match ke index lokal |
| `src/logic.ts` | semua derivasi murni (set, heavy slot, pool, chart) |
| `src/store.tsx` | state + AsyncStorage + rest timer + notifikasi |
| `src/notifications.ts` | alarm rest lewat notifikasi lokal OS |
| `src/skills.ts` | dua tangga progresi (PLANCHE, HANDSTAND) + ilustrasi tiap langkah |
| `src/backup.ts` | simpan/pulihkan backup JSON (share sheet + document picker) |
| `src/body.ts` | poligon model tubuh (react-body-highlighter) untuk heat map otot |
| `src/components/ExerciseCard.tsx` | kartu satu-gerakan: demo, cue, tabel set per-set |
| `src/components/DemoImage.tsx` | render demo GIF — `recyclingKey` + prefetch, biar tidak nyangkut di gerakan sebelumnya |
| `src/screens/` | TodayScreen, ProgressScreen |
| `assets/edb-names.json` | index nama ExerciseDB (dipakai fuzzy-match demo) |
| `assets/skill/` | 16 ilustrasi langkah tangga skill (@trainwithkale) + dragon-flag.gif |

Semua progress disimpan di HP (`AsyncStorage`, key `seven.v4`). Tidak ada akun,
tidak ada server — hanya demo GIF yang butuh internet. Tab Progress punya tombol
SAVE BACKUP / RESTORE untuk file JSON, formatnya sama dengan canvas design jadi
backup bisa dipindah antara keduanya.

## Update dari dalam app

Setiap build di GitHub Actions juga diterbitkan sebagai **Release** (`build-<nomor>`).
App mengecek rilis terbaru saat dibuka, dan lewat tab **Progress → APP UPDATE**.
Kalau ada build yang lebih baru: **Update** → APK terunduh → Android minta konfirmasi
"Update" → selesai, data tetap ada.

Syarat: rilisnya harus bisa dibaca tanpa login. Pilih salah satu:
- jadikan repo ini **public**, atau
- buat repo public terpisah (mis. `seven-releases`, isi README saja), lalu di repo ini
  set **Variable** `RELEASE_REPO` = `pemilik/seven-releases` dan **Secret** `RELEASE_TOKEN`
  = fine-grained token dengan izin *Contents: Read and write* untuk repo itu.

Build lokal / Expo Go (build 0) tidak pernah menawarkan update.
