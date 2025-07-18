from flask import Blueprint, jsonify
import mysql.connector
from dotenv import load_dotenv
import os

# 🔧 Load environment variables
load_dotenv(dotenv_path=".env.tours")

# 🔌 DB Config
tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": 3306,
}

# 🧩 Define Blueprint
payment_bp = Blueprint("payment", __name__)

# 📌 GET /payment-instructions/<reference_id>


@payment_bp.route("/payment-instructions/<reference_id>", methods=["GET"])
def get_payment_instructions(reference_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        # Step 1: Get vendor_id from booking_vouchers (assume future)
        cursor.execute(
            """
            SELECT user_id FROM booking_vouchers WHERE reference_id = %s
        """,
            (reference_id,),
        )
        voucher = cursor.fetchone()

        if not voucher:
            return jsonify({"error": "Reference ID not found"}), 404

        vendor_id = voucher["user_id"]  # Assume this maps to the vendor for now

        # Step 2: Get vendor payment info
        cursor.execute(
            """
            SELECT * FROM vendor_payments WHERE vendor_id = %s
        """,
            (vendor_id,),
        )
        payment_info = cursor.fetchone()

        if not payment_info:
            return jsonify({"error": "No payment info found for vendor"}), 404

        return jsonify({"payment_instructions": payment_info}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        db.close()
