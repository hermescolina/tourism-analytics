from flask_cors import cross_origin
import mysql.connector
from datetime import datetime
import random
import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

from flask import Flask, Blueprint, request, jsonify, current_app
from decimal import Decimal, InvalidOperation


# Define the Blueprint
cat_bp = Blueprint("cat_bp", __name__)

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


@cat_bp.route("/categories", methods=["GET","OPTIONS"])
def get_cat():
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        # Query from vw_cart_details view
        query = """
            SELECT *
            FROM categories
        """
        cursor.execute(query,)
        car_items = cursor.fetchall()

        return jsonify(cat_items), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()

