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
    sanity: 3,
    maxSanity: 3,
    timeLeft: 0,
    timerId: null,
    typingId: null,
    isTyping: false,
    currentNode: 1,
};

// =========================================
//  DATABASE CERITA
//  - effect: 'shake' | 'glitch' | undefined
// =========================================
const storyNodes = {
    1: {
        chapter: "Chapter 01 — Perjumpaan",
        text: "Tahun 1947. Suasana malam terasa dingin menusuk tulang. Adirja berdiri di bawah temaram lampu jalan, menatap bayangan seorang pria tegap bertopi baret. Itu Westerling. Dengan suara datar yang mengganggu, Westerling bertanya: 'Mau kemana? sini, ikut bersama saya dulu sebentar. Ada hal yang sangat penting berkaitan tentang presiden mu itu.'",
        audio: "audio/bgm.mp3",
        sanityDelta: 0,
        timeLimit: 12,
        choices: [
            { text: "» Tantang dia duel 1 lawan 1", nextNode: 2, sanity: 0 },
            { text: "» Ikut saja", nextNode: 3, sanity: 0 },
        ],
    },
    2: {
        chapter: "Chapter 02 — Tembakan",
        text: "Adirja langsung maju. Westerling tidak tunggu lama langsung melesat maju. Tiba-tiba BUAAK!! Adirja terjatuh ke tanah setelah Westerling menendang lehernya...\n\nGAME OVER. (Yah, lu mati konyol, dek).",
        audio: "audio/kaget.mp3",
        sanityDelta: -3,
        timeLimit: 0,
        effect: "shake",
        choices: [
            { text: "⟲ Ulangi dari awal (penasaran)", nextNode: 1, sanity: 0, restart: true },
        ],
    },
    3: {
        chapter: "Chapter 03 — Mimpi",
        text: "Westerling hanya terdiam dan mengangguk. Adirja mengikuti Westerling ke dalam rumah tua Belanda yang katanya pernah dijadikan tempat perkumpulan pemuda. Mereka berakhir duduk di atas kursi dengan 2 gelas alkohol di atas meja--perbincangan mereka cukup pendek dikarenakan Adirja tidak mau bertele-tele dengan persoalan presidennya. Westerling mengerti, karena itu dia berjalan ke lemari belakang Adirja dan.... BUAK!!\n\nTAMAT? bro keknya berakhir diatas kasur.",
        audio: "audio/ketawa.mp3",
        sanityDelta: +1,
        timeLimit: 0,
        effect: "shake",
        choices: [
            { text: "⟲ Main lagi dari awal", nextNode: 1, sanity: 0, restart: true },
        ],
    },
};

// =========================================
//  AUDIO
// =========================================
let bgmAudio = null;
function playBGM(src) {
    if (!src) return;
    if (!bgmAudio) {
        bgmAudio = new Audio();
        bgmAudio.loop = true;
        bgmAudio.volume = 0.28;
    }
    if (bgmAudio.src.endsWith(src)) return;
    bgmAudio.src = src;
    bgmAudio.play().catch(() => {});
}

// SFX Web Audio
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
function blip(freq = 440, dur = 0.08, type = 'square', vol = 0.08) {
    try {
        if (!actx) actx = new AudioCtx();
        const o = actx.createOscillator();
        const g = actx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, actx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
        o.connect(g).connect(actx.destination);
        o.start();
        o.stop(actx.currentTime + dur);
    } catch (_) {}
}

// Bass drop kaget
function scareSound() {
    blip(60, 0.7, 'sawtooth', 0.25);
    setTimeout(() => blip(45, 0.5, 'square', 0.2), 80);
}

// =========================================
//  EFEK VISUAL
// =========================================
function shakeScreen(duration = 600) {
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), duration);
}

function flash(color = 'rgba(220,38,38,0.6)', duration = 250) {
    const f = document.createElement('div');
    f.style.cssText = `position:fixed;inset:0;background:${color};z-index:9999;pointer-events:none;animation:flashFade ${duration}ms ease forwards;`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), duration);
}

// =========================================
//  UI HELPERS
// =========================================
function renderSanity() {
    const hearts = '♥'.repeat(Math.max(0, state.sanity)) +
                   '♡'.repeat(Math.max(0, state.maxSanity - state.sanity));
    sanityLabel.textContent = `Sanity ${hearts}`;
    if (state.sanity <= 1) {
        sanityLabel.classList.add('pulse-danger');
        sanityLabel.style.color = '#dc2626';
    } else {
        sanityLabel.classList.remove('pulse-danger');
        sanityLabel.style.color = '#b91c1c';
    }
}

function setChapter(label) {
    if (label) chapterLabel.textContent = label;
}

function updateTimerUI(remaining, total) {
    const pct = total > 0 ? (remaining / total) * 100 : 0;
    timerBar.style.width = pct + '%';

    // hijau → merah darah → hitam
    if (pct > 60) {
        timerBar.style.background = 'linear-gradient(to right,#7f1d1d,#b91c1c)';
        timerBar.style.boxShadow = 'none';
    } else if (pct > 30) {
        timerBar.style.background = 'linear-gradient(to right,#b91c1c,#dc2626)';
        timerBar.style.boxShadow = '0 0 8px #dc2626';
    } else {
        timerBar.style.background = '#ef4444';
        timerBar.style.boxShadow = '0 0 14px #ef4444';
    }

    timerText.textContent = Math.max(0, Math.ceil(remaining)) + 's';
    timerText.style.color = pct < 40 ? '#ef4444' : '#991b1b';
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
        timerBar.style.background = 'linear-gradient(to right,#450a0a,#7f1d1d)';
        timerText.textContent = '∞';
        timerText.style.color = '#7f1d1d';
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
//  TYPEWRITER (lambat & bertekan)
// =========================================
function typeWriter(text, onDone) {
    cancelAnimationFrame(state.typingId);
    textElement.textContent = '';
    textElement.classList.add('cursor-blink');
    state.isTyping = true;

    let i = 0;
    let last = performance.now();
    const speed = 45; // lebih lambat = lebih mencekam

    function step(now) {
        if (!state.isTyping) return;
        if (now - last >= speed) {
            last = now;
            textElement.textContent += text.charAt(i);
            i++;
            textElement.scrollTop = textElement.scrollHeight;
            // blip rendah, jarang
            if (i % 7 === 0) blip(80 + Math.random() * 40, 0.03, 'sawtooth', 0.03);
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

    if (node.audio) playBGM(node.audio);

    // efek horor saat node muncul
    if (node.effect === 'shake') {
        setTimeout(() => {
            shakeScreen(650);
            flash('rgba(220,38,38,0.55)', 250);
            scareSound();
        }, 300);
    }
    if (node.effect === 'glitch') {
        textElement.classList.add('glitch');
        setTimeout(() => textElement.classList.remove('glitch'), 400);
    }

    typeWriter(node.text, () => showChoices(node));
}

function showChoices(node) {
    node.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className =
            "choice-btn w-full text-left bg-black/70 hover:bg-red-950/60 " +
            "border border-red-950/80 hover:border-red-600/80 text-red-200/80 " +
            "hover:text-red-100 font-mono py-3 px-5 rounded-none " +
            "transition-all duration-300 transform hover:translate-x-1 " +
            "active:scale-[0.98] text-sm md:text-[15px] tracking-wide " +
            "shadow-[0_0_20px_rgba(127,29,29,0.15)] hover:shadow-[0_0_28px_rgba(220,38,38,0.35)]";

        button.textContent = choice.text;
        button.style.opacity = '0';
        button.style.transform = 'translateX(-6px)';
        choicesContainer.appendChild(button);

        setTimeout(() => {
            button.style.transition = 'all 0.4s ease';
            button.style.opacity = '1';
            button.style.transform = 'translateX(0)';
        }, index * 120);

        button.addEventListener('click', () => {
            blip(180, 0.08, 'square', 0.06);
            onChoiceSelected(choice);
        });
    });

    startTimer(node.timeLimit, () => {
        blip(70, 0.35, 'sawtooth', 0.15);
        shakeScreen(400);
        const bad = node.choices[node.choices.length - 1];
        onChoiceSelected(bad, true);
    });
}

function onChoiceSelected(choice, isTimeout = false) {
    stopTimer();

    if (typeof choice.sanity === 'number') {
        state.sanity += choice.sanity;
    }
    const node = storyNodes[state.currentNode];
    if (node && typeof node.sanityDelta === 'number' && !choice.restart) {
        state.sanity += node.sanityDelta;
    }
    renderSanity();

    if (state.sanity <= 0 && !choice.restart) {
        gameOver();
        return;
    }

    if (choice.restart) {
        state.sanity = state.maxSanity;
        renderSanity();
    }

    setTimeout(() => startNode(choice.nextNode), 220);
}

function gameOver() {
    stopTimer();
    setChapter("Game Over");
    textElement.classList.remove('cursor-blink');
    textElement.textContent =
        "Kegelapan menelan segalanya...\n\nSANITY habis. Adirja tak sanggup lagi menatap lampu jalan itu.\n\n(GAME OVER)";

    // efek kematian
    flash('rgba(0,0,0,0.95)', 900);
    shakeScreen(700);
    blip(40, 1.0, 'sawtooth', 0.2);

    choicesContainer.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
        "choice-btn w-full text-left bg-red-950/70 hover:bg-red-900/80 " +
        "border border-red-800 hover:border-red-500 text-red-100 " +
        "font-mono py-3 px-5 rounded-none transition-all duration-300 " +
        "hover:translate-x-1 active:scale-[0.98] tracking-widest uppercase " +
        "shadow-[0_0_24px_rgba(220,38,38,0.4)]";
    btn.textContent = "⟲ Coba lagi dari awal";
    btn.addEventListener('click', () => {
        blip(120, 0.2, 'sawtooth', 0.1);
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
