import os
import google.generativeai as genai
from flask import Flask, send_from_directory, request, jsonify

app = Flask(__name__, static_folder='.')

SYSTEM_PROMPT = """
Ianao dia AI ARISON. Ny fitsipinao ambony indrindra dia ny hamaly amin'ny fiteny nampiasain'ny mpampiasa:
- Raha amin'ny teny Frantsay ny hafatra, valio amin'ny teny Frantsay (Français).
- Raha amin'ny teny Anglisy ny hafatra, valio amin'ny teny Anglisy (English).
- Raha amin'ny teny Malagasy ny hafatra, valio amin'ny teny Malagasy.
Tazomy foana ny toetra amam-panahy feno fanajana, fahaizana, ary emojis manintona sy kanto.
"""

api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    # Eto no nanovana ilay modely ho amin'ny version vaovao
    model = genai.GenerativeModel("gemini-3.6-flash", system_instruction=SYSTEM_PROMPT)
else:
    model = None

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@app.route('/chat', methods=['POST'])
def chat():
    user_msg = request.json.get('message', '')
    if not user_msg:
        return jsonify({'reply': 'Azafady, soraty ny hafatrao tompoko!'})

    if model:
        try:
            res = model.generate_content(user_msg)
            return jsonify({'reply': res.text})
        except Exception as e:
            return jsonify({'reply': f'Mbo misy olana kely amin\'ny valin-teny: {str(e)}'})
    else:
        return jsonify({'reply': f'Salama tompoko! Azoko ny hafatrao: "{user_msg}". AI ARISON dia vonona hatrany! ✨'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
