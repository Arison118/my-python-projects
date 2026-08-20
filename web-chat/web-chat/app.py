import os
import google.generativeai as genai
from flask import Flask, send_from_directory, request, jsonify

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

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('.', path)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        user_msg = data.get('message', '')

        if not user_msg:
            return jsonify({'reply': 'Azafady, soraty ny hafatrao tompoko!'})

        if model:
            res = model.generate_content(user_msg)
            return jsonify({'reply': res.text})
        else:
            return jsonify({'reply': f'Salama tompoko! Azoko ny hafatrao: "{user_msg}". AI ARISON dia vonona hatrany! ✨'})
    except Exception as e:
        return jsonify({'reply': f'Misy olana kely amin\'ny valin-teny: {str(e)}'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
