const chatContainer = document.getElementById("chatContainer");
const welcomeCard = document.getElementById("welcomeCard");
const inputField = document.getElementById("inputField");

let selectedImageData = null;

// System Instruction vaovao: Mamaly amin'ny fiteny ampiasain'ny mpampiasa
const SYSTEM_INSTRUCTION = `
Tu es AI ARISON, un assistant IA expert et polyglotte (multilingual).
RÈGLES IMPORTANTES DE LANGUE ET DE FORMAT :
1. DÉTECTION DE LA LANGUE : Réponds TOUJOURS dans la même langue que celle utilisée par l'utilisateur (Français, Anglais, Malagasy, Espagnol, etc.).
2. STRUCTURE DU FORMATAGE :
   - Les grands titres (A, B, C...) doivent utiliser : <span class="title-grand">A) Titre... [Emoji]</span>
   - Les sous-titres (1, 2, 3...) doivent utiliser : <span class="title-petit">1 - Sous-titre... [Emoji]</span>
   - Les explications doivent utiliser des puces simples (.) sans symboles complexes inutiles.
`;

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const fullDataUrl = e.target.result;
    
    selectedImageData = {
      inlineData: {
        mimeType: file.type,
        data: fullDataUrl.split(',')[1]
      }
    };

    const userDiv = document.createElement('div');
    userDiv.className = 'message user-message';
    userDiv.innerHTML = `<img src="${fullDataUrl}" style="max-width: 200px; border-radius: 8px; display: block;">`;
    chatContainer.appendChild(userDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };
  reader.readAsDataURL(file);
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Function mamokatra ny valin-teny misesisesy sy haingana (Typewriter Streaming)
function streamResponseText(container, fullText, onComplete) {
  const textDiv = document.createElement("div");
  container.appendChild(textDiv);

  const words = fullText.split(" ");
  let index = 0;

  const interval = setInterval(() => {
    if (index < words.length) {
      const currentText = words.slice(0, index + 1).join(" ");
      textDiv.innerHTML = typeof marked !== 'undefined' ? marked.parse(currentText) : currentText;
      index++;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    } else {
      clearInterval(interval);
      if (onComplete) onComplete();
    }
  }, 25); // Haingana sady mirindra
}

async function sendMessage() {
  const messageText = inputField.value.trim();
  if (messageText === "" && !selectedImageData) return;

  if (welcomeCard) welcomeCard.style.display = "none";

  if (messageText !== "") {
    const userDiv = document.createElement('div');
    userDiv.className = 'message user-message';
    userDiv.textContent = messageText;
    chatContainer.appendChild(userDiv);
  }

  inputField.value = "";

  const botDiv = document.createElement("div");
  botDiv.className = "message bot-message";
  botDiv.textContent = "⌛ AI ARISON...";
  chatContainer.appendChild(botDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const parts = [];
  if (messageText) {
    parts.push({ text: SYSTEM_INSTRUCTION + "\n\nMessage de l'utilisateur: " + messageText });
  }
  if (selectedImageData) {
    parts.push(selectedImageData);
  }

  const models = [
    "gemini-3.6-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash"
  ];

  let success = false;
  let rawText = "";

  for (const model of models) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=AQ.Ab8RN6KNGVj0o20hzmkuy58zdB6WkM38x-gk6AG5yeEB8azqgQ`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: parts }] })
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        rawText = data.candidates[0].content.parts[0].text;
        success = true;
        break;
      }
    } catch (err) {
      console.log(`Erreur avec le modèle ${model}`);
    }
  }

  botDiv.textContent = "";

  if (success) {
    streamResponseText(botDiv, rawText, () => {
      const footerDiv = document.createElement("div");
      footerDiv.className = "bot-footer-content";
      footerDiv.innerHTML = `
        <div class="message-actions">
          <button class="action-btn" onclick="handleFeedback(this, 'like')" title="J'aime"><i class="fa-regular fa-thumbs-up"></i></button>
          <button class="action-btn" onclick="handleFeedback(this, 'dislike')" title="Je n'aime pas"><i class="fa-regular fa-thumbs-down"></i></button>
          <button class="action-btn" onclick="regenerateResponse()" title="Régénérer"><i class="fa-solid fa-rotate-right"></i></button>
          <button class="action-btn" onclick="shareMessage()" title="Partager"><i class="fa-solid fa-share-nodes"></i></button>
          <button class="action-btn" onclick="copyMessage(this)" title="Copier"><i class="fa-regular fa-copy"></i></button>
          <button class="action-btn" onclick="showMoreOptions()" title="Plus"><i class="fa-solid fa-ellipsis-vertical"></i></button>
        </div>
      `;
      botDiv.appendChild(footerDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });
  } else {
    botDiv.textContent = "❌ Erreur de connexion au serveur.";
  }

  selectedImageData = null;
}

function handleFeedback(btn, type) {
  alert(type === 'like' ? 'Merci pour votre retour !' : 'Merci pour votre avis !');
}

function regenerateResponse() {
  sendMessage();
}

function shareMessage() {
  if (navigator.share) {
    navigator.share({ title: 'AI ARISON', text: 'Discussion avec AI ARISON' });
  } else {
    alert('Partage non supporté.');
  }
}

function copyMessage(btn) {
  const messageContent = btn.closest('.bot-message').querySelector('div').innerText;
  navigator.clipboard.writeText(messageContent).then(() => {
    alert('Texte copié !');
  });
}

function showMoreOptions() {
  alert('Options supplémentaires...');
}
