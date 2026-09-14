// =========================================
//  ELEMEN HTML
// =========================================
const textElement      = document.getElementById('story-text');
const choicesContainer = document.getElementById('choices-container');
const audioPlayer      = document.getElementById('game-audio');
const chapterLabel     = document.getElementById('chapter-label');
const sanityLabel      = document.getElementById('sanity-label');
const timerBar         = document.getElementById('timer-bar');
const timerText        = document.getElementById('timer-text');

// =========================================
//  STATE GAME
// =========================================
const state = {
    sanity: 3,          // maksimal 3 hati
    maxSanity: 3,
    timeLeft: 0,
    timerId: null,
    typingId: null,
    isTyping: false,
    currentNode: 1,
};

// =========================================
//  DATABASE CERITA
//  - sanityDelta: efek ke sanity setelah node ini selesai
//  - timeLimit  : detik untuk memilih (0 = tanpa batas)
//  - chapter    : label bab
// =========================================
const storyNodes = {
    1: {
        chapter: "Chapter 01 — Perjumpaan",
        text: "Tahun 1947. Suasana malam terasa dingin menusuk tulang. Adirja berdiri di bawah temaram lampu jalan, menatap bayangan seorang pria tegap bertopi baret. Itu Westerling. Dengan suara datar yang mengganggu, Westerling bertanya: 'Mau kemana? sini, ikut bersama saya dulu sebentar. Ada hal yang sangat penting berkaitan tentang presiden mu itu.'",
        audio: "audio/bgm.mp3",
        sanityDelta: 0,
        timeLimit: 12,
        choices: [
            { text: "⚡ Tantang dia duel 1 lawan 1", nextNode: 2, sanity: 0 },
            { text: "☕ ikut",   nextNode: 3, sanity: 0 },
        ],
    },
    2: {
        chapter: "Chapter 02 — Tembakan",
        text: "Adirja langsung maju. Westerling tidak tunggu lama langsung melesat maju. Tiba-tiba BUAAK!! Adirja terjatuh ke tanah setelah Westerling menendang lehernya...\n\nGAME OVER. (Yah, lu mati konyol, dek).",
        audio: "audio/kaget.mp3",
        sanityDelta: -3,
        timeLimit: 0,
        choices: [
            { text: "🔄 Ulangi dari Awal (Penasaran)", nextNode: 1, sanity: 0, restart: true },
        ],
    },
    3: {
        chapter: "Chapter 03 — Mimpi",
        text: "Westerling hanya terdiam dan mengangguk, Adirja mengikuti Westerling kedalam rumah tua Belanda yang katanya pernah dijadikan tempat perkumpulan pemuda. Mereka berakhir duduk diatas kursi dengan 2 gelas alkohol diatas meja--perbinjangan cukup penedek dikarenakan Adirja tidak mau bertele-tele dengan persoalan presidennya. Westerling mengerti, karena itu dia berjalan ke lemari belakang Adirja dan.... BUAK!! \n\nTAMAT? bro keknya berakhir diatas kasur.",
        audio: "audio/ketawa.mp3",
        sanityDelta: +1,
        timeLimit: 0,
        choices: [
            { text: "✨ Main Lagi dari Awal", nextNode: 1, sanity: 0, restart: true },
        ],
    },
};

// =========================================
//  AUDIO (musik latar & SFX tombol terpisah)
// =========================================
let bgmAudio = null;
function playBGM(src) {
    if (!src) return;
    if (!bgmAudio) {
        bgmAudio = new Audio();
        bgmAudio.loop = true;
        bgmAudio.volume = 0.35;
    }
    if (bgmAudio.src.endsWith(src)) return;
    bgmAudio.src = src;
    bgmAudio.play().catch(() => {});
}

// SFX sederhana pakai Web Audio (biar gak butuh file)
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
function blip(freq = 440, dur = 0.08, type = 'square') {
    try {
        if (!actx) actx = new AudioCtx();
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.08, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
        o.connect(g).connect(actx.destination);
        o.start();
        o.stop(actx.currentTime + dur);
    } catch (_) {}
}

// =========================================
//  UI HELPERS
// =========================================
function renderSanity() {
    const hearts = '♥'.repeat(Math.max(0, state.sanity)) +
                   '♡'.repeat(Math.max(0, state.maxSanity - state.sanity));
    sanityLabel.textContent = `SANITY ${hearts}`;
    sanityLabel.classList.toggle('text-rose-300', state.sanity > 1);
    sanityLabel.classList.toggle('text-rose-500', state.sanity <= 1);
}

function setChapter(label) {
    if (label) chapterLabel.textContent = label;
}

function updateTimerUI(remaining, total) {
    const pct = total > 0 ? (remaining / total) * 100 : 0;
    timerBar.style.width = pct + '%';
    timerBar.style.background = pct > 50
        ? 'linear-gradient(to right,#34d399,#f43f5e)'
        : pct > 20
            ? 'linear-gradient(to right,#fbbf24,#f43f5e)'
            : '#ef4444';
    timerText.textContent = Math.max(0, Math.ceil(remaining)) + 's';
}

function stopTimer() {
    if (state.timerId) {
        clearInterval(state.timerId);
        state.timerId = null;
    }
}

function startTimer(seconds, onTimeout) {
    stopTimer();
    if (!seconds || seconds <= 0) {
        timerBar.style.width = '100%';
        timerBar.style.background = 'linear-gradient(to right,#34d399,#f43f5e)';
        timerText.textContent = '∞';
        return;
    }
    state.timeLeft = seconds;
    updateTimerUI(state.timeLeft, seconds);

    state.timerId = setInterval(() => {
        state.timeLeft -= 0.1;
        updateTimerUI(state.timeLeft, seconds);
        if (state.timeLeft <= 0) {
            stopTimer();
            onTimeout();
        }
    }, 100);
}

// =========================================
//  TYPEWRITER (pakai RAF, bisa di-skip)
// =========================================
function typeWriter(text, onDone) {
    cancelAnimationFrame(state.typingId);
    textElement.textContent = '';
    textElement.classList.add('cursor-blink');
    state.isTyping = true;

    let i = 0;
    let last = performance.now();
    const speed = 18; // ms per karakter

    function step(now) {
        if (!state.isTyping) return;
        if (now - last >= speed) {
            last = now;
            textElement.textContent += text.charAt(i);
            i++;
            // auto scroll
            textElement.scrollTop = textElement.scrollHeight;
            // blip halus tiap beberapa karakter
            if (i % 3 === 0) blip(700 + Math.random() * 300, 0.02, 'triangle');
        }
        if (i < text.length) {
            state.typingId = requestAnimationFrame(step);
        } else {
            state.isTyping = false;
            textElement.classList.remove('cursor-blink');
            onDone && onDone();
        }
    }
    state.typingId = requestAnimationFrame(step);

    // Skip saat klik area cerita
    const skip = () => {
        if (state.isTyping) {
            state.isTyping = false;
            textElement.textContent = text;
            textElement.classList.remove('cursor-blink');
            onDone && onDone();
        }
        textElement.removeEventListener('click', skip);
    };
    textElement.addEventListener('click', skip);
}

// =========================================
//  LOGIC UTAMA
// =========================================
function startNode(nodeIndex) {
    const node = storyNodes[nodeIndex];
    if (!node) return;

    state.currentNode = nodeIndex;
    stopTimer();
    choicesContainer.innerHTML = '';
    setChapter(node.chapter);
    renderSanity();

    // mainkan BGM hanya jika node punya audio
    if (node.audio) playBGM(node.audio);

    typeWriter(node.text, () => showChoices(node));
}

function showChoices(node) {
    node.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className =
            "choice-btn w-full text-left bg-slate-800/80 hover:bg-indigo-600 " +
            "border border-slate-700 hover:border-indigo-400 text-slate-200 " +
            "hover:text-white font-medium py-3 px-5 rounded-xl transition-all " +
            "duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] " +
            "shadow-md text-sm md:text-[15px]";

        button.textContent = choice.text;
        button.style.opacity = '0';
        button.style.transform = 'translateY(10px)';
        choicesContainer.appendChild(button);

        setTimeout(() => {
            button.style.transition = 'all 0.3s ease';
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        }, index * 100);

        button.addEventListener('click', () => {
            blip(520, 0.06, 'square');
            onChoiceSelected(choice);
        });
    });

    // Timer mulai setelah pilihan muncul
    startTimer(node.timeLimit, () => {
        // timeout → pilih opsi terburuk (index terakhir) sebagai hukuman
        blip(180, 0.25, 'sawtooth');
        const bad = node.choices[node.choices.length - 1];
        onChoiceSelected(bad, true);
    });
}

function onChoiceSelected(choice, isTimeout = false) {
    stopTimer();

    // efek sanity dari pilihan
    if (typeof choice.sanity === 'number') {
        state.sanity += choice.sanity;
    }
    // efek sanity dari node
    const node = storyNodes[state.currentNode];
    if (node && typeof node.sanityDelta === 'number' && !choice.restart) {
        state.sanity += node.sanityDelta;
    }
    renderSanity();

    // cek game over karena sanity habis
    if (state.sanity <= 0 && !choice.restart) {
        gameOver();
        return;
    }

    // restart?
    if (choice.restart) {
        state.sanity = state.maxSanity;
        renderSanity();
    }

    // delay dikit biar transisi halus
    setTimeout(() => startNode(choice.nextNode), 180);
}

function gameOver() {
    stopTimer();
    setChapter("Game Over");
    textElement.classList.remove('cursor-blink');
    textElement.textContent =
        "Kegelapan menelan segalanya...\n\nSANITY habis. Adirja tak sanggup lagi menatap lampu jalan itu.\n\n(GAME OVER)";

    choicesContainer.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
        "choice-btn w-full text-left bg-rose-900/70 hover:bg-rose-700 " +
        "border border-rose-700 hover:border-rose-400 text-rose-100 " +
        "font-bold py-3 px-5 rounded-xl transition-all duration-200 " +
        "hover:-translate-y-0.5 active:scale-[0.98] shadow-md";
    btn.textContent = "🔄 Coba Lagi dari Awal";
    btn.addEventListener('click', () => {
        blip(300, 0.15, 'sawtooth');
        state.sanity = state.maxSanity;
        renderSanity();
        startNode(1);
    });
    choicesContainer.appendChild(btn);
}

// =========================================
//  BOOT
// =========================================
renderSanity();
startNode(1);
