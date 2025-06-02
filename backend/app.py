from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import mysql.connector
from dotenv import load_dotenv
import os

# ✅ Load environment variables from .env.tours
load_dotenv(dotenv_path=".env.tours")

# ✅ DB config from environment
db_name = os.getenv("DB_NAME")
print(f"🛢️  Loaded database name from .env: {db_name}")

# Define database config
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": db_name,
    "port": 3306
}

app = Flask(__name__)
CORS(app)

# ✅ Upload folder setup
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ✅ Add a new tour
@app.route('/api/tours', methods=['POST'])
def add_tour():
    try:
        title = request.form['title']
        slug = request.form['slug']
        location = request.form['location']
        price = request.form['price']
        description = request.form['description']
        start_date = request.form['start_date']
        end_date = request.form['end_date']
        available_slots = request.form['available_slots']

        image = request.files.get('image')
        image_filename = None
        if image:
            image_filename = f"{slug}_{secure_filename(image.filename)}"
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))

        db = mysql.connector.connect(**db_config)
        with db.cursor() as cursor:
            cursor.execute("SELECT id FROM tours WHERE slug = %s", (slug,))
            if cursor.fetchone():
                db.close()
                return jsonify({"error": "Slug already exists"}), 400

            cursor.execute("""
                INSERT INTO tours (title, slug, location, price, description, start_date, end_date, available_slots, image)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (title, slug, location, price, description, start_date, end_date, available_slots, image_filename))
            db.commit()
        db.close()

        return jsonify({"message": "Tour added successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Serve uploaded images
@app.route('/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ✅ Landing data
@app.route('/api/landing-data')
def get_landing_data():
    print("👋 Hello, landing data route called!", flush=True)

    db = mysql.connector.connect(**db_config)
    with db.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT title, location, price, image, description, slug FROM tours;")
        tours = cursor.fetchall()

        filtered_tours = []
        for tour in tours:
            if tour['image'] and "images/" in tour['image']:
                print(f"ℹ️ Image path contains 'images/': {tour['image']}", flush=True)

                image_path = tour['image'].lstrip("/")
                print(f"🖼️ Image for '{tour['title']}': {image_path}", flush=True)
                tour['image'] = f"/{image_path}"

                filtered_tours.append(tour)
            else:
                image_path = tour['image'].lstrip("/")
                print(f"🖼️ Image for '{tour['title']}': {image_path}", flush=True)
                tour['image'] = f"uploads/{image_path}"

                filtered_tours.append(tour)

    db.close()
    return jsonify({"topTours": filtered_tours})


# ✅ Get tour by slug
@app.route('/api/tours/<slug>')
def get_tour_by_slug(slug):
    db = mysql.connector.connect(**db_config)
    with db.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT * FROM tours WHERE slug = %s LIMIT 1", (slug,))
        tour = cursor.fetchone()
        if tour and tour.get('image'):
            image_path = tour['image'].lstrip("/")
            tour['image'] = f"/uploads/{image_path}"
    db.close()
    if not tour:
        return jsonify({"error": "Tour not found"}), 404
    return jsonify(tour)

# ✅ Run locally or with Gunicorn/Render
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3001))
    print("\n✅ Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule} → {', '.join(rule.methods)}")

    app.run(host='0.0.0.0', port=port)

