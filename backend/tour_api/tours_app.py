import os
import time
import secrets

from flask import Flask, request, jsonify, send_from_directory
import mimetypes

from flask_cors import CORS
from werkzeug.utils import secure_filename
import mysql.connector
from dotenv import load_dotenv

from fb_auto_post import fb_bp, post_tour_to_facebook_internal
from cart_routes import cart_bp
from voucher_routes import voucher_bp
from payment_routes import payment_bp
from booking_routes import confirm_bp
from tour_routes import tours_bp
from voucher_routes import send_confirmation_email


from db_helpers import get_tour_from_db_by_slug, update_tour_in_db_by_id

# Register MIME types
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

# ✅ Load environment variables from .env.tours
load_dotenv(dotenv_path=".env.tours")

# ✅ DB config from environment
db_name = os.getenv("TOUR_DB_NAME")
print(f"💢️  Loaded database name from .env: {db_name}")

# Define database config
# ✅ Tours DB Config
tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),  # from .env.tours
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": 3306,
}

# ✅ Hotels DB Config
hotels_db_config = {
    "host": os.getenv("HOTEL_DB_HOST"),  # use separate variables in .env.hotels
    "user": os.getenv("HOTEL_DB_USER"),
    "password": os.getenv("HOTEL_DB_PASS"),
    "database": os.getenv("HOTEL_DB_NAME"),
    "port": 3306,
}

# ✅ Hotels DB Config
cars_db_config = {
    "host": os.getenv("CAR_DB_HOST"),  # use separate variables in .env.hotels
    "user": os.getenv("CAR_DB_USER"),
    "password": os.getenv("CAR_DB_PASS"),
    "database": os.getenv("CAR_DB_NAME"),
    "port": 3306,
}


# def generate_confirmation_token(email):
def generate_token(length=32):
    return secrets.token_urlsafe(length)


# ✅ One-time reusable connection function


def get_db_connection():
    return mysql.connector.connect(**tours_db_config)


print("🔥 Connecting to HOTEL DB at:", hotels_db_config["host"])
print("🧪 HOTEL DB CONFIG:", hotels_db_config)


app = Flask(__name__)
# 🔧 Enable CORS on all routes starting with /api
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "https://app.tourwise.shop",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": "*",
        }
    },
)


# ✅ Upload folder setup
UPLOAD_FOLDER = "uploads"
# UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ✅ Add a new tour


@app.route("/api/tours", methods=["POST"])
def add_tour():
    try:
        title = request.form["title"]
        slug = request.form["slug"]
        location = request.form["location"]
        price = request.form["price"]
        description = request.form["description"]
        start_date = request.form["start_date"]
        end_date = request.form["end_date"]
        available_slots = request.form["available_slots"]
        category_id = request.form.get("category_id")

        image = request.files.get("image")
        image_filename = None
        if image:
            image_filename = f"{slug}_{secure_filename(image.filename)}"
            image.save(os.path.join(app.config["UPLOAD_FOLDER"], image_filename))

        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor()

        # Check for slug duplication
        cursor.execute("SELECT item_id FROM items WHERE slug = %s", (slug,))
        if cursor.fetchone():
            cursor.close()
            db.close()
            return jsonify({"error": "Slug already exists"}), 400

        # Generate new item_id
        cursor.execute("SELECT MAX(item_id) FROM items")
        max_item_id = cursor.fetchone()[0] or 0
        new_item_id = max_item_id + 2  # or +1 if +2 is not intended

        # Insert into items
        cursor.execute(
            """
            INSERT INTO items (
                item_id, title, slug, location, price, description,
                start_date, end_date, available_slots, image, category_id, item_type
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                new_item_id,
                title,
                slug,
                location,
                price,
                description,
                start_date,
                end_date,
                available_slots,
                image_filename,
                category_id,
                "tour",
            ),
        )
        db.commit()

        # ✅ Try to auto-post to Facebook
        try:
            time.sleep(2)
            post_tour_to_facebook_internal(
                {
                    "title": title,
                    "description": description,
                    "location": location,
                    "price": price,
                    "image_url": (
                        f"https://api.tourwise.shop/uploads/{image_filename}"
                        if image_filename
                        else ""
                    ),
                    "slug": slug,
                }
            )
        except Exception as fb_err:
            print("⚠️ Facebook auto-post failed:", fb_err)

        cursor.close()
        db.close()

        return jsonify({"message": "Tour added successfully"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Serve uploaded images with request logging
@app.route("/uploads/<filename>")
def serve_image(filename):
    print(f"📥 Image requested: {filename}")
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


# ✅ Landing data
@app.route("/api/landing-data")
def get_landing_data():
    print("👋 Landing data route called!", flush=True)

    db_tours = mysql.connector.connect(**tours_db_config)
    with db_tours.cursor(dictionary=True) as cursor:
        cursor.execute(
            """
            (
                SELECT * FROM vw_landing_page WHERE type = 'tour' ORDER BY id ASC LIMIT 3
            )
            UNION ALL
            (
                SELECT * FROM vw_landing_page WHERE type = 'hotel' ORDER BY id ASC LIMIT 3
            );
        """
        )
        tours = cursor.fetchall()

    db_tours.close()

    # Process tours
    processed_tours = []
    for tour in tours:
        if not tour:
            continue  # skip if None

        raw_image = (tour.get("image") or "").lstrip("/")

        if raw_image.startswith("uploads/"):
            tour["image"] = f"/{raw_image}"
        elif raw_image.startswith("images/"):
            tour["image"] = f"/{raw_image}"
        elif raw_image:
            tour["image"] = f"/uploads/{raw_image}"
        else:
            tour["image"] = ""

        processed_tours.append(tour)

    # Connect to hotels DB

    return jsonify({"topItems": processed_tours})


# ✅ Landing data
@app.route("/api/tour-data")
def get_tour_data():
    print("👋 Tour data route called!", flush=True)

    db_tours = mysql.connector.connect(**tours_db_config)
    with db_tours.cursor(dictionary=True) as cursor:
        cursor.execute(
            """
            (
                SELECT * FROM vw_landing_page WHERE type = 'tour' ORDER BY id ASC
            )
            UNION ALL
            (
                SELECT * FROM vw_landing_page WHERE type = 'hotel' ORDER BY id ASC
            );
        """
        )
        tours = cursor.fetchall()

    db_tours.close()

    # Process tours
    processed_tours = []
    for tour in tours:
        if not tour:
            continue  # skip if None

        raw_image = (tour.get("image") or "").lstrip("/")

        if raw_image.startswith("uploads/"):
            tour["image"] = f"/{raw_image}"
        elif raw_image.startswith("images/"):
            tour["image"] = f"/{raw_image}"
        elif raw_image:
            tour["image"] = f"/uploads/{raw_image}"
        else:
            tour["image"] = ""

        processed_tours.append(tour)

    # Connect to hotels DB

    return jsonify({"topTours": processed_tours})


# # ✅ Get tour by slug (with history images)
@app.route("/api/tours/<slug>")
def get_tour_by_slug(slug):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            # 🔍 Get main tour info
            cursor.execute(
                "SELECT * FROM vw_tour_page WHERE slug = %s LIMIT 1", (slug,)
            )
            tour = cursor.fetchone()

            if not tour:
                return jsonify({"error": "Tour not found"}), 404

            # 🖼️ Fix main image path
            if tour.get("image"):
                image_path = tour["image"].lstrip("/")
                tour["image"] = f"/uploads/{image_path}"

            # 🖼️ Get related history images
            cursor.execute(
                """
                SELECT image_path, caption, category, created_at
                FROM tour_history_images
                WHERE tour_id = %s
                ORDER BY created_at DESC
            """,
                (tour["item_id"],),
            )
            history_images = cursor.fetchall()

            # Fix image paths
            for img in history_images:
                path = img["image_path"].lstrip("/")
                img["image_path"] = (
                    f"/uploads/{path}" if not path.startswith("http") else path
                )

            tour["history_images"] = history_images

            # 🎬 Get related tour videos
            cursor.execute(
                """
                SELECT video_id, caption, category
                FROM tour_videos
                WHERE tour_id = %s
                ORDER BY created_at DESC
            """,
                (tour["item_id"],),
            )
            videos = cursor.fetchall()

            tour["videos"] = videos

        db.close()
        return jsonify(tour)

    except Exception as e:
        print("❌ Error in get_tour_by_slug:", e)
        return jsonify({"error": str(e)}), 500


# ✅ Update a tour by slug
@app.route("/api/tours/<slug>", methods=["PUT"])
def update_tour(slug):
    try:
        title = request.form["title"]
        location = request.form["location"]
        price = request.form["price"]
        description = request.form["description"]
        start_date = request.form["start_date"]
        end_date = request.form["end_date"]
        available_slots = request.form["available_slots"]
        category_id = request.form["category_id"]  # ✅ new field

        image = request.files.get("image")
        image_filename = None

        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            if image:
                image_filename = f"{slug}_{secure_filename(image.filename)}"
                image.save(os.path.join(app.config["UPLOAD_FOLDER"], image_filename))

                cursor.execute(
                    """
                    UPDATE items SET title=%s, location=%s, price=%s, description=%s,
                        start_date=%s, end_date=%s, available_slots=%s, category_id=%s, image=%s
                    WHERE slug=%s
                """,
                    (
                        title,
                        location,
                        price,
                        description,
                        start_date,
                        end_date,
                        available_slots,
                        category_id,
                        image_filename,
                        slug,
                    ),
                )
            else:
                cursor.execute(
                    """
                    UPDATE items SET title=%s, location=%s, price=%s, description=%s,
                        start_date=%s, end_date=%s, available_slots=%s, category_id=%s
                    WHERE slug=%s
                """,
                    (
                        title,
                        location,
                        price,
                        description,
                        start_date,
                        end_date,
                        available_slots,
                        category_id,
                        slug,
                    ),
                )

            db.commit()

        db.close()
        return jsonify({"message": "Tour updated successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tours/<slug>/history-image", methods=["POST"])
def upload_history_image(slug):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            cursor.execute("SELECT id FROM tours WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Tour not found"}), 404
            tour_id = result[0]

            image = request.files.get("image")
            caption = request.form.get("caption", "")
            category = request.form.get("category")  # ✅ Move this here

            if not image:
                return jsonify({"error": "No image provided"}), 400
            if not category:
                return jsonify({"error": "Category is required"}), 400

            filename = f"{slug}_history_{secure_filename(image.filename)}"
            image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            image.save(image_path)

            cursor.execute(
                """
                INSERT INTO tour_history_images (tour_id, image_path, caption, category)
                VALUES (%s, %s, %s, %s)
            """,
                (tour_id, filename, caption, category),
            )

            db.commit()

        db.close()
        return jsonify({"message": "History image uploaded successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Patch Delete history images for a tour
@app.route("/api/history-image/<int:image_id>", methods=["PATCH"])
def update_history_image(image_id):
    caption = request.form.get("caption")
    file = request.files.get("image")

    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor()

    if caption:
        cursor.execute(
            "UPDATE tour_history_images SET caption=%s WHERE id=%s", (caption, image_id)
        )

    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)
        cursor.execute(
            "UPDATE tour_history_images SET image_path=%s WHERE id=%s",
            (filename, image_id),
        )  # ✅ Fix column name here too

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Image updated successfully"})


@app.route("/api/history-image/<int:image_id>", methods=["DELETE"])
def delete_history_image(image_id):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tour_history_images WHERE id=%s", (image_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Image deleted successfully"})


@app.route("/api/history-images/<slug>", methods=["GET"])
def get_history_images(slug):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT hi.id, hi.image_path AS filename, hi.caption, hi.category
        FROM tour_history_images hi
        JOIN items i ON hi.tour_id = i.item_id
        WHERE i.slug = %s
    """,
        (slug,),
    )

    images = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(images)


@app.route("/api/tours/<slug>/save-video", methods=["POST", "OPTIONS"])
def save_video_embed(slug):
    try:
        print(f"📥 Received request to save video for slug: '{slug}'")

        video_id = request.form.get("video_id")  # ex: i1a5eIxsHgY
        caption = request.form.get("caption", "")
        category = request.form.get("category", "")

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
            cursor.execute(
                """
                INSERT INTO tour_videos (tour_id, video_id, caption, category)
                VALUES (%s, %s, %s, %s)
            """,
                (tour_id, video_id, caption, category),
            )
            db.commit()
            print("✅ Video inserted successfully.")

        db.close()
        return jsonify({"message": "Video embed saved successfully."}), 201

    except Exception as e:
        print("❌ Error in save_video_embed:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/tours/<slug>/videos")
def get_tour_videos(slug):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            cursor.execute("SELECT item_id FROM vw_tour_page  WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Tour not found"}), 404
            item_id = result["item_id"]

            cursor.execute(
                """
                SELECT id, video_id, caption, created_at
                FROM tour_videos
                WHERE tour_id = %s
                ORDER BY created_at DESC
            """,
                (item_id,),
            )
            videos = cursor.fetchall()

        db.close()
        return jsonify(videos)

    except Exception as e:
        print("❌ Error in get_tour_videos:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/tours/<slug>/video/<int:video_id>", methods=["DELETE"])
def delete_tour_video(slug, video_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            # Verify tour exists
            cursor.execute("SELECT item_id FROM vw_tour_page WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Tour not found"}), 404
            item_id = result[0]

            # Delete the video
            cursor.execute(
                "DELETE FROM tour_videos WHERE id = %s AND tour_id = %s",
                (video_id, item_id),
            )
            db.commit()

        db.close()
        return jsonify({"message": "Video deleted"}), 200

    except Exception as e:
        print("❌ Error deleting video:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/history-images/<slug>/<int:image_id>", methods=["DELETE"])
def delete_history_image_by_slug(slug, image_id):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor()

    # Optional: validate tour slug
    cursor.execute("SELECT item_id FROM vw_tour_page WHERE slug = %s", (slug,))
    tour = cursor.fetchone()
    if not tour:
        cursor.close()
        conn.close()
        return jsonify({"error": "Tour not found"}), 404

    cursor.execute("DELETE FROM tour_history_images WHERE id = %s", (image_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Image deleted successfully"})


@app.route("/api/tours/<slug>/video/<int:video_id>", methods=["PATCH"])
def update_tour_video(slug, video_id):
    try:
        caption = request.form.get("caption")
        category = request.form.get("category")
        if not caption:
            return jsonify({"error": "Caption is required"}), 400

        if not category:
            return jsonify({"error": "category is required"}), 400

        db = mysql.connector.connect(**tours_db_config)
        with db.cursor() as cursor:
            cursor.execute(
                """
                UPDATE tour_videos
                SET caption = %s, category = %s
                WHERE id = %s
            """,
                (caption, category, video_id),
            )

            db.commit()

        db.close()
        return jsonify({"message": "Video updated successfully"})
    except Exception as e:
        print("❌ Error in update_tour_video:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/tours/list", methods=["GET"])
def list_all_tours():
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            cursor.execute(
                "SELECT item_id, slug, title FROM vw_tour_page ORDER BY title ASC"
            )
            tours = cursor.fetchall()
        db.close()
        return jsonify(tours)
    except Exception as e:
        print("❌ Error in list_all_tours:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/tours/<slug>/history-images", methods=["GET"])
def get_tour_history_images(slug):
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            query = """
                SELECT h.id, h.image_path AS url, h.caption, h.category
                FROM tour_history_images h
                JOIN items i ON h.tour_id = i.item_id
                WHERE i.slug = %s
            """
            cursor.execute(query, (slug,))
            images = cursor.fetchall()
        db.close()
        return jsonify(images)
    except Exception as e:
        print("🔥 Error in get_tour_history_images:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/categories", methods=["GET"])
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


@app.route("/api/book", methods=["POST"])  # NEED FIX
def book_tour():
    data = request.json

    user_id = data.get("user_id")
    tour_id = data.get("tour_id")
    num_guests = data.get("num_guests", 1)
    hotel_booked = data.get("hotel_booked", "")
    car_rented = data.get("car_rented", "")
    hotel_id = data.get("hotel_id")
    car_id = data.get("car_id")

    # ✅ Generate secure token for vendor confirmation
    confirmation_token = generate_token()

    try:
        conn = mysql.connector.connect(**tours_db_config)
        cursor = conn.cursor()

        # 🔍 Fetch vendor_id and vendor_email from tour
        cursor.execute(
            """
            SELECT v.id, v.email FROM vendors v
            JOIN tours t ON v.id = t.vendor_id
            WHERE t.id = %s
        """,
            (tour_id,),
        )
        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "Vendor not found for this tour"}), 404

        vendor_id, vendor_email = result

        # 🔹 Insert new booking
        cursor.execute(
            """
            INSERT INTO bookings (
                user_id, tour_id, num_guests, hotel_booked, car_rented,
                hotel_id, car_id, confirmation_token, vendor_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
            (
                user_id,
                tour_id,
                num_guests,
                hotel_booked,
                car_rented,
                hotel_id,
                car_id,
                confirmation_token,
                vendor_id,
            ),
        )

        conn.commit()
        booking_id = cursor.lastrowid
        print(f"🆔 Generated token for booking {booking_id}: {confirmation_token}")

        # ✉️ Send confirmation email
        send_confirmation_email(vendor_email, booking_id, confirmation_token)

        return (
            jsonify({"message": "Booking successful. Vendor will confirm via email."}),
            200,
        )

    except Exception as e:
        print("❌ Error during booking:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/delete-tour/<int:tour_id>", methods=["DELETE"])
def delete_tour(tour_id):
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tours WHERE id=%s", (tour_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Tour deleted successfully"})


@app.route("/api/tours-list", methods=["GET"])
def get_tour_list():
    try:
        db = mysql.connector.connect(**tours_db_config)
        with db.cursor(dictionary=True) as cursor:
            cursor.execute(
                """
                SELECT id, item_id, slug, title, description, image, price,
                    location, available_slots, start_date, end_date
                FROM items where item_type = 'tour'
                ORDER BY created_at DESC
                """
            )

            tours = cursor.fetchall()

        db.close()
        return jsonify(tours)

    except Exception as e:
        print("❌ Error in /api/tours-list:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/tour-titles", methods=["GET"])
def get_tour_titles():
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, item_id, title, price, slug FROM items WHERE item_type = 'tour' ORDER BY title ASC"
    )
    results = cursor.fetchall()
    return jsonify(results)


@app.route("/api/tour-itinerary/<string:slug>", methods=["GET"])
def get_tour_itinerary(slug):
    tour = get_tour_from_db_by_slug(slug)  # You need to fetch using slug
    return jsonify(tour)


@app.route("/api/tour-itinerary/<string:slug>", methods=["PUT"])
def update_tour_itinerary(slug):
    data = request.get_json()

    # ✅ Fetch item_id (tour ID) from vw_tour_page using slug
    conn = mysql.connector.connect(**tours_db_config)
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT item_id FROM vw_tour_page WHERE slug = %s", (slug,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if not result:
        return jsonify({"error": "Tour not found"}), 404

    tour_id = result["item_id"]  # ✅ Extract the real tour ID

    # ✅ Validate itinerary format
    if not isinstance(data.get("tour_itinerary", []), list):
        return jsonify({"error": "Invalid itinerary format"}), 400

    # ✅ Update using ID instead of slug
    update_tour_in_db_by_id(tour_id, data)
    return jsonify({"message": "Tour updated"})


from flask_cors import cross_origin


@app.route("/api/tour-tips/<slug>", methods=["GET", "PUT", "OPTIONS"])
@cross_origin(
    origins=["https://app.tourwise.shop"],
    methods=["GET", "PUT", "OPTIONS"],
    allow_headers="*",
)
def tour_tips(slug):
    if request.method == "GET":
        # You can implement GET logic here if needed
        ...

    elif request.method == "PUT":
        print("✅ PUT request to /api/tour-tips received")
        try:
            data = request.get_json()
            print("📥 Data received:", data)

            if not data or "tips" not in data:
                return jsonify({"error": "Missing tips in request"}), 400

            new_tips = data["tips"]
            print("📝 New tips:", new_tips)

            # ✅ Fetch item_id from vw_tour_page using slug
            conn = mysql.connector.connect(**tours_db_config)
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT item_id FROM vw_tour_page WHERE slug = %s", (slug,))
            result = cursor.fetchone()

            if not result:
                cursor.close()
                conn.close()
                return jsonify({"error": "Tour not found"}), 404

            tour_id = result["item_id"]
            cursor.close()

            # ✅ Update tips in tours table using the real tour_id
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE tours SET tips = %s WHERE id = %s", (new_tips, tour_id)
            )
            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({"message": "Tips updated successfully"})

        except Exception as e:
            print("❌ Exception while saving tips:", e)
            return jsonify({"error": "Failed to update tips"}), 500

    return "", 204


app.register_blueprint(fb_bp, url_prefix="/api/fb")
app.register_blueprint(cart_bp, url_prefix="/api/cr")
app.register_blueprint(payment_bp, url_prefix="/api/pay")
app.register_blueprint(confirm_bp, url_prefix="/api/cf")
app.register_blueprint(voucher_bp, url_prefix="/api/vr")
app.register_blueprint(tours_bp, url_prefix="/api/tr")


# ✅ Run locally or with Gunicorn/Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    print("\n📅 Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule} → {', '.join(rule.methods)}")

    app.run(host="0.0.0.0", port=port)


@app.after_request
def set_response_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    # optional: remove old headers
    response.headers.pop("X-XSS-Protection", None)
    return response
