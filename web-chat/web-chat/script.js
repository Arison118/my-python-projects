document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const fileInput = document.getElementById('file-input');
    const chatBox = document.getElementById('chat-box');
    const fileIndicator = document.getElementById('file-indicator');
    const fileNameSpan = document.getElementById('file-name');
    const removeFileIcon = document.getElementById('remove-file');

    // Dropdown Elements
    const modelBtn = document.getElementById('model-dropdown-btn');
    const modelMenu = document.getElementById('model-menu');
    const modelOptions = document.querySelectorAll('.model-option');
    const currentModelLabel = document.getElementById('current-model-label');

    let selectedModel = 'lite'; // Default choice: 3.5 Flash-Lite

    // Toggle Dropdown Menu
    modelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        modelMenu.classList.toggle('hidden');
    });

    // Close Menu when clicking anywhere outside
    document.addEventListener('click', () => {
        modelMenu.classList.add('hidden');
    });

    // Handle Model Selection
    modelOptions.forEach(option => {
        option.addEventListener('click', () => {
            modelOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            selectedModel = option.getAttribute('data-model');
            const title = option.querySelector('.model-title').innerText;
            currentModelLabel.innerText = title;

            modelMenu.classList.add('hidden');
        });
    });

    // Handle File Selection
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileNameSpan.innerText = fileInput.files[0].name;
            fileIndicator.classList.remove('hidden');
        }
    });

    removeFileIcon.addEventListener('click', () => {
        fileInput.value = '';
        fileIndicator.classList.add('hidden');
    });

    // Handle Form Submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        const file = fileInput.files[0];

        if (!message && !file) return;

        // Display User Message
        appendMessage('user', message || (file ? `[Fichier: ${file.name}]` : ''));

        userInput.value = '';
        fileInput.value = '';
        fileIndicator.classList.add('hidden');

        // Loading Indicator
        const loadingDiv = appendMessage('ai', 'Thinking...');

        const formData = new FormData();
        formData.append('message', message);
        formData.append('model', selectedModel);
        if (file) formData.append('file', file);

        try {
            const res = await fetch('/chat', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            loadingDiv.innerHTML = marked.parse(data.reply);
        } catch (err) {
            loadingDiv.innerHTML = 'Misy olana amin\'ny fifandraisana tompoko!';
        }
    });

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        msgDiv.innerHTML = text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
        return msgDiv;
    }
});
