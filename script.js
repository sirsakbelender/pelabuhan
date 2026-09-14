// Elemen HTML
const textElement = document.getElementById('story-text');
const choicesContainer = document.getElementById('choices-container');
const audioPlayer = document.getElementById('game-audio');

// Database Cerita, Pilihan, dan Suara
const storyNodes = {
    1: {
        text: "Tahun 1947. Suasana malam terasa dingin menusuk tulang. Adirja berdiri di bawah temaram lampu jalan, menatap bayangan seorang pria tegap bertopi baret. Itu Westerling. Dengan suara bergetar, Adirja bertanya: 'Mau apa kamu ke sini?!'",
        audio: "audio/bgm.mp3", 
        choices: [
            { text: "⚡ Tantang dia duel 1 lawan 1 cara jantan", nextNode: 2 },
            { text: "☕ Ajak dia ngopi bareng biar gak tegang", nextNode: 3 }
        ]
    },
    2: {
        text: "Adirja langsung pasang kuda-kuda silat. Westerling malah tertawa sinis, 'Hahaha, bocah kurang ajar!'. Tiba-tiba duarr! Suara tembakan menggelegar di udara... \n\nGAME OVER. (Yah, lu mati konyol, dek).",
        audio: "audio/kaget.mp3",
        choices: [
            { text: "🔄 Ulangi dari Awal (Penasaran)", nextNode: 1 }
        ]
    },
    3: {
        text: "Westerling tertegun. Sorot matanya melunak. Dia perlahan menurunkan senjatanya dan tersenyum tipis. 'Kopi hitam tanpa gula, ya,' bisiknya. Adirja tersipu malu di bawah lampu sejarah. Persahabatan tak terduga pun dimulai.\n\nTAMAT? (Ending paling wibu sejarah).",
        audio: "audio/ketawa.mp3",
        choices: [
            { text: "✨ Main Lagi dari Awal", nextNode: 1 }
        ]
    }
};

// Fungsi Efek Mengetik (Typing Effect) biar gak kaku
function typeWriter(text, i = 0, callback) {
    if (i === 0) {
        textElement.innerText = '';
    }
    if (i < text.length) {
        textElement.innerText += text.charAt(i);
        // Atur kecepatan ketik di sini (makin kecil makin cepat)
        setTimeout(() => typeWriter(text, i + 1, callback), 20); 
    } else if (callback) {
        callback();
    }
}

// Fungsi untuk menjalankan game
function startNode(nodeIndex) {
    const node = storyNodes[nodeIndex];
    
    // 1. Kosongkan tombol dulu selama teks lagi ngetik
    choicesContainer.innerHTML = '';

    // 2. Mainkan Suara / SFX
    if (node.audio) {
        audioPlayer.src = node.audio;
        audioPlayer.play().catch(e => console.log("Audio diblokir browser, interaksi dulu: ", e));
    }

    // 3. Jalankan efek teks mengetik, baruunculin tombol setelah teks selesai
    typeWriter(node.text, 0, () => {
        // 4. Munculkan tombol pilihan baru dengan animasi halus
        node.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.innerText = choice.text;
            
            // Styling Tailwind yang lebih hidup (pakai transisi, hover glow, dan border tipis)
            button.className = "w-full text-left bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 text-slate-200 hover:text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 active:scale-[0.98] shadow-md";
            
            // Efek muncul bertahap dikit (opsional)
            button.style.opacity = '0';
            button.style.transform = 'translateY(10px)';
            choicesContainer.appendChild(button);

            setTimeout(() => {
                button.style.transition = 'all 0.3s ease';
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }, index * 100);

            // Fungsi klik pilihan
            button.addEventListener('click', () => startNode(choice.nextNode));
        });
    });
}

// Jalankan game pertama kali saat web dibuka
startNode(1);
