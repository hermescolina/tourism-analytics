from flask import Blueprint, jsonify, redirect
import mysql.connector
import os
from dotenv import load_dotenv


# 🔧 Load environment variables
load_dotenv(dotenv_path=".env.tours")

# 🔌 DB config
tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": 3306,
}


def get_db_connection():
    return mysql.connector.connect(**tours_db_config)


# 🧩 Blueprint
confirm_bp = Blueprint("confirm", __name__)


@confirm_bp.route("/confirm-booking/<reference_id>", methods=["GET"])
def confirm_booking(reference_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor()

        # Confirm the booking by updating is_confirmed
        cursor.execute(
            """
            UPDATE cart_bookings
            SET is_confirmed = 1,
                confirmed_at = NOW()
            WHERE reference_id = %s
        """,
            (reference_id,),
        )
        db.commit()

        # Optional: check if update succeeded
        if cursor.rowcount == 0:
            return jsonify({"error": "Booking not found."}), 404
        return redirect("/tourism-analytics/confirmation-success")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        db.close()


@confirm_bp.route("/api/bookings/user/<int:user_id>", methods=["GET"])
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


# -----------------------
# ✅ HELPER FUNCTIONS
# -----------------------


def insert_booking(name, email, phone, whatsapp, tour_id, token):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if user already exists in `users`
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()

    if user:
        user_id = user[0]
    else:
        # Insert new user
        cursor.execute(
            "INSERT INTO users (full_name, email, phone, whatsapp) VALUES (%s, %s, %s, %s)",
            (name, email, phone, whatsapp),
        )
        user_id = cursor.lastrowid

    # Insert booking
    cursor.execute(
        """
        INSERT INTO bookings (user_id, tour_id, status, token)
        VALUES (%s, %s, %s, %s)
    """,
        (user_id, tour_id, "pending", token),
    )

    booking_id = cursor.lastrowid
    conn.commit()
    cursor.close()
    conn.close()
    return booking_id


def get_booking_by_id(booking_id):
    db = get_db_connection()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM bookings WHERE id = %s", (booking_id,))
    booking = cursor.fetchone()
    db.close()
    return booking


def update_booking_status(booking_id, status):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE bookings SET status = %s WHERE id = %s", (status, booking_id)
    )
    db.commit()
    db.close()


def set_confirmation_time(booking_id, confirmed_at):
    db = get_db_connection()
    cursor = db.cursor()
    cursor.execute(
        "UPDATE bookings SET confirmed_at = %s WHERE id = %s",
        (confirmed_at, booking_id),
    )
    db.commit()
    db.close()
