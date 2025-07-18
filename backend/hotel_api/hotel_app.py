from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv
import os
import logging
from werkzeug.utils import secure_filename

# ✅ Set up logging once globally
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ Load environment variables
load_dotenv(dotenv_path=".env.hotels")

# ✅ DB config from .env
db_config = {
    "host": os.getenv("HOTEL_DB_HOST"),
    "user": os.getenv("HOTEL_DB_USER"),
    "password": os.getenv("HOTEL_DB_PASS"),
    "database": os.getenv("HOTEL_DB_NAME"),
}

app = Flask(__name__)
CORS(app)

# ✅ Add new hotel


@app.route("/api/hotel", methods=["POST"])
def add_hotel():
    data = request.get_json()
    name = data.get("name")
    slug = data.get("slug")
    address = data.get("address", "")
    city = data.get("city", "")
    region = data.get("region", "")
    country = data.get("country", "")
    phone = data.get("phone", "")
    email = data.get("email", "")
    website = data.get("website", "")
    opening_date = data.get("opening_date", None)
    operator = data.get("operator", "")
    owner = data.get("owner", "")
    number_of_rooms = data.get("number_of_rooms", None)
    number_of_suites = data.get("number_of_suites", None)
    floors = data.get("floors", None)
    description = data.get("description", "")

    if not name or not slug:
        return jsonify({"error": "Hotel name and slug are required"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query = """
            INSERT INTO hotels (
                name, slug, address, city, region, country,
                phone, email, website, opening_date,
                operator, owner, number_of_rooms,
                number_of_suites, floors, description
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            name,
            slug,
            address,
            city,
            region,
            country,
            phone,
            email,
            website,
            opening_date,
            operator,
            owner,
            number_of_rooms,
            number_of_suites,
            floors,
            description,
        )

        cursor.execute(query, values)
        conn.commit()

        return jsonify({"hotel_id": cursor.lastrowid, "name": name, "slug": slug}), 201

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

    finally:
        cursor.close()
        conn.close()


# # ✅ Configure upload folder
# UPLOAD_FOLDER = 'uploads'
# os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ✅ Configure upload folder to match frontend's public path
UPLOAD_FOLDER = os.path.abspath("../frontend/public/images")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


# ✅ Create per-request DB connection
def get_conn():
    conn = mysql.connector.connect(**db_config)
    logger.info("🛠 Connected to: %s %s", db_config["host"], db_config["database"])
    return conn


# ✅ Fetch a single row
def fetch_one(query, params):
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        result = cursor.fetchone()
    finally:
        cursor.close()
        conn.close()
    return result


# ✅ Fetch multiple rows


def fetch_all(query, params):
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        result = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
    return result


# ✅ GET & PATCH endpoint for hotel


@app.route("/api/hotel/<slug>", methods=["GET", "PATCH"])
def get_or_update_hotel(slug):
    if request.method == "GET":
        hotel = fetch_one(
            "SELECT * FROM hotels WHERE LOWER(slug) = %s", (slug.lower(),)
        )
        if not hotel:
            return jsonify({"error": "Hotel not found"}), 404

        hotel_id = hotel["hotel_id"]

        images = fetch_all(
            "SELECT filename, category, description FROM hotel_images WHERE hotel_id = %s",
            (hotel_id,),
        )
        rooms = fetch_all(
            "SELECT room_type, bed_type, size_sqm, occupancy, description FROM rooms WHERE hotel_id = %s",
            (hotel_id,),
        )
        amenities = fetch_all(
            "SELECT amenity_name, description FROM amenities WHERE hotel_id = %s",
            (hotel_id,),
        )
        dining = fetch_all(
            "SELECT name, cuisine, description FROM dining_options WHERE hotel_id = %s",
            (hotel_id,),
        )
        spa = fetch_all(
            "SELECT service_name, description FROM spa_services WHERE hotel_id = %s",
            (hotel_id,),
        )

        return jsonify(
            {
                "hotel": hotel,
                "images": images,
                "rooms": rooms,
                "amenities": amenities,
                "dining": dining,
                "spa": spa,
            }
        )

    elif request.method == "PATCH":
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        fields = [f"{key} = %s" for key in data]
        values = list(data.values())
        values.append(slug.lower())

        conn = get_conn()
        cursor = conn.cursor()
        query = f"UPDATE hotels SET {', '.join(fields)} WHERE LOWER(slug) = %s"
        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Hotel updated successfully"})


# # ✅ POST: Upload hotel image


@app.route("/api/hotel/image", methods=["POST"])
def upload_hotel_image():
    hotel_id = request.form.get("hotel_id")
    category = request.form.get("category")
    description = request.form.get("description")
    file = request.files.get("image")
    is_background = request.form.get("is_background") == "true"  # ✅ NEW LINE

    if not file or not hotel_id:
        return jsonify({"error": "Missing hotel_id or image file"}), 400

    filename = secure_filename(file.filename)
    path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(path)

    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO hotel_images (hotel_id, filename, category, description)
            VALUES (%s, %s, %s, %s)
        """,
            (hotel_id, filename, category, description),
        )

        # ✅ Background image override logic
        if is_background:
            cursor.execute(
                """
                UPDATE hotels SET background_image = %s
                WHERE hotel_id = %s
            """,
                (filename, hotel_id),
            )

        conn.commit()
    except mysql.connector.IntegrityError:
        return (
            jsonify({"error": "Image already exists for this hotel and category."}),
            409,
        )
    finally:
        cursor.close()
        conn.close()

    return (
        jsonify({"message": "Image uploaded successfully", "filename": filename}),
        201,
    )


# @app.route('/api/hotel/image', methods=['POST'])
# def upload_hotel_image():
#     hotel_id = request.form.get('hotel_id')
#     category = request.form.get('category')
#     description = request.form.get('description')
#     file = request.files.get('image')

#     if not file or not hotel_id:
#         return jsonify({"error": "Missing hotel_id or image file"}), 400

#     filename = secure_filename(file.filename)
#     path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
#     file.save(path)

#     conn = get_conn()
#     cursor = conn.cursor()
#     try:
#         cursor.execute("""
#             INSERT INTO hotel_images (hotel_id, filename, category, description)
#             VALUES (%s, %s, %s, %s)
#         """, (hotel_id, filename, category, description))
#         conn.commit()
#     except mysql.connector.IntegrityError as e:
#         return jsonify({"error": "Image already exists for this hotel and category."}), 409
#     finally:
#         cursor.close()
#         conn.close()

#     return jsonify({"message": "Image uploaded successfully", "filename": filename}), 201

# ✅ PATCH an image


@app.route("/api/hotel/image/<filename>", methods=["PATCH"])
def update_hotel_image(filename):
    data = request.json
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    description = data.get("description")
    category = data.get("category")

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE hotel_images
        SET description = %s, category = %s
        WHERE filename = %s
    """,
        (description, category, filename),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Image updated successfully"}), 200


# ✅ DELETE an image


@app.route("/api/hotel/image/<filename>", methods=["DELETE"])
def delete_hotel_image(filename):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM hotel_images WHERE filename = %s", (filename,))
    conn.commit()
    deleted = cursor.rowcount
    cursor.close()
    conn.close()

    if deleted == 0:
        return jsonify({"error": "Image not found"}), 404

    return jsonify({"message": "Image deleted successfully"}), 200


# @app.route('/api/hotels', methods=['GET'])
# def list_hotels():
#     try:
#         conn = get_conn()
#         cursor = conn.cursor(dictionary=True)
#         cursor.execute("SELECT name, slug, city, country FROM hotels ORDER BY name ASC")
#         hotels = cursor.fetchall()
#         return jsonify(hotels)
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#     finally:
#         cursor.close()
#         conn.close()


@app.route("/api/hotels", methods=["GET"])
def list_hotels():
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT hotel_id, name, slug, city, country, description, "
            "background_image, card_image "
            "FROM hotels ORDER BY name ASC"
        )

        hotels = cursor.fetchall()
        return jsonify(hotels)  # return as array, not wrapped in object
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


# import os
# import mysql.connector
# from flask import request, jsonify
# from werkzeug.utils import secure_filename

# (Assume db_config already exists at the top of this file)


@app.route("/api/hotel/card-image", methods=["POST"])
def upload_hotel_card_image():
    hotel_id = request.form.get("hotel_id")
    image = request.files.get("image")

    if not hotel_id or not image:
        return jsonify({"error": "Missing hotel_id or image"}), 400

    filename = secure_filename(image.filename)
    # Always use absolute path to your frontend public/images
    frontend_images_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "images")
    )
    os.makedirs(frontend_images_dir, exist_ok=True)
    save_path = os.path.join(frontend_images_dir, filename)
    print("Saving card image to:", save_path)
    image.save(save_path)

    print(
        f'LOG: SQL QUERY - UPDATE hotels SET card_image="{filename}" WHERE hotel_id={hotel_id}'
    )
    # Use your config here!
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE hotels SET card_image=%s WHERE hotel_id=%s", (filename, hotel_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True, "filename": filename})


@app.route("/")
def health_check():
    return jsonify({"message": "🏨 Hotel API is live!"})


# ✅ Run Flask app
if __name__ == "__main__":
    app.run(debug=True)
