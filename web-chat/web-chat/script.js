let conversationHistory = [];
let selectedFile = null;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
}

function triggerFileInput() {
    const input = document.getElementById('file-input');
    if (input) input.click();
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        const previewArea = document.getElementById('file-preview-area');
        if (previewArea) {
            previewArea.innerHTML = `<div style="background: rgba(0, 240, 255, 0.1); border: 1px solid #00f0ff; color: #00f0ff; padding: 5px 12px; border-radius: 15px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                📄 ${file.name} 
                <span onclick="removeSelectedFile()" style="cursor: pointer; color: #ff2a8d; font-weight: bold; margin-left: 5px;">✕</span>
            </div>`;
        }
    }
}

function removeSelectedFile() {
    selectedFile = null;
    const input = document.getElementById('file-input');
    if (input) input.value = '';
    const previewArea = document.getElementById('file-preview-area');
    if (previewArea) previewArea.innerHTML = '';
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function hideWelcomeCard() {
    const welcomeCard = document.querySelector('.welcome-card');
    if (welcomeCard) {
        welcomeCard.style.display = 'none';
    }
}

function appendUserMessage(text, fileName = null) {
    hideWelcomeCard();
    const container = document.getElementById('chat-container');
    if (!container) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user-message';
    
    let content = text;
    if (fileName) {
        content = `📁 <em>[Fichier: ${fileName}]</em><br>` + content;
    }
    
    msgDiv.innerHTML = content;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

// Parsing Markdown Neon Rose & Cyan
function parseMarkdownToHTML(text) {
    let formatted = text;

    formatted = formatted.replace(/^### (.*$)/gim, '<h3 style="color: #00f0ff; font-weight: bold; margin-top: 10px; margin-bottom: 5px;">$1</h3>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2 style="color: #00f0ff; font-weight: bold; margin-top: 12px; margin-bottom: 5px;">$1</h2>');
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ff2a8d; font-weight: bold;">$1</strong>');
    formatted = formatted.replace(/^---$/gim, '<hr style="border: 0; height: 1px; background: #333; margin: 10px 0;">');
    formatted = formatted.replace(/^\* (.*$)/gim, '<li style="margin-left: 15px;">$1</li>');
    formatted = formatted.replace(/^- (.*$)/gim, '<li style="margin-left: 15px;">$1</li>');
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

// Indicator 🤔 Mieritreritra
function showThinkingIndicator() {
    const container = document.getElementById('chat-container');
    if (!container) return null;

    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = 'thinking-indicator';
    thinkingDiv.className = 'message bot-message';
    thinkingDiv.style.color = '#00f0ff';
    thinkingDiv.style.fontSize = '15px';
    thinkingDiv.style.fontStyle = 'italic';
    thinkingDiv.innerHTML = '🤔 AI ARISON dia mieritreritra...';

    container.appendChild(thinkingDiv);
    container.scrollTop = container.scrollHeight;
    return thinkingDiv;
}

function removeThinkingIndicator() {
    const indicator = document.getElementById('thinking-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// VALINTENY MISESISESY (TYPEWRITER EFFECT)
function appendBotSubtitleMessage(fullText) {
    const container = document.getElementById('chat-container');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-message';
    container.appendChild(msgDiv);

    let currentIndex = 0;
    const speed = 15; // Vitesse amin'ny ms (misesisesy tsara sy haingana)

    function typeNextChar() {
        if (currentIndex <= fullText.length) {
            let currentSubString = fullText.substring(0, currentIndex);
            msgDiv.innerHTML = parseMarkdownToHTML(currentSubString);
            container.scrollTop = container.scrollHeight;
            currentIndex++;
            setTimeout(typeNextChar, speed);
        }
    }

    typeNextChar();
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    if (!input) return;
    const text = input.value.trim();
    
    if (!text && !selectedFile) return;

    const fileToSend = selectedFile;
    const fileName = fileToSend ? fileToSend.name : null;

    appendUserMessage(text, fileName);
    saveToHistory(text || fileName);
    
    input.value = '';
    removeSelectedFile();

    showThinkingIndicator();

    const formData = new FormData();
    formData.append('message', text);
    if (fileToSend) {
        formData.append('file', fileToSend);
    }

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        removeThinkingIndicator();
        appendBotSubtitleMessage(data.reply);
    } catch (err) {
        removeThinkingIndicator();
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
        if (micIcon) micIcon.style.color = '#8b949e';
        sendMessage();
    };

    recognition.onerror = () => { if (micIcon) micIcon.style.color = '#8b949e'; };
    recognition.onend = () => { if (micIcon) micIcon.style.color = '#8b949e'; };

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
