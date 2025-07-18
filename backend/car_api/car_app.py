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
load_dotenv(".env.cars")

# ✅ DB config from .env
db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME"),
}

app = Flask(__name__)
# CORS(app)
# CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
CORS(app, resources={r"/*": {"origins": ["https://app.tourwise.shop"]}})

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


# ✅ Add new car


@app.route("/api/car", methods=["POST"])
def add_car():
    data = request.get_json()
    name = data.get("name")
    slug = data.get("slug")
    brand = data.get("brand", "")
    model = data.get("model", "")
    year = data.get("year", None)
    transmission = data.get("transmission", "")
    seats = data.get("seats", None)
    fuel_type = data.get("fuel_type", "")
    price_per_day = data.get("price_per_day", None)
    description = data.get("description", "")

    if not name or not slug:
        return jsonify({"error": "Car name and slug are required"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        query = """
            INSERT INTO cars (
                name, slug, brand, model, year, transmission, seats, fuel_type, price_per_day, description
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            name,
            slug,
            brand,
            model,
            year,
            transmission,
            seats,
            fuel_type,
            price_per_day,
            description,
        )

        cursor.execute(query, values)
        conn.commit()

        return jsonify({"car_id": cursor.lastrowid, "name": name, "slug": slug}), 201

    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

    finally:
        cursor.close()
        conn.close()


# ✅ GET & PATCH endpoint for car


@app.route("/api/car/<slug>", methods=["GET", "PATCH"])
def get_or_update_car(slug):
    if request.method == "GET":
        car = fetch_one("SELECT * FROM cars WHERE LOWER(slug) = %s", (slug.lower(),))
        if not car:
            return jsonify({"error": "Car not found"}), 404

        car_id = car["car_id"]

        # images = fetch_all("SELECT filename, category, description FROM car_images WHERE car_id = %s", (car_id,))

        images = fetch_all(
            "SELECT image_id, filename, category, description FROM car_images WHERE car_id = %s",
            (car_id,),
        )

        # You can expand with related tables if you have them (e.g., features, bookings, etc.)

        return jsonify({"car": car, "images": images})

    elif request.method == "PATCH":
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        fields = [f"{key} = %s" for key in data]
        values = list(data.values())
        values.append(slug.lower())

        conn = get_conn()
        cursor = conn.cursor()
        # query = f"UPDATE cars SET {', '.join(fields)} WHERE LOWER(slug) = %s"
        query = f"UPDATE car_images SET {', '.join(fields)} WHERE image_id = %s"
        print("🟡 SQL Query:", query)
        print(
            "🟡 Values:", values
        )  # This shows the parameter values that are sent to the query
        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Car updated successfully"})


# ✅ POST: Upload car image


@app.route("/api/car/image", methods=["POST"])
def upload_car_image():
    car_id = request.form.get("car_id")
    category = request.form.get("category")
    description = request.form.get("description")
    file = request.files.get("image")
    is_background = (
        request.form.get("is_background") == "true"
    )  # For background image logic

    if not file or not car_id:
        return jsonify({"error": "Missing car_id or image file"}), 400

    filename = secure_filename(file.filename)
    path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(path)

    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO car_images (car_id, filename, category, description)
            VALUES (%s, %s, %s, %s)
        """,
            (car_id, filename, category, description),
        )

        # Background image logic
        if is_background:
            cursor.execute(
                """
                UPDATE cars SET background_image = %s
                WHERE car_id = %s
            """,
                (filename, car_id),
            )

        conn.commit()
    except mysql.connector.IntegrityError:
        return (
            jsonify({"error": "Image already exists for this car and category."}),
            409,
        )
    finally:
        cursor.close()
        conn.close()

    return (
        jsonify({"message": "Image uploaded successfully", "filename": filename}),
        201,
    )


# ✅ PATCH an image


@app.route("/api/car/image/<filename>", methods=["PATCH"])
def update_car_image(filename):
    data = request.json
    if not data:
        return jsonify({"error": "No update data provided"}), 400

    description = data.get("description")
    category = data.get("category")

    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE car_images
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
# @app.route('/api/car/image/<image_id>', methods=['DELETE'])


@app.route("/api/car/image/<int:image_id>", methods=["DELETE"])
def delete_car_image(image_id):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM car_images WHERE image_id = %s", (image_id,))
    conn.commit()
    deleted = cursor.rowcount
    cursor.close()
    conn.close()

    if deleted == 0:
        return jsonify({"error": "Image not found"}), 404

    return jsonify({"message": "Image deleted successfully"}), 200


# ✅ Cars for landing page (recent, or featured)
@app.route("/api/cars/landing", methods=["GET"])
def get_landing_cars():
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT car_id, name, slug, brand, model, year, price_per_day, background_image
            FROM cars
            ORDER BY car_id DESC
            LIMIT 6
        """
        )
        cars = cursor.fetchall()
        return jsonify(cars)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/cars", methods=["GET"])
def list_cars():
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT car_id, name, slug, brand, model, year, price, seats, transmission, fuel_type, price_per_day,
                   description, background_image, card_image
            FROM cars
            ORDER BY name ASC
        """
        )
        cars = cursor.fetchall()
        return jsonify(cars)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/tours/<slug>/history-images")
def get_tour_history_images(slug):
    try:
        tours_db = mysql.connector.connect(**db_config)  # ✅ establish connection
        cursor = tours_db.cursor(dictionary=True)  # ✅ then create cursor

        query = """
            SELECT h.id, h.image_path AS url, h.caption, h.category
            FROM tour_history_images h
            JOIN tours t ON h.tour_id = t.id
            WHERE t.slug = %s
        """
        cursor.execute(query, (slug,))
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        print("🔥 Error in get_tour_history_images:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if "cursor" in locals():
            cursor.close()
        if "tours_db" in locals():
            tours_db.close()


# ✅ Run Flask app
if __name__ == "__main__":
    app.run(debug=True, port=5001)
