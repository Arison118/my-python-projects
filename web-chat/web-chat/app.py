import os
from flask import Flask, render_template, request, jsonify

app = Flask(__name__, template_folder='.', static_folder='.')

@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
