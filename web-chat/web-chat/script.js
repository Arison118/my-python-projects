document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('file-input');
    const micBtn = document.getElementById('mic-btn');

    function formatAiResponse(text) {
        let lines = text.split('\n');
        let formatted = '';

        lines.forEach(line => {
            let trimmed = line.trim();
            // Raha Grand A, B, C...
            if (/^[A-Z]\)/.test(trimmed)) {
                formatted += `<span class="grand-title">${trimmed}</span>\n`;
            }
            // Raha Petit 1, 2, 3...
            else if (/^\d+\s*-/.test(trimmed)) {
                formatted += `<span class="petit-title">${trimmed}</span>\n`;
            }
            // Raha Teboka na Fanazavana
            else if (trimmed.startsWith('.') || trimmed.startsWith('-')) {
                formatted += `<span class="detail-text">${trimmed}</span>\n`;
            }
            else if (trimmed.length > 0) {
                formatted += `<div style="margin-bottom: 6px; color: #d1d5db;">${trimmed}</div>`;
            }
        });

        return formatted || text;
    }

    function appendMessage(sender, text, isHtml = false) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        
        if (isHtml) {
            msgDiv.innerHTML = text;
        } else {
            msgDiv.textContent = text;
        }
        
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const text = userInput.value.trim();
        const file = fileInput.files[0];

        if (!text && !file) return;

        let displayMsg = text;
        if (file) {
            displayMsg += ` [Fichier: ${file.name}]`;
        }

        appendMessage('user', displayMsg);
        userInput.value = '';
        fileInput.value = '';

        const formData = new FormData();
        formData.append('message', text);
        if (file) {
            formData.append('file', file);
        }

        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'bot-message');
        loadingDiv.textContent = 'AI ARISON dia mamakafaka...';
        chatBox.appendChild(loadingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            chatBox.removeChild(loadingDiv);

            const htmlReply = formatAiResponse(data.reply);
            appendMessage('bot', htmlReply, true);

        } catch (error) {
            chatBox.removeChild(loadingDiv);
            appendMessage('bot', '⚠️ Misy olana kely amin'ny fifandraisana.');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Voice Recognition (Microphone)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'mg-MG'; // na fr-FR / en-US

        micBtn.addEventListener('click', () => {
            recognition.start();
            micBtn.style.color = '#00f0ff';
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            micBtn.style.color = '';
        };

        recognition.onerror = () => {
            micBtn.style.color = '';
        };
    }
});
