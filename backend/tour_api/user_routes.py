from flask import Blueprint, request, jsonify
import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables (once if not already done in main.py)
load_dotenv(dotenv_path=".env.tours")

# DB Config
tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": 3306,
}

# Define Blueprint
user_bp = Blueprint("users", __name__)


@user_bp.route("/api/users/<int:user_id>", methods=["GET"])
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


@user_bp.route("/api/users/login", methods=["POST"])
def login_user():
    data = request.get_json()
    email = data.get("email")
    # password = data.get('password') ← ignore for now

    db = mysql.connector.connect(**tours_db_config)
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT id, full_name, email FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    db.close()

    if user:
        return jsonify(user)
    else:
        return jsonify({"error": "Invalid email"}), 401
