import requests

API_KEY = "AQ.Ab8RN6JTdS1AJdZyRQTPiXbMkyGRpnid_rwBgZ4vcAodtKmM4w"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={API_KEY}"

print("=== CHATBOT GEMINI AI (TAFA TSY MITSAHATRA) ===")
print("(Soraty ny 'quitter' na 'mivoaka' raha te hanoana ilay tafa)\n")

while True:
    fanontaniana = input("\n👤 IANAO: ")
    
    # Raha manoratra 'quitter' na 'mivoaka' izy dia mijanona ny programa
    if fanontaniana.lower() in ['quitter', 'mivoaka', 'exit']:
        print("👋 Misaotra tompoko! Mandra-pihaona amin'ny tafa manaraka!")
        break
        
    print("⏳ Miandry ny valiny...")

    payload = {
        "contents": [{"parts": [{"text": fanontaniana}]}]
    }

    try:
        response = requests.post(url, json=payload)
        data = response.json()
        
        if response.status_code == 200:
            valiny = data['candidates'][0]['content']['parts'][0]['text']
            print("\n🤖 ROBOT GEMINI:")
            print(valiny)
        else:
            print(f"\n❌ ERREUR ({response.status_code}):", data)

    except Exception as e:
        print("\n❌ ERREUR:", e)

