// App.jsx
import React, { useState, useCallback } from 'react';

const MAX_CONTEXT = 500;

/* ---------- struktur babak ---------- */
const ACTS = {
  1: 'Babak 1 – Pendahuluan: kenalkan tokoh & suasana, timbul benih konflik.',
  2: 'Babak 2 – Konflik: masalah berkembang, tensi meningkat.',
  3: 'Babak 3 – Klimaks & Resolusi: keputusan kritis, konsekuensi, ending terbuka kecil.',
};
const TURNS_PER_ACT = [0, 2, 3, 1]; // total 6 turn
const getAct = (turn) => {
  let sum = 0;
  for (let act = 1; act <= 3; act++) {
    sum += TURNS_PER_ACT[act];
    if (turn < sum) return act;
  }
  return 3;
};

function App() {
  const [story, setStory] = useState('');
  const [choices, setChoices] = useState([]);
  const [turnCount, setTurnCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [endingStory, setEndingStory] = useState('');

  /* ---------- polling ---------- */
  const pollToSucceed = async (id, maxWait = 600_000) => {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      const data = await fetch(`/api/v1/predictions/${id}`).then(r => r.json());
      if (data.status === 'succeeded') return data;
      if (data.status === 'failed') throw new Error('Prediction failed');
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Booting too long');
  };

  const safeJsonParse = (str) => {
    try {
      str = str.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  /* ---------- AI call ---------- */
  const generateStory = useCallback(async (userAction = '', isEnding = false) => {
    setLoading(true);
    setError(null);
    const ctx = story.slice(-MAX_CONTEXT);
    const currentAct = getAct(turnCount);
    const actPrompt = ACTS[currentAct];

    const prompt = isEnding
      ? `Anda penulis Indonesia. Buat epilog 4–5 kalimat TANPA kata "ulangi" yang menutup cerita secara reflektif atau terbuka, berdasarkan: ${ctx}`
      : `Anda narator game teks fiksi interaktif.
TUGAS:
1. Lanjutkan cerita SEBELUMNYA dengan tepat 4–5 kalimat.
2. Pastikan alur nyambung & sesuai arahan BABAK ${currentAct}: ${actPrompt}
3. TENTUKAN SENDIRI 3 tindakan berikut:
   - Deskripsi tindakan TIDAK boleh mengandung huruf A/B/C atau tag lainnya.
   - Murni narasi singkat (2-4 kata) atau kalimat pendek.
Output HANYA JSON:
{"story":"<lanjutan>","choices":[{"label":"A","desc":"<tindakan murni>"},{"label":"B","desc":"<tindakan murni>"},{"label":"C","desc":"<tindakan murni>"}]}
TEMA: ${theme}
KONTEXT TERAKHIR: ${ctx}
AKSI PEMILIH: ${userAction}`;

    try {
      const res = await fetch('/api/v1/models/ibm-granite/granite-3.3-8b-instruct/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { prompt, max_tokens: isEnding ? 220 : 400, temperature: 0.75, top_p: 0.92 },
        }),
      });
      const json = await res.json();
      const final = await pollToSucceed(json.id);
      const raw = (final.output || []).join('').trim();

      if (isEnding) {
        setEndingStory(raw.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n').trim());
      } else {
        const parsed = safeJsonParse(raw);
        if (!parsed) throw new Error('Invalid JSON');
        setStory(parsed.story.trim());
        setChoices(parsed.choices);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat cerita.');
    } finally {
      setLoading(false);
    }
  }, [story, theme, turnCount]);

  /* ---------- game flow ---------- */
  const startGame = () => {
    if (!theme.trim()) return;
    reset();
    setGameStarted(true);
    generateStory();
  };

  const choose = async (choiceObj) => {
    if (gameOver || loading) return;
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);

    const totalTurns = TURNS_PER_ACT.slice(1).reduce((a, b) => a + b, 0);
    if (newTurn >= totalTurns) {
      await generateStory(choiceObj.label, true);
      setGameOver(true);
    } else {
      await generateStory(choiceObj.label);
    }
  };

  const reset = () => {
    setStory('');
    setChoices([]);
    setTurnCount(0);
    setGameStarted(false);
    setGameOver(false);
    setEndingStory('');
    setError(null);
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-2 sm:p-4">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl text-slate-100">
        {!gameStarted ? (
          <>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-center">
              🗺️ Petualangan Teks Interaktif
            </h1>
            <p className="mb-4 sm:mb-6 text-center text-slate-300 text-sm sm:text-base">
              Cerita apa yang ingin kamu jalani hari ini?
            </p>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Contoh: detektif di bulan, penyihir pelupa"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 mb-4 bg-slate-700 border-none rounded-lg placeholder-slate-400 text-slate-100 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              onClick={startGame}
              disabled={!theme.trim()}
              className="w-full py-2 sm:py-3 bg-white text-slate-900 rounded-lg text-base sm:text-lg font-semibold
                         shadow-[0_0_8px_#fff] hover:shadow-[0_0_16px_#fff] transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mulai Petualangan
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-center">
              🗺️ Petualangan Teks Interaktif
            </h1>
            <p className="text-center mb-2 sm:mb-4 text-slate-300 text-xs sm:text-sm">
              Tema: <strong>{theme}</strong> · Babak {getAct(turnCount)} / 3
            </p>

            {loading && (
              <div className="text-center mb-2 sm:mb-4 font-semibold text-white animate-pulse text-sm sm:text-base">
                ⏳ Sedang menulis kisah…
              </div>
            )}

            {error && !loading && (
              <div className="mb-4 text-center">
                <p className="text-red-400 text-sm mb-2">{error}</p>
                <button
                  onClick={() => generateStory(turnCount === 0 ? '' : choices[0]?.label)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                >
                  Coba Ulang
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                <p className="whitespace-pre-line mb-3 sm:mb-6 text-sm sm:text-base leading-relaxed text-slate-100">
                  {gameOver ? endingStory : story}
                </p>

                {gameOver ? (
                  <button
                    onClick={startGame}
                    className="w-full py-2 sm:py-3 bg-white text-slate-900 rounded-lg text-base sm:text-lg font-semibold
                               shadow-[0_0_8px_#fff] hover:shadow-[0_0_16px_#fff] transition-all duration-300 transform hover:scale-105"
                  >
                    🎉 Petualangan Baru
                  </button>
                ) : (
                  choices.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => choose(c)}
                      className="w-full mb-2 sm:mb-3 px-3 sm:px-4 py-2 sm:py-3 bg-white text-slate-900 rounded-lg text-left
                                 shadow-[0_0_6px_#fff] hover:shadow-[0_0_12px_#fff] transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <strong className="text-sm sm:text-lg">{c.label}</strong>
                      <br />
                      <small className="text-xs sm:text-sm text-slate-700">{c.desc}</small>
                    </button>
                  ))
                )}
              </>
            )}

            <button
              onClick={reset}
              className="w-full text-slate-900 mt-4 sm:mt-6 py-2 bg-white/10 border border-white/40 hover:bg-white/20 rounded-lg transition-all text-sm sm:text-base"
            >
              🔄 Ganti Tema / Restart
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;