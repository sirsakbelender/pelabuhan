// Elemen HTML
const textElement = document.getElementById('story-text');
const choicesContainer = document.getElementById('choices-container');
const audioPlayer = document.getElementById('game-audio');

// Database Cerita, Pilihan, dan Suara
const storyNodes = {
    1: {
        text: "Tahun 1947. Suasana malam terasa dingin. Adirja berdiri di bawah lampu jalan, menatap bayangan seorang pria tegap bertopi baret. Itu Westerling. 'Mau apa kamu ke sini?', tanya Adirja dengan serius.",
        audio: "audio/bgm.mp3", // Ganti dengan file audio lu
        choices: [
            { text: "Tantang dia duel 1 lawan 1", nextNode: 2 },
            { text: "Ajak dia ngopi bareng biar akrab", nextNode: 3 }
        ]
    },
    2: {
        text: "Adirja memasang kuda-kuda. Westerling malah tertawa sinis, 'Hahaha, berani sekali kamu!'. Tiba-tiba suara tembakan menggelegar! GAME OVER (Jokes doang).",
        audio: "audio/kaget.mp3",
        choices: [
            { text: "Ulangi dari Awal", nextNode: 1 }
        ]
    },
    3: {
        text: "Westerling tertegun. Dia menurunkan senjatanya dan tersenyum tipis. 'Kopi hitam tanpa gula,' bisiknya. Adirja tersipu malu di bawah temaram lampu sejarah. TAMAT?",
        audio: "audio/ketawa.mp3",
        choices: [
            { text: "Main Lagi", nextNode: 1 }
        ]
    }
};

// Fungsi untuk menjalankan game
function startNode(nodeIndex) {
    const node = storyNodes[nodeIndex];
    
    // 1. Update Teks Cerita
    textElement.innerText = node.text;

    // 2. Mainkan Suara / SFX
    if (node.audio) {
        audioPlayer.src = node.audio;
        audioPlayer.play().catch(e => console.log("Audio gagal play otomatis karena kebijakan browser: ", e));
    }

    // 3. Bersihkan tombol pilihan lama
    choicesContainer.innerHTML = '';

    // 4. Munculkan tombol pilihan baru
    node.choices.forEach(choice => {
        const button = document.createElement('button');
        button.innerText = choice.text;
        
        // Styling tombol pakai Tailwind
        button.className = "w-full text-left bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition duration-200 active:scale-[0.98]";
        
        // Fungsi klik pilihan
        button.addEventListener('click', () => startNode(choice.nextNode));
        
        choicesContainer.appendChild(button);
    });
}

// Jalankan game pertama kali saat web dibuka
startNode(1);
