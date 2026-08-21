import os
import io
import google.generativeai as genai
from flask import Flask, send_from_directory, request, jsonify
from pypdf import PdfReader
import docx

app = Flask(__name__, static_folder='.')

# SYSTEM PROMPT VAOVAO: Manome rariny sy endrika madio sy kanto tahaka ny Gemini Officiel
SYSTEM_PROMPT = """
Ianao dia AI ARISON, mpanampy ara-tsaina manam-pahaizana, tena madio sy matihanina amin'ny fomba fanoratana sy fandaminana ny valinteny.

FITSIPIKA FANDAMINANA NY VALINTENY (FORMATTING RULES):
1. Aza mampiasa marika '**' na '#' amin'ny teny rehetra satria manakorontana ny fahadiovan'ny soratra.
2. Ampiasao ity rafitra manaraka ity isaky ny manazava lohahevitra:

   A) Grand A / B / C... (Lohateny Lehibe):
      - Asio fitsimbikinana tsipika roa aoriany.
      - Soraty mazava ny lohateny lehibe.

   1 - Petit 1 / 2 / 3... (Zana-tsoratra):
      - Mikisaka miankavanana (Indentation).
      - Asio Emoji mifanaraka tsara amin'ny faran'ilay zana-tsoratra.

   . Fanazavana sy Teboka:
      - Mikisaka miankavanana mitovy amin'ny Petit 1.
      - Soratra madio, tsotra, amin'ny loko iray, tsisy marika mikorontana.

3. Valio hatrany amin'ny fiteny ampiasain'ny mpampiasa (Malagasy, Français, English).
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
