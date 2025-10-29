Rencana Proyek: Aplikasi Desktop Otomasi Unggahan Facebook (Reel & Video Post)
Nama Proyek: ReelSync Pro (Diperluas)
Versi Dokumen: 2.0
Teknologi Utama: Electron.js, JavaScript (Vanilla), Puppeteer, Node.js
1. Ringkasan Proyek (Executive Summary)
ReelSync Pro adalah aplikasi desktop lintas platform (Windows, macOS, Linux) yang dibangun menggunakan Electron.js dan JavaScript murni, tanpa bundler seperti Webpack. Aplikasi ini bertujuan untuk mengotomatiskan proses pengunggahan konten video ke Facebook, dengan mendukung dua format utama: Facebook Reels dan Video Post biasa ke feed Halaman.
Aplikasi ini dirancang untuk manajer media sosial, kreator konten, dan agensi digital. Fitur inti adalah autentikasi aman berbasis cookie, yang memungkinkan pengguna mengelola banyak akun tanpa menyimpan password. Setelah validasi cookie, aplikasi akan secara otomatis mendeteksi semua Halaman (Pages) yang dikelola pengguna, memungkinkan mereka untuk memilih target unggahan secara spesifik.
2. Tujuan Proyek (Project Goals)
Tujuan Utama: Mengembangkan aplikasi desktop yang stabil dan efisien untuk mengotomatiskan unggahan Reels dan Video Post ke Halaman Facebook yang dipilih.
Tujuan Sekunder:
Menyediakan manajemen multi-akun yang aman menggunakan cookie.
Mengimplementasikan sistem validasi cookie otomatis dengan pengambilan daftar Halaman yang dikelola.
Memungkinkan pengguna memilih jenis unggahan (Reel atau Video Post) untuk setiap video.
Menyediakan sistem antrian (queue) dan penjadwalan (scheduling) yang fleksibel.
Menciptakan antarmuka pengguna (UI) yang intuitif dan mudah digunakan.
Memberikan log aktivitas dan laporan status yang jelas untuk setiap unggahan.
3. Ruang Lingkup Proyek (Project Scope)
Termasuk (In-Scope):
Manajemen Akun:
Menambah, menghapus, dan beralih antar akun Facebook.
Validasi Sesi Cookie & Pengambilan Data Halaman:
Saat cookie dimasukkan, sistem akan menguji keaktifannya dengan mengakses https://www.facebook.com/pages/?category=your_pages.
Jika valid, sistem akan mengambil (scrape) daftar nama Halaman yang dikelola oleh akun tersebut.
Menyimpan cookie yang terenkripsi dan daftar Halaman terkait secara lokal.
Manajemen Unggahan:
Menambah video dari penyimpanan lokal.
Menambahkan teks/caption untuk setiap video.
Pemilihan Target Unggahan: Pengguna dapat memilih Halaman spesifik dari dropdown menu yang dihasilkan pada tahap validasi.
Pemilihan Jenis Unggahan: Pengguna dapat memilih apakah video akan diunggah sebagai Reel atau sebagai Video Post biasa ke feed Halaman.
Sistem Antrian & Penjadwalan:
Membuat daftar antrian video yang akan diunggah.
Mengatur tanggal dan waktu spesifik untuk setiap unggahan dalam antrian.
Proses Otomatisasi:
Menggunakan Puppeteer (headless browser) untuk mensimulasikan semua interaksi pengguna di latar belakang.
Pelaporan & Logging:
Menampilkan log proses real-time (misal: "Mencoba login...", "Mengambil daftar halaman...", "Mengunggah video...").
Menampilkan status akhir (Berhasil, Gagal, Dibatalkan) untuk setiap item di antrian.
Tidak Termasuk (Out-of-Scope):
Editing video di dalam aplikasi.
Analitik performa konten (tayangan, suka, komentar).
Otomatisasi interaksi lain (membalas komentar, mengirim pesan).
Aplikasi versi mobile (iOS/Android).
Penyimpanan username dan password secara langsung.
Fitur Tambahan yang Direkomendasikan (Potensial untuk Versi Lanjutan):
Manajemen Proxy: Mengizinkan pengguna menetapkan proxy unik untuk setiap akun guna mengurangi risiko pemblokiran.
Pengaturan Jeda (Throttling): Memberikan opsi untuk mengatur jeda waktu acak antar unggahan untuk meniru perilaku manusia.
Spintax untuk Teks/Caption: Mendukung format {kata1|kata2} pada caption untuk menghasilkan variasi teks secara otomatis.
4. Arsitektur & Tumpukan Teknologi (Architecture & Tech Stack)
Framework Aplikasi: Electron.js
Bahasa Pemrograman: JavaScript (ES6+)
Frontend (Renderer Process):
HTML5 & CSS3: Struktur dan gaya antarmuka.
Vanilla JavaScript: Interaksi DOM dan logika UI. Komunikasi dengan Main Process menggunakan ipcRenderer.
Backend (Main Process):
Node.js: Lingkungan runtime yang terintegrasi.
Otomatisasi Browser: Puppeteer - Untuk mengontrol browser Chromium secara headless, melakukan validasi cookie, scraping nama Halaman, dan proses unggah.
Penyimpanan Data Lokal: electron-store - Menyimpan data persisten (daftar akun, cookie terenkripsi, antrian, pengaturan) dalam format JSON.
Penjadwalan: node-cron - Menjalankan tugas unggahan terjadwal di latar belakang.
Packaging & Build: electron-builder - Untuk mengemas aplikasi menjadi file installer (.exe, .dmg, .AppImage).
5. Rincian Fitur Utama (Key Features Breakdown)
Modul 1: Autentikasi & Manajemen Akun/Halaman
UI: Form untuk memasukkan "Nama Akun" dan "Cookie". Terdapat tombol "Simpan & Validasi".
Proses Validasi (Backend):
Saat tombol diklik, Main Process menerima data cookie.
Meluncurkan instance Puppeteer headless.
Menyuntikkan cookie ke dalam sesi browser.
Menavigasi ke https://www.facebook.com/pages/?category=your_pages.
Logika Pengecekan:
Jika Berhasil: Halaman memuat dengan benar. Lakukan scraping elemen HTML yang berisi nama-nama Halaman. Kirim daftar Halaman kembali ke UI. Tampilkan status "Valid".
Jika Gagal (misal: dialihkan ke halaman login): Kirim sinyal error ke UI. Tampilkan pesan "Cookie Tidak Valid atau Kedaluwarsa".
Penyimpanan: Jika valid, simpan nama akun, cookie (dienkripsi), dan daftar Halaman yang berhasil didapat ke electron-store.
UI Tampilan: Daftar akun yang tersimpan. Saat satu akun dipilih, dropdown Halaman di modul unggahan akan terisi secara otomatis.
Modul 2: Antrian & Penjadwalan Unggahan
UI Form Unggahan:
Tombol "Pilih File Video".
Text area untuk "Caption".
Dropdown "Pilih Halaman": Terisi berdasarkan akun yang aktif.
Pilihan "Jenis Unggahan": Radio button atau dropdown dengan opsi "Reel" dan "Video Post".
Date/Time Picker untuk penjadwalan.
Tombol "Tambahkan ke Antrian".
UI Tampilan Antrian: Tabel yang menampilkan daftar video, Halaman tujuan, jenis unggahan, jadwal, dan status (Menunggu, Mengunggah, Berhasil, Gagal).
Modul 3: Mesin Otomatisasi Inti (Core Automation Engine - Puppeteer)
Fungsi ini dipicu oleh antrian (langsung atau terjadwal).
Meluncurkan browser, menyuntikkan cookie dari akun yang sesuai.
Logika Percabangan berdasarkan "Jenis Unggahan":
Jika Jenis = "Reel":
Navigasi ke URL pembuatan Reels untuk Halaman yang dipilih (misal: https://www.facebook.com/PAGE_USERNAME/reels/create).
Gunakan page.waitForSelector() untuk menunggu tombol unggah muncul.
Lampirkan file video ke input file tersembunyi.
Isi kolom caption.
Klik tombol "Publish".
Pantau elemen halaman untuk mendeteksi pesan keberhasilan atau kegagalan.
Jika Jenis = "Video Post":
Navigasi ke halaman utama Halaman yang dipilih (misal: https://www.facebook.com/PAGE_USERNAME).
Klik tombol "Create Post" untuk memunculkan modal/popup.
Klik ikon "Foto/Video".
Lampirkan file video ke input file.
Isi area teks postingan dengan caption.
Klik tombol "Post".
Pantau timeline Halaman atau notifikasi untuk konfirmasi keberhasilan.
Error Handling: Tangani error umum seperti selector tidak ditemukan, waktu habis (timeout), atau koneksi gagal.
Pelaporan: Kirim status akhir (berhasil/gagal beserta pesan error) kembali ke Renderer Process untuk memperbarui UI.
6. Tahapan Proyek & Estimasi Waktu (Timeline)
Total Estimasi: 11 Minggu (oleh 1 developer)
Fase 1: Riset & Penyiapan (1 Minggu)
Setup proyek Electron.js.
Riset mendalam selector DOM untuk: validasi login, scraping nama halaman, alur unggah Reels, dan alur unggah Video Post. Ini krusial karena alurnya berbeda.
Buat Proof of Concept (PoC) script Puppeteer terpisah untuk setiap alur.
Fase 2: Pengembangan Core Backend (3 Minggu)
Implementasi modul manajemen akun (simpan/hapus/enkripsi) dengan electron-store.
Bangun logika validasi cookie dan scraping Halaman.
Buat sistem antrian dasar (tanpa penjadwalan).
Fase 3: Pengembangan Antarmuka Pengguna (UI) (3 Minggu)
Rancang layout aplikasi (HTML/CSS).
Bangun komponen UI untuk manajemen akun.
Bangun form unggahan dengan semua input yang diperlukan (termasuk dropdown Halaman dan pilihan jenis unggahan).
Bangun tampilan antrian dan log aktivitas yang dinamis.
Fase 4: Integrasi & Fitur Lanjutan (2 Minggu)
Hubungkan UI (Renderer) dengan Backend (Main) menggunakan ipcMain dan ipcRenderer.
Integrasikan logika dua alur unggahan (Reel & Video Post) ke dalam mesin otomatisasi.
Implementasikan fitur penjadwalan menggunakan node-cron.
Implementasikan penanganan error yang komprehensif.
Fase 5: Pengujian, Perbaikan & Dokumentasi (2 Minggu)
Pengujian fungsional menyeluruh pada Windows dan macOS/Linux.
Perbaikan bug dan optimasi performa.
Tulis dokumentasi sederhana untuk pengguna (cara mendapatkan cookie, dll.).
Konfigurasi electron-builder dan lakukan build rilis final.
7. Risiko & Mitigasi (Risks & Mitigation)
Risiko: Perubahan struktur DOM/API oleh Facebook.
Dampak: Tinggi. Fitur inti bisa berhenti berfungsi.
Mitigasi: Gunakan selector yang lebih stabil (data-testid, aria-label). Siapkan alur kerja untuk merilis patch pembaruan dengan cepat.
Risiko: Akun ditandai sebagai spam atau diblokir.
Dampak: Tinggi.
Mitigasi: Wajibkan implementasi jeda acak antar unggahan. Berikan peringatan kepada pengguna untuk tidak melakukan unggahan massal. Sarankan penggunaan Proxy (fitur lanjutan).
Risiko: Cookie kedaluwarsa.
Dampak: Sedang.
Mitigasi: Sistem validasi cookie yang sudah dirancang akan menangani ini dengan memberikan pesan error yang jelas kepada pengguna untuk memperbarui cookie mereka.
Risiko: Perbedaan alur unggah antara Reels dan Video Post.
Dampak: Sedang.
Mitigasi: Memisahkan logika dan selector untuk kedua alur secara jelas dalam kode. Ini meningkatkan kompleksitas tetapi memastikan keandalan.