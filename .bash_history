        elif ext == 'docx':
            doc = docx.Document(io.BytesIO(file_bytes))
            text = "\n".join([p.text for p in doc.paragraphs])
    except Exception as e:
        text = f"[Olana amin'ny famakiana ny fichier: {str(e)}]"
    return text

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('.', path)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_msg = request.form.get('message', '')
        file_obj = request.files.get('file')

        full_prompt = user_msg

        if file_obj:
            filename = file_obj.filename
            file_bytes = file_obj.read()
            extracted_text = extract_text_from_file(file_bytes, filename)
            full_prompt += f"\n\n--- AMBATON'NY RAKITRA / FICHIER ({filename}) ---\n{extracted_text}\n--- FARANY ---"

        if not full_prompt.strip():
            return jsonify({'reply': 'Azafady, soraty ny hafatrao na andefaso fichier tompoko!'})

        try:
            model = genai.GenerativeModel(model_name=PRIMARY_MODEL, system_instruction=SYSTEM_PROMPT)
            res = model.generate_content(full_prompt)
            return jsonify({'reply': res.text})
        except Exception as primary_err:
            print(f"[AI ARISON Engine] Primary model {PRIMARY_MODEL} error: {primary_err}. Cascading to backup {BACKUP_MODEL}...")
            try:
                backup = genai.GenerativeModel(model_name=BACKUP_MODEL, system_instruction=SYSTEM_PROMPT)
                res_backup = backup.generate_content(full_prompt)
                return jsonify({'reply': res_backup.text})
            except Exception as backup_err:
                raise backup_err

    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower():
            return jsonify({'reply': '⚠️ Mialana tsiny tompoko, sahirana kely ny API. Miandrasa kely 5 segondra vao mamerina!'})
        return jsonify({'reply': f'Misy olana kely: {err_str}'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
EOF

cat << 'EOF' >> style.css

/* --- FANAMPIANA STYLES HO AN'NY AI ARISON TYPOGRAPHY --- */
.chat-response-content {
  line-height: 1.6;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #e0e6ed;
}

/* Grand A, B, C (Sous-titre Lehibe) */
.grand-title {
  color: #00f0ff; /* Neon Cyan */
  font-size: 1.15rem;
  font-weight: 700;
  margin-top: 18px;
  margin-bottom: 12px;
  display: block;
}

/* Petit 1, 2, 3 (Zana-tsoratra mikisaka horizontal) */
.petit-title {
  color: #00ff87; /* Emerald Green Neon */
  font-size: 1.02rem;
  font-weight: 600;
  margin-left: 24px; /* Mikisaka 3 spaces / 24px */
  margin-top: 8px;
  margin-bottom: 6px;
  display: block;
}

/* Teboka . sy Fanazavana */
.detail-text {
  margin-left: 24px; /* Mitovy elanelana amin'ny petit title */
  color: #d1d5db; /* Loko madio tokana */
  margin-bottom: 8px;
  display: block;
}
EOF

cat << 'EOF' > script.js
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
EOF

git add app.py style.css script.js
git commit -m "Enhance UI typography: add hierarchical indentation, custom titles, clean fonts and emoji placement"
git push origin main
cd ~/web-chat/web-chat
# Averina ilay script.js teo aloha mba hamerenana ny fizotran'ny hafatra
git checkout HEAD~1 -- script.js
cat << 'EOF' > app.py
import os
import io
import google.generativeai as genai
from flask import Flask, send_from_directory, request, jsonify
from pypdf import PdfReader
import docx

app = Flask(__name__, static_folder='.')

SYSTEM_PROMPT = """
Ianao dia AI ARISON, mpanampy ara-tsaina manam-pahaizana.

FITSIPIKA MANDRAKIZAY AMIN'NY FANDAMINANA VALINTENY:
1. Rehefa manao LOHATENY LEHIBE (Sous-titre A, B, C...), dia ampiasao ny format:
   # A) Lohateny Lehibe
   (Asio fitsimbikinana tsipika roa aoriany).

2. Rehefa manao ZANA-TSORATRA (Petit 1, 2, 3...), dia ampiasao ny format:
   - **1 - Zana-tsoratra...** 🎯 (Asio Emoji mifanaraka aminy eo amin'ny farany).

3. Rehefa manao FANAZAVANA SY TEBOKA:
     . Soratra madio amin'ny loko tokana, tsy misy marika mikorontana.

4. Aza mampiasa marika mikorontana tsy amin'ny antony. Valio amin'ny fiteny ampiasain'ny mpampiasa hatrany.
"""

api_key = os.environ.get('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)

PRIMARY_MODEL = 'gemini-3.6-flash'
BACKUP_MODEL = 'gemini-3.5-flash-lite'

def extract_text_from_file(file_bytes, filename):
    ext = filename.split('.')[-1].lower()
    text = ""
    try:
        if ext == 'txt':
            text = file_bytes.decode('utf-8', errors='ignore')
        elif ext == 'pdf':
            pdf = PdfReader(io.BytesIO(file_bytes))
            for page in pdf.pages:
                t = page.extract_text()
                if t: text += t + "\n"
        elif ext == 'docx':
            doc = docx.Document(io.BytesIO(file_bytes))
            text = "\n".join([p.text for p in doc.paragraphs])
    except Exception as e:
        text = f"[Olana amin'ny famakiana ny fichier: {str(e)}]"
    return text

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('.', path)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_msg = request.form.get('message', '')
        file_obj = request.files.get('file')

        full_prompt = user_msg

        if file_obj:
            filename = file_obj.filename
            file_bytes = file_obj.read()
            extracted_text = extract_text_from_file(file_bytes, filename)
            full_prompt += f"\n\n--- AMBATON'NY RAKITRA / FICHIER ({filename}) ---\n{extracted_text}\n--- FARANY ---"

        if not full_prompt.strip():
            return jsonify({'reply': 'Azafady, soraty ny hafatrao na andefaso fichier tompoko!'})

        try:
            model = genai.GenerativeModel(model_name=PRIMARY_MODEL, system_instruction=SYSTEM_PROMPT)
            res = model.generate_content(full_prompt)
            return jsonify({'reply': res.text})
        except Exception as primary_err:
            print(f"[AI ARISON Engine] Primary model {PRIMARY_MODEL} error: {primary_err}. Cascading to backup {BACKUP_MODEL}...")
            try:
                backup = genai.GenerativeModel(model_name=BACKUP_MODEL, system_instruction=SYSTEM_PROMPT)
                res_backup = backup.generate_content(full_prompt)
                return jsonify({'reply': res_backup.text})
            except Exception as backup_err:
                raise backup_err

    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower():
            return jsonify({'reply': '⚠️ Mialana tsiny tompoko, sahirana kely ny API. Miandrasa kely 5 segondra vao mamerina!'})
        return jsonify({'reply': f'Misy olana kely: {err_str}'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
EOF

git add app.py script.js
git commit -m "Restore original working script.js and apply safe System Prompt design"
git push origin main
cd ~/web-chat/web-chat
cat << 'EOF' > app.py
import os
import io
import google.generativeai as genai
from flask import Flask, send_from_directory, request, jsonify
from pypdf import PdfReader
import docx

app = Flask(__name__, static_folder='.')

# SYSTEM PROMPT: Loko roa tena TSY MITOVY sy MIAVAKA TSARA
SYSTEM_PROMPT = """
Ianao dia AI ARISON, mpanampy ara-tsaina manam-pahaizana.

FITSIPIKA MANDRAKIZAY AMIN'NY LOKO SY FANDAMINANA:
1. LOHATENY LEHIBE (Sous-titre A, B, C...):
   - AZA MAMPIASA MARIKA '#' MIHITSY!
   - Ampiasao ity LOKO CYAN MAMIRAPIRATRA (#00f0ff) ity:
   <span style="color: #00f0ff; font-weight: bold; font-size: 1.15em; display: block; margin-top: 15px;">A) Lohateny Lehibe</span>

2. ZANA-TSORATRA (Petit 1, 2, 3...):
   - Ampiasao LOKO MAINTSO EMERALD (#00ff87) TENA TSY MITOVY AMIN'NY GRAND A!
   - Mikisaka miankavanana (margin-left: 20px) ary misy Emoji amin'ny farany:
   <div style="margin-left: 20px; color: #00ff87; font-weight: bold; margin-top: 8px;">1 - Zana-tsoratra... 🧠</div>

3. FANAZAVANA SY TEBOKA:
   - Soratra tsotra amin'ny LOKO FOTSY/GRIS MADIO (#e0e6ed):
   <div style="margin-left: 20px; color: #e0e6ed; margin-top: 4px;">. Fanazavana madio amin'ny loko tokana.</div>

4. Valio amin'ny fiteny ampiasain'ny mpampiasa hatrany.
"""

api_key = os.environ.get('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)

PRIMARY_MODEL = 'gemini-3.6-flash'
BACKUP_MODEL = 'gemini-3.5-flash-lite'

def extract_text_from_file(file_bytes, filename):
    ext = filename.split('.')[-1].lower()
    text = ""
    try:
        if ext == 'txt':
            text = file_bytes.decode('utf-8', errors='ignore')
        elif ext == 'pdf':
            pdf = PdfReader(io.BytesIO(file_bytes))
            for page in pdf.pages:
                t = page.extract_text()
                if t: text += t + "\n"
        elif ext == 'docx':
            doc = docx.Document(io.BytesIO(file_bytes))
            text = "\n".join([p.text for p in doc.paragraphs])
    except Exception as e:
        text = f"[Olana amin'ny famakiana ny fichier: {str(e)}]"
    return text

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('.', path)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_msg = request.form.get('message', '')
        file_obj = request.files.get('file')

        full_prompt = user_msg

        if file_obj:
            filename = file_obj.filename
            file_bytes = file_obj.read()
            extracted_text = extract_text_from_file(file_bytes, filename)
            full_prompt += f"\n\n--- AMBATON'NY RAKITRA / FICHIER ({filename}) ---\n{extracted_text}\n--- FARANY ---"

        if not full_prompt.strip():
            return jsonify({'reply': 'Azafady, soraty ny hafatrao na andefaso fichier tompoko!'})

        try:
            model = genai.GenerativeModel(model_name=PRIMARY_MODEL, system_instruction=SYSTEM_PROMPT)
            res = model.generate_content(full_prompt)
            return jsonify({'reply': res.text})
        except Exception as primary_err:
            print(f"[AI ARISON Engine] Primary model {PRIMARY_MODEL} error: {primary_err}. Cascading to backup {BACKUP_MODEL}...")
            try:
                backup = genai.GenerativeModel(model_name=BACKUP_MODEL, system_instruction=SYSTEM_PROMPT)
                res_backup = backup.generate_content(full_prompt)
                return jsonify({'reply': res_backup.text})
            except Exception as backup_err:
                raise backup_err

    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower():
            return jsonify({'reply': '⚠️ Mialana tsiny tompoko, sahirana kely ny API. Miandrasa kely 5 segondra vao mamerina!'})
        return jsonify({'reply': f'Misy olana kely: {err_str}'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
EOF

git add app.py
git commit -m "Set distinct contrasting colors for Grand A (Cyan) and Petit 1 (Green)"
git push origin main
cd ~/web-chat/web-chat
# Fampidirana ny icon tags ao amin'ny index.html (Ireo tsipika <link rel="icon"> no nampiana)
cat << 'EOF' > index.html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI ARISON</title>

    <!-- TSPIKA NAMPIDIRINA HO AN'NY ICON BORIBORY (MITOVY AMIN'NY GEMINI) -->
    <link rel="icon" type="image/png" sizes="192x192" href="icon.png">
    <link rel="apple-touch-icon" sizes="180x180" href="icon.png">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#0d0e12">

    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div id="app-container">
        <!-- RAHARAHA AMIN'NY FRONTEND EFA NIASA TEOTEO (UNTOUCHED) -->
    </div>

    <script src="script.js"></script>
</body>
</html>
EOF

git add .
git commit -m "Add official round icon for home screen app"
git push origin main
cd ~/web-chat/web-chat
# Averina amin'ny laoniny ilay index.html niasa tsara
git checkout HEAD~1 -- index.html
python3 -c "
with open('index.html', 'r') as f:
    content = f.read()

icon_tags = '''
    <link rel=\"icon\" type=\"image/png\" sizes=\"192x192\" href=\"icon.png\">
    <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"icon.png\">
'''

if '</head>' in content and 'icon.png' not in content:
    new_content = content.replace('</head>', icon_tags + '\n</head>')
    with open('index.html', 'w') as f:
        f.write(new_content)
    print('Icon added safely!')
"
git add index.html
git commit -m "Restore full UI and add icon tags safely"
git push origin main
# 1. Hiditra ao amin'ny dossier-n'ny AI ARISON
cd ~/web-chat/web-chat
# 2. Kopio avy ao amin'ny Download ny sary icon.png mankany amin'ny AI ARISON
cp /sdcard/Download/icon.png .
ls /sdcard/Download/*.jpg /sdcard/Download/*.jpeg /sdcard/Download/*.png 2>/dev/null
cp /sdcard/Download/Madiobe.jpg ~/web-chat/web-chat/icon.png
ls -l icon.png
git add icon.png
git commit -m "Add custom round profile icon"
git push origin main
