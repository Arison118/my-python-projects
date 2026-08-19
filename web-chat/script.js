const API_KEY = "AQ.Ab8RN6JTdS1AJdZyRQTPiXbMkyGRpnid_rwBgZ4vcAodtKmM4w";

const SYSTEM_INSTRUCTION = "Ianao dia AI Arison. Valio amin'ny teny Malagasy mazava tsara ny fanontaniana. Mampiasà sous-titres (mampiasa ###), teny misongadina (mampiasa **bold**), ary EMOJIS mifanaraka tsara amin'ny anton-dresaka isaky ny fehezanteny na hevitra iray (ohatra: ❤️, 🚀, 💡, 📝, ✨).";

function toggleMenu() {
    const menu = document.getElementById("fileMenu");
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

function triggerFile(type) {
    toggleMenu();
    if (type === 'file') document.getElementById('fileInput').click();
    if (type === 'image') document.getElementById('imageInput').click();
    if (type === 'camera') document.getElementById('cameraInput').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const inputField = document.getElementById("userInput");
        inputField.value = `[Fichier voafidy: ${file.name}] `;
    }
}

let recognition;
function toggleMic() {
    const micBtn = document.getElementById("micBtn");
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Tsy mahazaka Vocal Speech ny Browser-nao tompoko.");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'mg-MG';
    recognition.continuous = false;

    recognition.onstart = () => { micBtn.style.color = "#ff007f"; };
    recognition.onresult = (event) => {
        document.getElementById("userInput").value = event.results[0][0].transcript;
        micBtn.style.color = "#00f2fe";
    };
    recognition.onerror = () => { micBtn.style.color = "#00f2fe"; };
    recognition.onend = () => { micBtn.style.color = "#00f2fe"; };

    recognition.start();
}

async function sendMessage() {
    const inputField = document.getElementById("userInput");
    const messageText = inputField.value.trim();
    const chatContainer = document.getElementById("chatContainer");
    const welcomeCard = document.getElementById("welcomeCard");

    if (messageText === "") return;

    if (welcomeCard) welcomeCard.style.display = "none";

    const userDiv = document.createElement("div");
    userDiv.className = "message user-message";
    userDiv.textContent = messageText;
    chatContainer.appendChild(userDiv);

    inputField.value = "";
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const botDiv = document.createElement("div");
    botDiv.className = "message bot-message";
    botDiv.textContent = "⏳ Arison mieritreritra...";
    chatContainer.appendChild(botDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nFanontaniana: ${messageText}` }]
                }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            let rawText = data.candidates[0].content.parts[0].text;
            
            // Fandikana ny text ho HTML amin'ny Marked.js (mampiditra ny loko sy sous-titres)
            if (typeof marked !== 'undefined') {
                botDiv.innerHTML = marked.parse(rawText);
            } else {
                botDiv.textContent = rawText;
            }
        } else {
            botDiv.textContent = "❌ Nisy olana kely tamin'ny valiny, andramo indray tompoko.";
        }
    } catch (error) {
        botDiv.textContent = "❌ Tsy afaka nampifandray amin'ny servera.";
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

