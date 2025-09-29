import os
import time
import secrets
import json
import hashlib   

from decimal import Decimal, InvalidOperation

from flask import (
    Flask,
    current_app,
    request,
    jsonify,
    make_response,
    send_from_directory,
)

from mysql.connector import Error as MySQLError

from datetime import datetime, timezone


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
from app_categories import bp_categories
from bp_hotel_rooms import rooms_bp
from bp_xendit_webhook import bp_xendit
from cache_tourpage import bp_tourpages



from voucher_routes import send_confirmation_email

# --- Flask app FIRST ---
app = Flask(__name__)


CORS(app,
    resources={r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://app.tourwise.shop"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        # ⬇️ keep your existing headers and ADD the two custom ones
        "allow_headers": ["Content-Type", "Authorization", "If-None-Match", "X-Cache-Strategy"],
        # ⬇️ expose ETag so your JS can read res.headers.get('ETag')
        "expose_headers": ["ETag"],
    }},
    # optional, only if you use cookies:
    # supports_credentials=True
)

from tours_db_helpers import (
    get_tour_from_db_by_slug,
    update_tour_in_db_by_id,
    get_tour_tips_from_db_by_slug,
    update_tour_tips_by_slug,
    post_tour_tips_from_db_by_slug,
)


# Register MIME types
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")

# ✅ Load environment variables from .env.tours
env_file = ".env.development" if os.getenv("APP_ENV") == "development" else ".env.tours"
load_dotenv(dotenv_path=env_file)

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
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://app.tourwise.shop",

# ✅ One-time reusable connection function


def get_db_connection():
    return mysql.connector.connect(**tours_db_config)

# cache datetime etag helper
def _to_dt(val):
    if not val:
        return None
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    s = str(val).replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        try:
            # common MySQL format
            dt = datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
            return dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None


print("🔥 Connecting to HOTEL DB at:", hotels_db_config["host"])
print("🧪 HOTEL DB CONFIG:", hotels_db_config)


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

        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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

        cursor.execute(
            """
            INSERT INTO tours(tour_id) value(%s)
            """,
            (
                new_item_id,
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

    # db_tours = mysql.connector.connect(**tours_db_config)
    db_tours = get_db_connection()
    with db_tours.cursor(dictionary=True) as cursor:
        cursor.execute(
            """
            (
                SELECT * FROM vw_landing_page WHERE type = 'tour' ORDER BY item_id ASC LIMIT 3
            )
            UNION ALL
            (
                SELECT * FROM vw_landing_page WHERE type = 'hotel' ORDER BY item_id ASC LIMIT 3
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
            tour["image"] = f"/{raw_image}"
        else:
            tour["image"] = ""

        processed_tours.append(tour)

        # ---- ETag helpers ---------------------------------------------------
    ts_candidates = []

    if isinstance(tours, dict):
        item_ids = tours.get("item_id")
    elif isinstance(tours, list):
        item_ids = [t.get("item_id") for t in tours if isinstance(t, dict)]
    else:
        item_ids = None

    # top-level
    for key in ("updated_at", "created_at"):
        if key in tours:
            dt = _to_dt(tours.get(key))
            if dt: ts_candidates.append(dt)

    latest_ts = max(ts_candidates).timestamp() if ts_candidates else 0.0

    # Stable ETag basis (adjust as you like)
    etag_basis = f'{item_ids}|{latest_ts}'
    etag = hashlib.md5(etag_basis.encode("utf-8")).hexdigest()
    

    # ---- 304 handling ---------------------------------------------------
    # Use Werkzeug's parsed ETags for correctness (quotes/weak tags/multiple)
    # inm = request.if_none_match  # ETags object or empty
    inm = request.headers.get("If-None-Match")

    print("HEADERS ===>",request.headers,flush=True)

    if inm == f"\"{etag}\"":
        resp = make_response("", 304)
        resp.set_etag(etag)
        resp.headers["Cache-Control"] = "private, max-age=0, must-revalidate"
        resp.headers["Access-Control-Expose-Headers"] = "ETag"
        return resp

        
    print("TD INM etag 222 ===>", etag, flush=True)
    # Fresh body
    resp = make_response(jsonify(processed_tours), 200)
    resp.set_etag(etag)  # sets a quoted tag
    resp.headers["Cache-Control"] = "private, max-age=0, must-revalidate"
    resp.headers["Access-Control-Expose-Headers"] = "ETag"
    return resp

    # return jsonify({"topItems": processed_tours})

#1234
# ✅ Landing data
@app.route("/api/touradmin-data")
def get_touradmin_data():
    print("👋 Tour data route called!", flush=True)

    # db_tours = mysql.connector.connect(**tours_db_config)
    db_tours = get_db_connection()
    with db_tours.cursor(dictionary=True) as cursor:
        cursor.execute(
            """
            SELECT * FROM vw_touradmin_page;
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


@app.route("/api/tour-data")
def get_tour_data():
    print("👋 Tour admin data route called!", flush=True)

    # db_tours = mysql.connector.connect(**tours_db_config)
    db_tours = get_db_connection()
    with db_tours.cursor(dictionary=True) as cursor:
        cursor.execute(
            """
            (
                SELECT * FROM vw_landing_page WHERE type = 'tour' ORDER BY item_id ASC
            )
            UNION ALL
            (
                SELECT * FROM vw_landing_page WHERE type = 'hotel' ORDER BY item_id ASC
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

    # ---- ETag helpers ---------------------------------------------------
    ts_candidates = []

    if isinstance(tours, dict):
        item_ids = tours.get("item_id")
    elif isinstance(tours, list):
        item_ids = [t.get("item_id") for t in tours if isinstance(t, dict)]
    else:
        item_ids = None

    # top-level
    for key in ("updated_at", "created_at"):
        if key in tours:
            dt = _to_dt(tours.get(key))
            if dt: ts_candidates.append(dt)

    latest_ts = max(ts_candidates).timestamp() if ts_candidates else 0.0

    # Stable ETag basis (adjust as you like)
    etag_basis = f'{item_ids}|{latest_ts}'
    etag = hashlib.md5(etag_basis.encode("utf-8")).hexdigest()
    

    # ---- 304 handling ---------------------------------------------------
    # Use Werkzeug's parsed ETags for correctness (quotes/weak tags/multiple)
    # inm = request.if_none_match  # ETags object or empty
    inm = request.headers.get("If-None-Match")

    if inm == f"\"{etag}\"":
        resp = make_response("", 304)
        resp.set_etag(etag)
        resp.headers["Cache-Control"] = "private, max-age=0, must-revalidate"
        resp.headers["Access-Control-Expose-Headers"] = "ETag"
        return resp

        
    print("TD INM etag ===>", etag, flush=True)
    # Fresh body
    resp = make_response(jsonify(processed_tours), 200)
    resp.set_etag(etag)  # sets a quoted tag
    resp.headers["Cache-Control"] = "private, max-age=0, must-revalidate"
    resp.headers["Access-Control-Expose-Headers"] = "ETag"
    return resp
    # return jsonify({"topTours": processed_tours})


# ✅ Get tour by slug (with history images)


# ✅ Get tour by slug (with history images)
@app.route("/api/tours/<slug>")
def get_tour_by_slug(slug):
    db = None
    try:
        db = get_db_connection()
        with db.cursor(dictionary=True) as cursor:
            # 🔍 Main tour
            cursor.execute("SELECT * FROM vw_tour_page WHERE slug = %s LIMIT 1", (slug,))
            tour = cursor.fetchone()
            if not tour:
                return jsonify({"error": "Tour not found"}), 404

            # 🏪 Vendor
            cursor.execute(
                """
                SELECT v.vendor_id, v.name, v.email, v.status, v.created_at
                FROM vendors v
                JOIN items i ON v.vendor_id = i.vendor_id
                WHERE i.item_id = %s
                """,
                (tour["item_id"],),
            )
            vendor = cursor.fetchone() or {}
            tour["vendor"] = vendor

            # 🖼️ Fix main image path
            if tour.get("image"):
                image_path = str(tour["image"]).lstrip("/")
                tour["image"] = f"/uploads/{image_path}"

            # 🖼️ History images
            cursor.execute(
                """
                SELECT image_path, caption, category, created_at
                FROM tour_history_images
                WHERE tour_id = %s
                ORDER BY created_at DESC
                """,
                (tour["item_id"],),
            )
            history_images = cursor.fetchall() or []
            for img in history_images:
                path = str(img.get("image_path", "")).lstrip("/")
                img["image_path"] = f"/uploads/{path}" if not path.startswith("http") else path
            tour["history_images"] = history_images

            # 🎬 Videos
            cursor.execute(
                """
                SELECT video_id, caption, category, created_at
                FROM tour_videos
                WHERE tour_id = %s
                ORDER BY created_at DESC
                """,
                (tour["item_id"],),
            )
            videos = cursor.fetchall() or []
            tour["videos"] = videos

        # ---- ETag helpers ---------------------------------------------------
        ts_candidates = []
        KEYS = ("updated_at", "created_at")

        # top-level
        for k in KEYS:
            dt = _to_dt(tour.get(k))
            if dt: ts_candidates.append(dt)

        # vendor
        for k in KEYS:
            dt = _to_dt(vendor.get(k))
            if dt: ts_candidates.append(dt)

        # images
        for img in history_images:
            for k in KEYS:
                dt = _to_dt(img.get(k))
                if dt: ts_candidates.append(dt)

        # videos
        for vid in videos:
            for k in KEYS:
                dt = _to_dt(vid.get(k))
                if dt: ts_candidates.append(dt)

        latest_ts = max(ts_candidates).timestamp() if ts_candidates else 0.0

        # Stable ETag basis (adjust as you like)
        etag_basis = f'{tour.get("item_id")}|{latest_ts}|imgs:{len(history_images)}|vids:{len(videos)}'
        etag = hashlib.md5(etag_basis.encode("utf-8")).hexdigest()

        # ---- 304 handling ---------------------------------------------------
        # Use Werkzeug's parsed ETags for correctness (quotes/weak tags/multiple)
        inm = request.if_none_match  # ETags object or empty

        if inm and inm.contains(etag):
            resp = make_response("", 304)
            resp.set_etag(etag)
            resp.headers["Cache-Control"] = "private, max-age=0, must-revalidate"
            resp.headers["Access-Control-Expose-Headers"] = "ETag"
            return resp

        # Fresh body
        resp = make_response(jsonify(tour), 200)
        resp.set_etag(etag)  # sets a quoted tag
        resp.headers["Cache-Control"] = "private, max-age=0, must-revalidate"
        resp.headers["Access-Control-Expose-Headers"] = "ETag"
        return resp

    except Exception as e:
        print("❌ Error in get_tour_by_slug:", e, flush=True)
        return jsonify({"error": str(e)}), 500
    finally:
        if db:
            try:
                db.close()
            except Exception:
                pass



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

        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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
        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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

    # conn = mysql.connector.connect(**tours_db_config)
    conn = get_db_connection()
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
    # conn = mysql.connector.connect(**tours_db_config)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tour_history_images WHERE id=%s", (image_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Image deleted successfully"})


@app.route("/api/history-images/<slug>", methods=["GET"])
def get_history_images(slug):
    # conn = mysql.connector.connect(**tours_db_config)
    conn = get_db_connection()
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



@app.route("/api/testing", methods=["POST","OPTIONS"])
def api_testing():
    print("WELCOME TO API WORLD",flush=True)
    description = request.form["description"]
    print("CAPTION ==>", description,flush=True)
    return ("watch out I am comming!")
    

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

        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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
        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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
        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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
    # conn = mysql.connector.connect(**tours_db_config)
    conn = get_db_connection()
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

        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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
        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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
        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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
        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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
        # conn = mysql.connector.connect(**tours_db_config)
        conn = get_db_connection()
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


@app.route("/api/delete-tour/<slug>", methods=["DELETE", "OPTIONS"])
def delete_tour(slug):
    # conn = mysql.connector.connect(**tours_db_config)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM items WHERE slug = %s", (slug,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Tour deleted successfully"})


@app.route("/api/tours-list", methods=["GET"])
def get_tour_list():
    try:
        # db = mysql.connector.connect(**tours_db_config)
        db = get_db_connection()
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
    # conn = mysql.connector.connect(**tours_db_config)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT item_id,item_type FROM vw_touradmin_page WHERE slug = %s", (slug,))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if not result:
        return jsonify({"error": "Tour not found"}), 404

    tour_id = result["item_id"] 
    item_type = result["item_type"] 

    # ✅ Validate itinerary format
    if not isinstance(data.get("tour_itinerary", []), list):
        return jsonify({"error": "Invalid itinerary format"}), 400

    # ✅ Update using ID instead of slug
    update_tour_in_db_by_id(tour_id, item_type, data)
    return jsonify({"message": "Tour updated"})


@app.route("/api/tour-tips/<slug>", methods=["GET", "PUT", "POST", "OPTIONS"])
def tour_tips(slug):
    ORIGIN = "http://localhost:5173"

    if request.method == "OPTIONS":
        return ("", 204, {
            "Access-Control-Allow-Origin": ORIGIN,
            "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Vary": "Origin",
        })

    try:
        if request.method == "GET":
            tips = get_tour_tips_from_db_by_slug(slug)  # returns a Python list
            resp = jsonify({"tips": tips})
            resp.headers["Access-Control-Allow-Origin"] = ORIGIN
            return resp, 200

        # PUT/POST share the same body handling
        data = request.get_json(silent=True) or {}
        if "tips" not in data:
            resp = jsonify({"error": "Missing tips in request"})
            resp.headers["Access-Control-Allow-Origin"] = ORIGIN
            return resp, 400

        if request.method == "PUT":
            data = request.get_json(silent=True) or {}
            if "tips" not in data:
                resp = jsonify({"error": "Missing tips in request"})
                resp.headers["Access-Control-Allow-Origin"] = ORIGIN
                return resp, 400

            try:
                affected = update_tour_tips_by_slug(slug, data["tips"])  # should return int
                msg = "Tips updated successfully" if affected else "No change (already up to date)"
                resp = jsonify({"message": msg, "affected": affected})
                resp.headers["Access-Control-Allow-Origin"] = ORIGIN
                resp.headers["Vary"] = "Origin"
                return resp, 200
            except LookupError:
                resp = jsonify({"error": "Tour not found"})
                resp.headers["Access-Control-Allow-Origin"] = ORIGIN
                return resp, 404


        if request.method == "POST":
            # Same as PUT; keep if you want both verbs
            affected = update_tour_tips_by_slug(slug, data["tips"])
            resp = jsonify({"message": "Tips saved", "affected": affected})
            resp.headers["Access-Control-Allow-Origin"] = ORIGIN
            return resp, 200

    except LookupError:
        resp = jsonify({"error": "Tour not found"})
        resp.headers["Access-Control-Allow-Origin"] = ORIGIN
        return resp, 404
    except Exception as e:
        print("❌ Exception while saving tips:", e, flush=True)
        resp = jsonify({"error": "Failed to process tips"})
        resp.headers["Access-Control-Allow-Origin"] = ORIGIN
        return resp, 500



app.register_blueprint(fb_bp, url_prefix="/api/fb")
app.register_blueprint(cart_bp, url_prefix="/api/cr")
app.register_blueprint(payment_bp, url_prefix="/api/pay")
app.register_blueprint(confirm_bp, url_prefix="/api/cf")
app.register_blueprint(voucher_bp, url_prefix="/api/vr")
app.register_blueprint(tours_bp, url_prefix="/api/tr")
app.register_blueprint(bp_categories, url_prefix="/api/cat")
app.register_blueprint(rooms_bp, url_prefix="/api/hr")
app.register_blueprint(bp_xendit, url_prefix="/api/xen")
app.register_blueprint(bp_tourpages, url_prefix="/api/tp")
# app.register_blueprint(bp_xendit)  # no prefix; route already starts with /api


# ... your imports and routes above

# ✅ Debug route to list all registered routes
@app.get("/__routes")
def __routes():
    return [str(r) for r in app.url_map.iter_rules()]

# ✅ Run locally or with Gunicorn/Render
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))

    # Optional: print all routes on startup
    print("\n📅 Registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"{rule} → {', '.join(rule.methods)}")

    app.run(host="0.0.0.0", port=port, debug=True)



@app.after_request
def set_response_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    # optional: remove old headers
    response.headers.pop("X-XSS-Protection", None)
    return response
