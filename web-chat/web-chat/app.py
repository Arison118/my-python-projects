import os
import io
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

# Map model keys to stable Gemini API model identifiers
MODEL_MAPPING = {
    'lite': 'gemini-2.0-flash-lite',
    'flash': 'gemini-2.5-flash',
    'pro': 'gemini-1.5-pro'
}

# Fallback sequence order if a model hits rate-limits or errors
FALLBACK_CASCADE = ['gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash']

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

def generate_with_fallback(prompt, primary_model_name):
    """
    Robust Professional Cascading Fallback Engine.
    Tries the requested model first. If 429/quota/error occurs, 
    it dynamically cascades through backup models seamlessly.
    """
    # Build list: primary requested model first, then the remaining fallbacks
    models_to_try = [primary_model_name] + [m for m in FALLBACK_CASCADE if m != primary_model_name]
    
    last_exception = None
    for model_name in models_to_try:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=SYSTEM_PROMPT
            )
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text, model_name
        except Exception as e:
            last_exception = e
            print(f"[AI ARISON Engine] Model {model_name} failed. Reason: {e}. Cascading to next backup...")
            continue

    # If all models fail unexpectedly, raise the last caught exception
    raise last_exception if last_exception else Exception("All fallback models failed to respond.")

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
        selected_model_key = request.form.get('model', 'lite')
        file_obj = request.files.get('file')

        full_prompt = user_msg

        if file_obj:
            filename = file_obj.filename
            file_bytes = file_obj.read()
            extracted_text = extract_text_from_file(file_bytes, filename)
            full_prompt += f"\n\n--- AMBATON'NY RAKITRA / FICHIER ({filename}) ---\n{extracted_text}\n--- FARANY ---"

        if not full_prompt.strip():
            return jsonify({'reply': 'Azafady, soraty ny hafatrao na andefaso fichier tompoko!'})

        # Resolve model name
        target_model = MODEL_MAPPING.get(selected_model_key, 'gemini-2.0-flash-lite')

        # Execute dynamic cascading generation
        reply_text, used_model = generate_with_fallback(full_prompt, target_model)
        
        return jsonify({
            'reply': reply_text,
            'used_model': used_model
        })

    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "quota" in err_str.lower():
            return jsonify({'reply': '⚠️ **Mialana tsiny tompoko**, sahirana kely ny API amin\'izao segondra izao. Rehefa afaka 5 segondra dia mamerina indray tompoko!'})
        return jsonify({'reply': f'Misy olana kely: {err_str}'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
