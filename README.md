# 🗺️ Petualangan Teks Interaktif  
> Game cerita teks berbasis AI — 3 babak, 6 turn, tanpa server tambahan.

---

## 📌 Project Title  
**Petualangan Teks Interaktif**

---

## 📜 Description  
Petualangan Teks Interaktif adalah *browser-based game* tempat pemain memilih aksi yang **langsung ditentukan oleh AI**. Cerita berlangsung selama **6 turn** yang terbagi ke dalam **3 babak klasik** (pendahuluan, konflik, klimaks & resolusi). Tidak ada backend tambahan—semua komunikasi ke AI diarahkan lewat proxy lokal atau environment variable.

---

## 🚀 Technologies Used  
- **React 18**  
- **Vite** (dev & build)  
- **Tailwind CSS** (styling)  
- **Replicate API** (AI story generation)  
- **Environment Variables** (key security)  

---

## ✨ Features  
| # | Fitur | Keterangan |
|---|---|---|
| 1 | **AI-Driven Choices** | AI membuat 3 pilihan A/B/C tanpa label di deskripsi. |
| 2 | **Babak Otomatis** | Turn 0-1 (Babak 1), 2-4 (Babak 2), 5-6 (Babak 3). |
| 3 | **Retry & Loading UX** | Otomatis retry 3× + backoff sebelum error. |
| 4 | **Responsive Design** | Mobile-first (xs → lg). |
| 5 | **Environment Security** | API key tidak tertulis di kode. |

---

## ⚙️ Setup Instructions  

### 1. Clone Repository  
``bash
git clone https://github.com/yourusername/text-adventure.git
cd text-adventure

### 2 . Install Dependencies
npm install

### 3 . Tambahkan API Key
echo "VITE_REPLICATE_API_TOKEN=sk-replicate-xxxxxxxxxxxxxxxxx" > .env.local

### 4 . Jalankan Lokal
npm run dev

## Try
https://text-adventure1.vercel.app/

🤖 AI Support Explanation
Endpoint
Semua request ke:
/api/v1/models/ibm-granite/granite-3.3-8b-instruct/predictions
tidak mengandung API key di bundle.
Dev: Vite proxy ke http://localhost:5000 (server dev lokal).
Prod: Gunakan serverless function (contoh: Vercel /api/predict) dengan process.env.API_KEY.
Prompt Terstruktur
Prompt selalu menyebutkan Babak 1/2/3 agar AI menghasilkan cerita yang nyambung dan sesuai struktur.


🛠️ Contoh Extend
    - Tambah sound effect.
    - Export story ke .txt.
    - Save progress ke localStorage.
© 2025 — Open Source under MIT License.
