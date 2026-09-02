const chatContainer = document.getElementById("chatContainer");
const welcomeCard = document.getElementById("welcomeCard");
const inputField = document.getElementById("inputField");

let selectedImageData = null;

const SYSTEM_INSTRUCTION = `
Izaho no AI ARISON, mpanampy ara-tsaina sy ara-teknolojia amin'ny fiteny Malagasy.
Aramahao hatrany ity rafitra fanoratana valin-teny ity:
1. Ny Grand Titre (A, B, C...) dia atombohy amin'ny: <span class="title-grand">A) Titre... [Emoji]</span>
2. Ny Sous-titre (1, 2, 3...) dia atombohy amin'ny: <span class="title-petit">1 - Titre... [Emoji cool]</span>
3. Ny fanazavana ambany dia atoroy amin'ny teboka (.) amin'ny laharana mijadona mahazatra. Tsy azo asiana karakteri mikorontana (+*"'&#€/!?¢^°¥) raha tsy tena ilaina manokana.
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

// Function mamokatra ny valin-teny misesisesy sy haingana be (Streaming Effect)
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
  }, 30); // 30ms = Haingana be sady tsy misy bug
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
  botDiv.textContent = "⌛ AI ARISON mieritreritra...";
  chatContainer.appendChild(botDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const parts = [];
  if (messageText) {
    parts.push({ text: SYSTEM_INSTRUCTION + "\n\nFanontaniana: " + messageText });
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
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=AQ.Ab8RN6LNtNj0mfZwUlkxeB7ijDWdzqQMCL7lDvc01iaOBeZVVQ`, {
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
      console.log(`Olana amin'ny model ${model}, manandrana manaraka...`);
    }
  }

  botDiv.textContent = ""; // Fafana ilay soratra mieritreritra

  if (success) {
    // Misesisesy sy haingana be ny fivoahan'ny valin-teny
    streamResponseText(botDiv, rawText, () => {
      // Rehefa tapitra tanteraka ny fanoratana vao ampidirina ny bokotra 6
      const footerDiv = document.createElement("div");
      footerDiv.className = "bot-footer-content";
      footerDiv.innerHTML = `
        <div class="message-actions">
          <button class="action-btn" onclick="handleFeedback(this, 'like')" title="Tsara"><i class="fa-regular fa-thumbs-up"></i></button>
          <button class="action-btn" onclick="handleFeedback(this, 'dislike')" title="Tsy tsara"><i class="fa-regular fa-thumbs-down"></i></button>
          <button class="action-btn" onclick="regenerateResponse()" title="Averina"><i class="fa-solid fa-rotate-right"></i></button>
          <button class="action-btn" onclick="shareMessage()" title="Hiraidana"><i class="fa-solid fa-share-nodes"></i></button>
          <button class="action-btn" onclick="copyMessage(this)" title="Kopiavy"><i class="fa-regular fa-copy"></i></button>
          <button class="action-btn" onclick="showMoreOptions()" title="Hafa"><i class="fa-solid fa-ellipsis-vertical"></i></button>
        </div>
      `;
      botDiv.appendChild(footerDiv);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });
  } else {
    botDiv.textContent = "❌ Tsy afaka nampifandray na lany ny quota amin'ny models rehetra.";
  }

  selectedImageData = null;
}

function handleFeedback(btn, type) {
  alert(type === 'like' ? 'Misaotra amin\'ny fankasitrahana!' : 'Misaotra amin\'ny fanehoan-kevitra!');
}

function regenerateResponse() {
  sendMessage();
}

function shareMessage() {
  if (navigator.share) {
    navigator.share({ title: 'AI ARISON', text: 'Resaka avy amin\'ny AI ARISON' });
  } else {
    alert('Tsy zaka amin\'ity browser ity ny fizarana.');
  }
}

function copyMessage(btn) {
  const messageContent = btn.closest('.bot-message').querySelector('div').innerText;
  navigator.clipboard.writeText(messageContent).then(() => {
    alert('Voakopy ny teksta!');
  });
}

function showMoreOptions() {
  alert('Safidy fanampiny...');
}
