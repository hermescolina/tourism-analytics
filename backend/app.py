from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import mysql.connector
from dotenv import load_dotenv
import os

# ✅ Load environment variables from .env.tours
load_dotenv(dotenv_path=".env.tours")
load_dotenv(dotenv_path=".env.hotels", override=False)

# ✅ DB config from environment
db_name = os.getenv("DB_NAME")
print(f"💢️  Loaded database name from .env: {db_name}")

# Define database config
# ✅ Tours DB Config
tours_db_config = {
    "host": os.getenv("DB_HOST"),        # from .env.tours
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME"),
    "port": 3306
}

# ✅ Hotels DB Config
hotels_db_config = {
    "host": os.getenv("HOTEL_DB_HOST"),      # use separate variables in .env.hotels
    "user": os.getenv("HOTEL_DB_USER"),
    "password": os.getenv("HOTEL_DB_PASS"),
    "database": os.getenv("HOTEL_DB_NAME"),
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

        db = mysql.connector.connect(**tours_db_config)
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
    print("👋 Landing data route called!", flush=True)

    # Connect to tours DB
    db_tours = mysql.connector.connect(**tours_db_config)
    with db_tours.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT title, location, price, image, description, slug FROM tours;")
        tours = cursor.fetchall()

    db_tours.close()

    # Process tours
    processed_tours = []
    for tour in tours:
        image_path = tour['image'].lstrip("/") if tour['image'] else ""
        tour['image'] = f"/uploads/{image_path}" if not "images/" in image_path else f"/{image_path}"
        processed_tours.append(tour)

    # Connect to hotels DB
    db_hotels = mysql.connector.connect(**hotels_db_config)
    with db_hotels.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT name, slug, description, background_image AS image FROM hotels LIMIT 6")
        hotels = cursor.fetchall()

    db_hotels.close()

    # ✅ Process hotels correctly (use /images/ for frontend-based images)
    for hotel in hotels:
        img = hotel.get('image', '')
        path = img.lstrip("/") if img else ""
        hotel['image'] = f"/images/{path}"

    return jsonify({
        "topTours": processed_tours,
        "hotels": hotels
    })


# # ✅ Get tour by slug (with history images)
@app.route('/api/tours/<slug>')
def get_tour_by_slug(slug):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            # 🔍 Get main tour info
            print("📡 Querying tour by slug:", "SELECT * FROM tours WHERE slug = %s LIMIT 1", (slug,))
            cursor.execute("SELECT * FROM tours WHERE slug = %s LIMIT 1", (slug,))
            tour = cursor.fetchone()

            if not tour:
                return jsonify({"error": "Tour not found"}), 404

            # 🖼️ Fix main image path
            if tour.get('image'):
                image_path = tour['image'].lstrip("/")
                tour['image'] = f"/uploads/{image_path}"

            # 🖼️ Get related history images
            cursor.execute("""
                SELECT image_path, caption, category, created_at
                FROM tour_history_images
                WHERE tour_id = %s
                ORDER BY created_at DESC
            """, (tour['id'],))
            history_images = cursor.fetchall()

            # Fix image paths
            for img in history_images:
                path = img['image_path'].lstrip("/")
                img['image_path'] = f"/uploads/{path}" if not path.startswith("http") else path

            tour['history_images'] = history_images

            # 🎬 Get related tour videos
            cursor.execute("""
                SELECT video_id, caption
                FROM tour_videos
                WHERE tour_id = %s
                ORDER BY created_at DESC
            """, (tour['id'],))
            videos = cursor.fetchall()

            tour['videos'] = videos

        db.close()
        return jsonify(tour)

    except Exception as e:
        print("❌ Error in get_tour_by_slug:", e)
        return jsonify({"error": str(e)}), 500


# ✅ Update a tour by slug
@app.route('/api/tours/<slug>', methods=['PUT'])
def update_tour(slug):
    try:
        title = request.form['title']
        location = request.form['location']
        price = request.form['price']
        description = request.form['description']
        start_date = request.form['start_date']
        end_date = request.form['end_date']
        available_slots = request.form['available_slots']

        image = request.files.get('image')
        image_filename = None

        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            if image:
                image_filename = f"{slug}_{secure_filename(image.filename)}"
                image.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))

                cursor.execute("""
                    UPDATE tours SET title=%s, location=%s, price=%s, description=%s,
                        start_date=%s, end_date=%s, available_slots=%s, image=%s
                    WHERE slug=%s
                """, (title, location, price, description, start_date, end_date, available_slots, image_filename, slug))
            else:
                cursor.execute("""
                    UPDATE tours SET title=%s, location=%s, price=%s, description=%s,
                        start_date=%s, end_date=%s, available_slots=%s
                    WHERE slug=%s
                """, (title, location, price, description, start_date, end_date, available_slots, slug))

            db.commit()

        db.close()
        return jsonify({"message": "Tour updated successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tours/<slug>/history-image', methods=['POST'])
def upload_history_image(slug):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            cursor.execute("SELECT id FROM tours WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Tour not found"}), 404
            tour_id = result[0]

            image = request.files.get('image')
            caption = request.form.get('caption', '')
            category = request.form.get('category')  # ✅ Move this here

            if not image:
                return jsonify({"error": "No image provided"}), 400
            if not category:
                return jsonify({"error": "Category is required"}), 400

            filename = f"{slug}_history_{secure_filename(image.filename)}"
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(image_path)

            cursor.execute("""
                INSERT INTO tour_history_images (tour_id, image_path, caption, category)
                VALUES (%s, %s, %s, %s)
            """, (tour_id, filename, caption, category))

            db.commit()

        db.close()
        return jsonify({"message": "History image uploaded successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Patch Delete history images for a tour
@app.route('/api/history-image/<int:image_id>', methods=['PATCH'])
def update_history_image(image_id):
    caption = request.form.get('caption')
    file = request.files.get('image')

    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor()

    if caption:
        cursor.execute("UPDATE tour_history_images SET caption=%s WHERE id=%s", (caption, image_id))

    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        cursor.execute("UPDATE tour_history_images SET image_path=%s WHERE id=%s", (filename, image_id))  # ✅ Fix column name here too

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Image updated successfully'})


@app.route('/api/history-image/<int:image_id>', methods=['DELETE'])
def delete_history_image(image_id):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tour_history_images WHERE id=%s", (image_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Image deleted successfully'})


@app.route('/api/history-images/<slug>', methods=['GET'])
def get_history_images(slug):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT hi.id, hi.image_path AS filename, hi.caption, hi.category
        FROM tour_history_images hi
        JOIN tours t ON hi.tour_id = t.id
        WHERE t.slug = %s
    """, (slug,))
    
    images = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(images)


# # @app.route('/api/tours/<slug>/embed-video', methods=['POST'])
# @app.route('/api/tours/<slug>/save-video', methods=['POST', 'OPTIONS'])

# def save_video_embed(slug):
#     try:
#         video_id = request.form.get('video_id')  # ex: i1a5eIxsHgY
#         caption = request.form.get('caption', '')

#         if not video_id:
#             return jsonify({"error": "Video ID is required"}), 400

#         db = mysql.connector.connect(**tours_db_config)
#         with db.cursor() as cursor:
#             cursor.execute("SELECT id FROM tours WHERE slug = %s", (slug,))
#             result = cursor.fetchone()
#             if not result:
#                 return jsonify({"error": "Tour not found"}), 404
#             tour_id = result[0]

#             cursor.execute("""
#                 INSERT INTO tour_videos (tour_id, video_id, caption)
#                 VALUES (%s, %s, %s)
#             """, (tour_id, video_id, caption))

#             db.commit()
#         db.close()

#         return jsonify({"message": "Video embed saved successfully."}), 201

#     except Exception as e:
#         print("❌ Error in save_video_embed:", e)
#         return jsonify({"error": str(e)}), 500


@app.route('/api/tours/<slug>/save-video', methods=['POST', 'OPTIONS'])
def save_video_embed(slug):
    try:
        print(f"📥 Received request to save video for slug: '{slug}'")

        video_id = request.form.get('video_id')  # ex: i1a5eIxsHgY
        caption = request.form.get('caption', '')

        print(f"🎬 Received video_id: '{video_id}'")
        print(f"📝 Received caption: '{caption}'")

        if not video_id:
            print("⚠️ Missing video_id in form data.")
            return jsonify({"error": "Video ID is required"}), 400

        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            print(f"🔍 Looking up tour ID for slug: '{slug}'")
            cursor.execute("SELECT id FROM tours WHERE slug = %s", (slug,))
            result = cursor.fetchone()

            if not result:
                print(f"❌ No tour found with slug: '{slug}'")
                return jsonify({"error": "Tour not found"}), 404

            tour_id = result[0]
            print(f"✅ Found tour ID: {tour_id}")

            print("💾 Inserting video into tour_videos table...")
            cursor.execute("""
                INSERT INTO tour_videos (tour_id, video_id, caption)
                VALUES (%s, %s, %s)
            """, (tour_id, video_id, caption))
            db.commit()
            print("✅ Video inserted successfully.")

        db.close()
        return jsonify({"message": "Video embed saved successfully."}), 201

    except Exception as e:
        print("❌ Error in save_video_embed:", e)
        return jsonify({"error": str(e)}), 500



@app.route('/api/tours/<slug>/videos')
def get_tour_videos(slug):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            cursor.execute("SELECT id FROM tours WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Tour not found"}), 404
            tour_id = result['id']

            cursor.execute("""
                SELECT id, video_id, caption, created_at
                FROM tour_videos
                WHERE tour_id = %s
                ORDER BY created_at DESC
            """, (tour_id,))
            videos = cursor.fetchall()

        db.close()
        return jsonify(videos)

    except Exception as e:
        print("❌ Error in get_tour_videos:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/tours/<slug>/video/<int:video_id>', methods=['DELETE'])
def delete_tour_video(slug, video_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            # Verify tour exists
            cursor.execute("SELECT id FROM tours WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Tour not found"}), 404
            tour_id = result[0]

            # Delete the video
            cursor.execute("DELETE FROM tour_videos WHERE id = %s AND tour_id = %s", (video_id, tour_id))
            db.commit()

        db.close()
        return jsonify({"message": "Video deleted"}), 200

    except Exception as e:
        print("❌ Error deleting video:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/history-images/<slug>/<int:image_id>', methods=['DELETE'])
def delete_history_image_by_slug(slug, image_id):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor()

    # Optional: validate tour slug
    cursor.execute("SELECT id FROM tours WHERE slug = %s", (slug,))
    tour = cursor.fetchone()
    if not tour:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Tour not found'}), 404

    cursor.execute("DELETE FROM tour_history_images WHERE id = %s", (image_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': 'Image deleted successfully'})

@app.route('/api/tours/<slug>/video/<int:video_id>', methods=['PATCH'])
def update_tour_video(slug, video_id):
    try:
        caption = request.form.get('caption')
        if not caption:
            return jsonify({"error": "Caption is required"}), 400

        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            cursor.execute("""
                UPDATE tour_videos SET caption = %s WHERE id = %s
            """, (caption, video_id))
            db.commit()

        db.close()
        return jsonify({"message": "Video updated successfully"})
    except Exception as e:
        print("❌ Error in update_tour_video:", e)
        return jsonify({"error": str(e)}), 500


# ✅ Run locally or with Gunicorn/Render
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3001))
    print("\n📅 Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule} → {', '.join(rule.methods)}")

    app.run(host='0.0.0.0', port=port)
