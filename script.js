// ==========================================
// 1. CONFIGURATION GEMINI API
// ==========================================
// Ampidiro eto ny Gemini API Key-nao
const GEMINI_API_KEY = "AQ.Ab8RN6KNGVj0o20hzmkuy58zdB6WkM38x-gk6AG5yeEB8azqgQ";

// Fonction manitsy ny endriky ny valin-kafatra (Formatting)
function formatAIResponse(text) {
  if (!text) return "";
  return text
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

// ==========================================
// 2. FONCTION MAIN: FANDEFASANA HAFATRA
// ==========================================
async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const welcomeScreen = document.getElementById("welcome-screen");

  if (!input || !chatBox) return;

  const msg = input.value.trim();
  if (msg === "") return;

  // Afeno ny screen fiandohana
  if (welcomeScreen) {
    welcomeScreen.style.display = "none";
  }

  // A. ASEHOY NY HAFATRY NY MPAMPIASA (USER)
  const userDiv = document.createElement("div");
  userDiv.className = "message user-msg";
  userDiv.textContent = msg;
  chatBox.appendChild(userDiv);

  // Fafao ny ao anaty vata
  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // B. ASEHOY NY TEO-MAMONJY (LOADING)
  const loadingId = "load-" + Date.now();
  const aiDiv = document.createElement("div");
  aiDiv.className = "message ai-msg";
  aiDiv.id = loadingId;
  aiDiv.innerHTML = '<span style="color: #94a3b8; font-style: italic;">AI ARISON dia mieritreritra...</span>';
  chatBox.appendChild(aiDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  // C. PAMPIFANDRAISANA AMIN'NY GEMINI API
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: msg }] }] })
    });

    const data = await response.json();

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const replyText = data.candidates[0].content.parts[0].text;
      document.getElementById(loadingId).innerHTML = formatAIResponse(replyText);
    } else {
      document.getElementById(loadingId).innerHTML = "Misy olana ny API Key na ny valin-kafatra.";
    }
  } catch (error) {
    document.getElementById(loadingId).innerHTML = "Misy olana amin'ny réseau. Jereo ny connexion-nao.";
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ==========================================
// 3. LISTENERS MUMPILA TSARA NY BOUTON SY CLAVIER
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  const sendBtn = document.getElementById("send-btn");
  const input = document.getElementById("user-input");

  // Rehefa tsindriana ny Bouton Send
  if (sendBtn) {
    sendBtn.addEventListener("click", function (e) {
      e.preventDefault();
      sendMessage();
    });
  }

  // Rehefa tsindriana ny Enter amin'ny Clavier
  if (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});

// ==========================================
// 4. FONCTIONS FANAMPINY (SIDEBAR & THEME)
// ==========================================
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.toggle("active");
}

function toggleTheme() {
  document.body.classList.toggle("light-mode");
  document.body.classList.toggle("dark-mode");
}
