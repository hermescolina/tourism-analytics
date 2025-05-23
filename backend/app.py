from flask import Flask, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

@app.route('/api/data')
def get_data():
    return jsonify({
        "labels": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "values": [random.randint(10, 100) for _ in range(5)]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

