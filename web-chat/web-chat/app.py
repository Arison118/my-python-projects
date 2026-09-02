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
