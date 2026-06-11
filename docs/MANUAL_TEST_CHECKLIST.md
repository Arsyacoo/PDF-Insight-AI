# Manual E2E Test Checklist

Gunakan checklist ini setelah backend dan frontend berjalan lokal. Expected result umum: UI tidak crash, error ditampilkan dalam bahasa Indonesia, dan data tetap terisolasi per dokumen.

## PDF Preview
- [ ] Load valid PDF: preview tampil untuk dokumen yang dipilih.
- [ ] Open first page: halaman awal berada di page 1.
- [ ] Previous/Next: tombol mengubah halaman dengan benar.
- [ ] Page lower bound: page tidak pernah kurang dari 1.
- [ ] Page upper bound: page tidak pernah melebihi total pages.
- [ ] Source click: klik source reference membuka halaman PDF yang sesuai.
- [ ] Switch documents: preview dan page state reset ke dokumen baru.
- [ ] Missing/deleted PDF: tampil empty/error state, bukan blank crash.

## Responsive Layout
Uji width: 320px, 375px, 768px, 1024px, 1440px.
- [ ] Navbar: tidak overflow dan menu tetap dapat digunakan.
- [ ] Sidebar: tampil/tersembunyi sesuai breakpoint.
- [ ] Upload page: dropzone, warning, dan quick actions rapi.
- [ ] Analysis cards: card tidak saling tumpang tindih.
- [ ] Chat/PDF tabs: tab mobile berpindah state dengan jelas.
- [ ] Source reference cards: teks panjang tetap wrap.
- [ ] Retrieval details: accepted/rejected chunks terbaca.
- [ ] Document quality card: label dan metric tetap rapi.
- [ ] Export buttons: loading/error/disabled state jelas.
- [ ] History: search/filter dan card dokumen responsif.
- [ ] Comparison: dua selector dan hasil compare rapi.
- [ ] Quiz: opsi jawaban terbaca di mobile.
- [ ] Flashcards: front/back card tidak overflow.

## Document Quality
- [ ] Normal text PDF: upload berhasil dan quality menunjukkan teks cukup.
- [ ] PDF with empty pages: upload tidak crash; rekomendasi kualitas tetap jelas.
- [ ] Partially readable PDF: bagian terbaca tetap diproses, kualitas memberi warning bila teks rendah.
- [ ] Scanned PDF: ditolak/ditandai sebagai teks digital tidak cukup.
- [ ] Corrupted PDF: HTTP 422 dengan pesan `File PDF rusak atau tidak dapat dibaca.`

## Chat
- [ ] Exact question: jawaban muncul dengan source relevance dan page reference.
- [ ] Paraphrased question: source relevan tetap ditemukan.
- [ ] Unrelated question: response `not_found`, sources kosong, dan pesan informasi tidak ditemukan.
- [ ] Missing API key: fallback lokal aktif tanpa crash.
- [ ] Invalid API key: fallback/error state terkendali tanpa membocorkan key.
- [ ] Simulated API failure: response `api_error` atau fallback sesuai layer yang gagal.

## Export
- [ ] TXT: file terunduh dan berisi section yang dipilih.
- [ ] PDF: file terunduh dengan signature `%PDF` dan bisa dibuka.
- [ ] DOCX: file terunduh dan bisa dibuka di Word/LibreOffice.
- [ ] Unicode Indonesian text: karakter Indonesia tetap terbaca.
- [ ] Document with no chat: export tetap berhasil dengan placeholder `Chat belum tersedia.`
- [ ] Long chat history: export selesai tanpa timeout lokal dan isi tidak terpotong secara tidak wajar.
