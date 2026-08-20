let conversationHistory = [];

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
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
    if (!container) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user-message';
    msgDiv.innerText = text;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// Function mametraka ny parsing sy loko Rose & Cyan Neon
function parseMarkdownToHTML(text) {
    let formatted = text;

    // Headings (### na ##) -> Cyan Neon color (#00f0ff)
    formatted = formatted.replace(/^### (.*$)/gim, '<h3 style="color: #00f0ff; font-weight: bold; margin-top: 10px; margin-bottom: 5px;">$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2 style="color: #00f0ff; font-weight: bold; margin-top: 12px; margin-bottom: 5px;">$1</h2>');

    // Bold (**text**) -> Rose Neon color (#ff2a8d)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ff2a8d; font-weight: bold;">$1</strong>');

    // Horizontal Rules (---)
    formatted = formatted.replace(/^---$/gim, '<hr style="border: 0; height: 1px; background: #333; margin: 10px 0;">');

    // Bullet points
    formatted = formatted.replace(/^\* (.*$)/gim, '<li style="margin-left: 15px;">$1</li>');
    formatted = formatted.replace(/^- (.*$)/gim, '<li style="margin-left: 15px;">$1</li>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

function appendBotSubtitleMessage(text) {
    const container = document.getElementById('chat-container');
    if (!container) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-message';
    msgDiv.style.color = '#ffffff';
    msgDiv.style.lineHeight = '1.6';
    msgDiv.style.fontSize = '15px';
    
    container.appendChild(msgDiv);

    let htmlFormatted = parseMarkdownToHTML(text);
    msgDiv.innerHTML = htmlFormatted;
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    if (!input) return;
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
    if (micIcon) micIcon.style.color = '#ff007f';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('user-input').value = transcript;
        if (micIcon) micIcon.style.color = '#58a6ff';
        sendMessage();
    };

    recognition.onerror = () => { if (micIcon) micIcon.style.color = '#58a6ff'; };
    recognition.onend = () => { if (micIcon) micIcon.style.color = '#58a6ff'; };

    recognition.start();
}

function saveToHistory(text) {
    conversationHistory.push(text);
    const list = document.getElementById('history-list');
    if (list) {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerText = text;
        list.prepend(item);
    }
}
