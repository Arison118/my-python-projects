import os
import io
import time
import google.generativeai as genai
from flask import Flask, send_from_directory, request, jsonify
from pypdf import PdfReader
import docx

app = Flask(__name__, static_folder='.')

SYSTEM_PROMPT = """
Ianao dia AI ARISON, mpanampy ara-tsaina manam-pahaizana sy feno haja.

FITSIPIKA:
1. Valio amin'ny fiteny ampiasain'ny mpampiasa hatrany ny hafatra (Malagasy, Français, English, etc.).
2. Mampiasà Markdown kanto:
   - Ampiasao ny '**' ho an'ny teny manan-danja (mivoaka amin'ny loko Rose Neon).
   - Ampiasao ny '###' ho an'ny lohateny (mivoaka amin'ny loko Cyan Neon).
   - Mampiasà emojis mifanaraka tsara.
"""

api_key = os.environ.get('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name='gemini-3.6-flash',
        system_instruction=SYSTEM_PROMPT
    )
else:
    model = None

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

        if model:
            # Auto-Retry Logic (3 attempts) raha sendra tratran'ny Quota 429
            response_text = None
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    res = model.generate_content(full_prompt)
                    response_text = res.text
                    break
                except Exception as api_err:
                    if "429" in str(api_err) or "quota" in str(api_err).lower():
                        if attempt < max_retries - 1:
                            time.sleep(3) # Miandry 3s kely vao mamerina
                            continue
                    raise api_err

            if response_text:
                return jsonify({'reply': response_text})
            else:
                return jsonify({'reply': '⚠️ Tsy nahazo valiny avy amin\'ny AI, andramo indray azafady.'})
        else:
            return jsonify({'reply': f'Salama tompoko! Azoko ny hafatrao sy ny fichier. AI ARISON dia vonona hatrany! ✨'})

    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower():
            return jsonify({'reply': '⚠️ **Mialana tsiny tompoko**, miandrasa kely segondra vitsy vao mamerina satria be loatra ny komandy miaraka miasa amin\'ny Google API!'})
        return jsonify({'reply': f'Misy olana kely amin\'ny valin-teny: {err_str}'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
