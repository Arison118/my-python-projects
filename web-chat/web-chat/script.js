let conversationHistory = [];

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function triggerFileInput() {
    document.getElementById('file-input').click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        appendUserMessage(`📁 Fichier voafidy: ${file.name}`);
        saveToHistory(`📁 Fichier: ${file.name}`);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function appendUserMessage(text) {
    const container = document.getElementById('chat-container');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user-message';
    msgDiv.innerText = text;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function appendBotSubtitleMessage(text) {
    const container = document.getElementById('chat-container');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-message';
    container.appendChild(msgDiv);

    let index = 0;
    const interval = setInterval(() => {
        msgDiv.innerText += text.charAt(index);
        index++;
        container.scrollTop = container.scrollHeight;
        if (index >= text.length) {
            clearInterval(interval);
        }
    }, 25);
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    appendUserMessage(text);
    saveToHistory(text);
    input.value = '';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        appendBotSubtitleMessage(data.reply);
    } catch (err) {
        appendBotSubtitleMessage("⚠️ Misy olana kely ny fifandraisana tompoko, andramo indray azafady!");
    }
}

// Voice Recognition
function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Tsy mahazaka Voice Recognition ny browser-nao tompoko.");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    const micIcon = document.getElementById('mic-icon');
    micIcon.style.color = '#ff007f';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('user-input').value = transcript;
        micIcon.style.color = '#58a6ff';
        sendMessage();
    };

    recognition.onerror = () => {
        micIcon.style.color = '#58a6ff';
    };

    recognition.onend = () => {
        micIcon.style.color = '#58a6ff';
    };

    recognition.start();
}

function saveToHistory(text) {
    conversationHistory.push(text);
    const list = document.getElementById('history-list');
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = text;
    list.prepend(item);
}
