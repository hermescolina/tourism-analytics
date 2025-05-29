from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# Set up database connection once
db = mysql.connector.connect(
    host="localhost",
    user="root",         # 🔁 Replace with your user
    password="Asdf1234!", # 🔁 Replace with your password
    database="tourism_app"
)

@app.route('/api/landing-data')
def get_landing_data():
    # ✅ Fresh dictionary cursor for every request
    with db.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT title, location, price, image, description FROM tours LIMIT 6")
        tours = cursor.fetchall()
        return jsonify({"topTours": tours})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)
