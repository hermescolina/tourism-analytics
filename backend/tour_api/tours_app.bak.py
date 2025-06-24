from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import mysql.connector
from dotenv import load_dotenv
from fb_auto_post import fb_bp
from fb_auto_post import post_tour_to_facebook_internal

import os

# ✅ Load environment variables from .env.tours
load_dotenv(dotenv_path=".env.tours")

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

# ✅ One-time reusable connection function
def get_db_connection():
    return mysql.connector.connect(**tours_db_config)


print("🔥 Connecting to HOTEL DB at:", hotels_db_config["host"])
print("🧪 HOTEL DB CONFIG:", hotels_db_config)



app = Flask(__name__)
# 🔧 Enable CORS on all routes starting with /api
CORS(app, resources={r"/api/*": {"origins": "https://app.tourwise.shop"}})



# ✅ Upload folder setup
UPLOAD_FOLDER = 'uploads'
# UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')

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
        category_id = request.form.get('category_id')

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
                INSERT INTO tours (title, slug, location, price, description, start_date, end_date, available_slots, image, category_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (title, slug, location, price, description, start_date, end_date, available_slots, image_filename, category_id))
            db.commit()
        db.close()

        # ✅ Auto-post to Facebook
        try:
            image_url = f"https://app.tourwise.shop/tourism-analytics/uploads/{image_filename}" if image_filename else ""
            fb_payload = {
                "title": title,
                "description": description,
                "location": location,
                "price": price,
                "slug": slug,
                "image_url": image_url
            }
            post_tour_to_facebook_internal(fb_payload)
            print("📢 Facebook post created successfully.")
        except Exception as fb_err:
            print("⚠️ Facebook post failed:", fb_err)

        return jsonify({"message": "Tour added successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500





# ✅ Serve uploaded images with request logging
@app.route('/uploads/<filename>')
def serve_image(filename):
    print(f"📥 Image requested: {filename}")
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ✅ Landing data
@app.route('/api/landing-data')
def get_landing_data():
    print("👋 Landing data route called!", flush=True)

    # Connect to tours DB
    db_tours = mysql.connector.connect(**tours_db_config)
    with db_tours.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT title, location, price, image, description, slug, start_date, end_date,available_slots  FROM tours;")
        tours = cursor.fetchall()

    db_tours.close()

    # Process tours
    processed_tours = []
    for tour in tours:
        raw_image = tour.get('image', '').lstrip("/")
        
        # If it starts with 'uploads/' → keep as is
        if raw_image.startswith("uploads/"):
            tour['image'] = f"/{raw_image}"
        # If it starts with 'images/' → keep as is
        elif raw_image.startswith("images/"):
            tour['image'] = f"/{raw_image}"
        # Else assume upload path and prepend it
        elif raw_image:
            tour['image'] = f"/uploads/{raw_image}"
        else:
            tour['image'] = ""

        tour['start_date'] = str(tour['start_date']) if tour.get('start_date') else None
        tour['end_date'] = str(tour['end_date']) if tour.get('end_date') else None
        
        processed_tours.append(tour)


    # Connect to hotels DB
    db_hotels = mysql.connector.connect(**hotels_db_config)
    with db_hotels.cursor(dictionary=True) as cursor:
        cursor.execute("SELECT name, slug, description, background_image AS image FROM hotels LIMIT 6;")
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
                SELECT video_id, caption, category
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
        category_id = request.form['category_id']  # ✅ new field

        image = request.files.get('image')
        image_filename = None

        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            if image:
                image_filename = f"{slug}_{secure_filename(image.filename)}"
                image.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))

                cursor.execute("""
                    UPDATE tours SET title=%s, location=%s, price=%s, description=%s,
                        start_date=%s, end_date=%s, available_slots=%s, category_id=%s, image=%s
                    WHERE slug=%s
                """, (title, location, price, description, start_date, end_date, available_slots, category_id, image_filename, slug))
            else:
                cursor.execute("""
                    UPDATE tours SET title=%s, location=%s, price=%s, description=%s,
                        start_date=%s, end_date=%s, available_slots=%s, category_id=%s
                    WHERE slug=%s
                """, (title, location, price, description, start_date, end_date, available_slots, category_id, slug))

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


@app.route('/api/tours/<slug>/save-video', methods=['POST', 'OPTIONS'])
def save_video_embed(slug):
    try:
        print(f"📥 Received request to save video for slug: '{slug}'")

        video_id = request.form.get('video_id')  # ex: i1a5eIxsHgY
        caption = request.form.get('caption', '')
        category = request.form.get('category', '')

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
                INSERT INTO tour_videos (tour_id, video_id, caption, category)
                VALUES (%s, %s, %s, %s)
            """, (tour_id, video_id, caption, category))
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
        category = request.form.get('category')
        if not caption:
            return jsonify({"error": "Caption is required"}), 400
        
        if not category:
            return jsonify({"error": "category is required"}), 400

        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            cursor.execute("""
                UPDATE tour_videos
                SET caption = %s, category = %s
                WHERE id = %s
            """, (caption, category, video_id))

            db.commit()

        db.close()
        return jsonify({"message": "Video updated successfully"})
    except Exception as e:
        print("❌ Error in update_tour_video:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/tours/list', methods=['GET'])
def list_all_tours():
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            cursor.execute("SELECT id, slug, title FROM tours ORDER BY title ASC")
            tours = cursor.fetchall()
        db.close()
        return jsonify(tours)
    except Exception as e:
        print("❌ Error in list_all_tours:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/tours/<slug>/history-images', methods=['GET'])
def get_tour_history_images(slug):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            query = """
                SELECT h.id, h.image_path AS url, h.caption, h.category
                FROM tour_history_images h
                JOIN tours t ON h.tour_id = t.id
                WHERE t.slug = %s
            """
            cursor.execute(query, (slug,))
            images = cursor.fetchall()
        db.close()
        return jsonify(images)
    except Exception as e:
        print("🔥 Error in get_tour_history_images:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/bookings/user/<int:user_id>', methods=['GET'])
def get_user_bookings(user_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT 
                b.id,
                b.status,
                b.booking_date,
                b.num_guests,
                b.hotel_booked,
                b.car_rented,
                t.title AS tour_title
            FROM bookings b
            JOIN tours t ON b.tour_id = t.id
            WHERE b.user_id = %s
            ORDER BY b.booking_date DESC
        """
        cursor.execute(query, (user_id,))
        bookings = cursor.fetchall()
        db.close()

        return jsonify(bookings)

    except Exception as e:
        print("❌ Error in get_user_bookings:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user_by_id(user_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT 
                id, full_name, email, phone, location, created_at 
            FROM users
            WHERE id = %s
        """
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()

        db.close()

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify(user)

    except Exception as e:
        print("❌ Error in get_user_by_id:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/api/users/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    # password = data.get('password') ← ignore for now

    db = mysql.connector.connect(**tours_db_config)
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT id, full_name, email FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    db.close()

    if user:
        return jsonify(user)
    else:
        return jsonify({'error': 'Invalid email'}), 401

@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            cursor.execute("SELECT id, name FROM categories ORDER BY name ASC")
            categories = cursor.fetchall()
        db.close()
        return jsonify(categories)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/book-tour', methods=['POST'])
def create_booking():
    data = request.get_json()

    name = data['name']
    email = data['email']
    phone = data['phone']
    whatsapp = data.get('whatsapp', '')
    tour_id = data['tour_id']
    hotel_id = data.get('hotel_id')
    car_id = data.get('car_id')
    date = data['date']
    num_guests = data.get('num_guests', 1)

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    # Check if customer exists by email
    cursor.execute("SELECT id FROM customers WHERE email = %s", (email,))
    existing = cursor.fetchone()
    print("🔍 Existing customer check result:", existing)

    if existing:
        customer_id = existing['id']
        print(f"✅ Customer exists with ID: {customer_id}")
    else:
        cursor.execute(
            "INSERT INTO customers (name, email, phone, whatsapp) VALUES (%s, %s, %s, %s)",
            (name, email, phone, whatsapp)
        )
        customer_id = cursor.lastrowid

    # ✅ Insert booking (FIXED line: comment added instead of invalid syntax)
    cursor.execute(
        """
        INSERT INTO bookings (user_id, tour_id, booking_date, num_guests, status, hotel_id, car_id)
        VALUES (%s, %s, %s, %s, 'pending', %s, %s)
        """,
        (customer_id, tour_id, date, num_guests, hotel_id, car_id)
    )

    db.commit()
    return jsonify({"message": "Booking created with customer info"}), 201



@app.route('/api/tour-titles', methods=['GET'])
def get_tour_titles():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT id, title, price, slug FROM tours")
    results = cursor.fetchall()
    return jsonify(results)


app.register_blueprint(fb_bp, url_prefix='/api/fb') 

# ✅ Run locally or with Gunicorn/Render
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 3001))
    print("\n📅 Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule} → {', '.join(rule.methods)}")

    app.run(host='0.0.0.0', port=port)
    

