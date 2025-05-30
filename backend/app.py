from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# Set up database connection once
db = mysql.connector.connect(
    host="localhost",
    user="root",          # 🔁 Replace as needed
    password="Asdf1234!", # 🔁 Replace as needed
    database="tourism_app"
)

# ✅ Route for landing data (with slug now included)
@app.route('/api/landing-data')
def get_landing_data():
    with db.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT title, location, price, image, description, slug FROM tours LIMIT 6")
        tours = cursor.fetchall()
        return jsonify({"topTours": tours})

# ✅ Route for individual tour by slug
@app.route('/api/tours/<slug>')
def get_tour_by_slug(slug):
    with db.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM tours WHERE slug = %s LIMIT 1", (slug,))
        tour = cursor.fetchone()
        if not tour:
            return jsonify({"error": "Tour not found"}), 404
        return jsonify(tour)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)
