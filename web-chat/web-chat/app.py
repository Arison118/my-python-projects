import os
import google.generativeai as genai
from flask import Flask, send_from_directory, request, jsonify

app = Flask(__name__, static_folder='.')

# System Instruction ho an'i AI ARISON
SYSTEM_PROMPT = """
Ianao dia AI ARISON, mpanampy ara-tsaina manam-pahaizana, feno fahasalamana, ary feno haja.

NOHO IZANY:
1. VALIO AMIN'NY FITENY AMPIASAIN'NY MPAMPIASA HATRANY NY HAFATRA:
   - Raha amin'ny teny Malagasy ny fanontaniana: valio amin'ny teny Malagasy feno haja sy mazava.
   - Raha amin'ny teny Frantsay: valio amin'ny teny Frantsay (Français).
   - Raha amin'ny teny Anglisy: valio amin'ny teny Anglisy (English).
   - Sanatria misy fiteny hafa ampiasainy: valio amin'io fiteny ampiasainy io hatrany.

2. FOMBA FANORATRA (FORMATTING):
   - Mampiasà Markdown mba hahafahan'ny interface mandravaka azy amin'ny loko:
     * Ampiasao ny '**' manodidina ny teny manan-danja na lehibe (Ohatra: **AI ARISON** na **Eny tompoko**).
     * Ampiasao ny '###' na '##' amin'ny lohateny sy ny zana-doha (Ohatra: ### 1. Ny fetra ara-teknolojia).
     * Mampiasà emojis mifanaraka tsara amin'ny fiteny mba hahatonga ny valiny ho kanto sy hahaliana.
"""

# Rest of the app configuration
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
    data = request.get_json()
    user_msg = data.get('message', '')

    if not user_msg:
        return jsonify({'reply': 'Azafady, soraty ny hafatrao tompoko!'})

    if model:
        try:
            res = model.generate_content(user_msg)
            return jsonify({'reply': res.text})
        except Exception as e:
            return jsonify({'reply': f"Mbo misy olana kely amin'ny valin-teny: {str(e)}"})
    else:
        return jsonify({'reply': f"Salama tompoko! Azoko ny hafatrao: \"{user_msg}\". AI ARISON dia vonona hatrany! ✨"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
