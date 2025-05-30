from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector
import os

app = Flask(__name__)
CORS(app)

# ✅ Route for landing data (with slug now included)
@app.route('/api/landing-data')
def get_landing_data():
    db = mysql.connector.connect(
        host="mysql1002.site4now.net",
        user="ab9bb5_tourism",
        password="Asdf1234!",
        database="db_ab9bb5_tourism",
        port=3306
    )
    with db.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT title, location, price, image, description, slug FROM tours LIMIT 6")
        tours = cursor.fetchall()
    db.close()
    return jsonify({"topTours": tours})

# ✅ Route for individual tour by slug
@app.route('/api/tours/<slug>')
def get_tour_by_slug(slug):
    db = mysql.connector.connect(
        host="mysql1002.site4now.net",
        user="ab9bb5_tourism",
        password="Asdf1234!",
        database="db_ab9bb5_tourism",
        port=3306
    )
    with db.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM tours WHERE slug = %s LIMIT 1", (slug,))
        tour = cursor.fetchone()
    db.close()
    if not tour:
        return jsonify({"error": "Tour not found"}), 404
    return jsonify(tour)

# ✅ Gunicorn/Render-compatible
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3001))
    app.run(host='0.0.0.0', port=port)
