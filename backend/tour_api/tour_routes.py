import os
import json
from flask import Blueprint, jsonify
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=".env.tours")

# DB Config
tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": 3306,
}

tours_bp = Blueprint("tours", __name__)


@tours_bp.route("/tours/<int:tour_id>/guides", methods=["GET"])
def get_tour_guides(tour_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        query = """
            SELECT tg.id AS guide_id, tg.name, tg.phone, tg.email, 
                   tg.language_spoken, tg.location, tg.availability, 
                   tg.rating, tg.total_reviews, tg.commission_rate, tg.notes
            FROM tour_guide_assignments tga
            JOIN tour_guides tg ON tg.id = tga.guide_id
            JOIN items i ON i.item_id = tga.item_id AND i.item_type = 'tour'
            WHERE i.item_id = %s;
        """
        cursor.execute(query, (tour_id,))
        guides = cursor.fetchall()

        # Parse JSON string to Python list/dict if not null
        for guide in guides:
            if guide["availability"]:
                try:
                    guide["availability"] = json.loads(guide["availability"])
                except json.JSONDecodeError:
                    guide["availability"] = []

        if not guides:
            return (
                jsonify(
                    {
                        "tour_id": tour_id,
                        "guides": [],
                        "message": "No guides found for this tour",
                    }
                ),
                404,
            )

        return jsonify({"tour_id": tour_id, "guides": guides}), 200

    except Exception as e:
        print("❌ Error fetching guides:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        db.close()


@tours_bp.route("/vendors/<int:vendor_id>", methods=["GET"])
def get_vendor(vendor_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT 
                id, 
                name, 
                email, 
                phone, 
                whatsapp, 
                created_at, 
                license_number, 
                license_expiry, 
                certifications, 
                awards, 
                description, 
                rating 
            FROM vendors 
            WHERE id = %s
            """,
            (vendor_id,),
        )

        vendor = cursor.fetchone()
        if not vendor:
            return jsonify({"message": "Vendor not found"}), 404

        return jsonify(vendor), 200

    except Exception as e:
        print("❌ Error fetching vendor:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        db.close()


@tours_bp.route("/vendors/<int:vendor_id>/upload", methods=["POST"])
def upload_vendor_document(vendor_id):
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    doc_type = request.form.get("type")  # 'license', 'award', 'certificate'

    if file:
        filename = secure_filename(file.filename)
        upload_path = os.path.join("uploads/vendor_docs", filename)
        file.save(upload_path)

        # Save file info to DB
        cursor = mysql.connection.cursor()
        cursor.execute(
            "INSERT INTO vendor_documents (vendor_id, type, file_url) VALUES (%s, %s, %s)",
            (vendor_id, doc_type, f"/uploads/vendor_docs/{filename}"),
        )
        mysql.connection.commit()
        cursor.close()

        return jsonify({"message": "File uploaded successfully"}), 201
