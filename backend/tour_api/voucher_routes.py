from flask import Blueprint, request, jsonify
import mysql.connector
import os
import json
import smtplib
from dotenv import load_dotenv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ✅ Load env vars
load_dotenv(dotenv_path=".env.tours")

# ✅ DB config
tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": 3306,
}

# ✅ Define Blueprint
voucher_bp = Blueprint("voucher", __name__)


def send_voucher_email(to_email, reference_id, bookings, confirm_url):
    msg = MIMEMultipart()
    msg["Subject"] = f"Booking Voucher - Reference {reference_id}"
    msg["From"] = os.getenv("EMAIL_USER")
    msg["To"] = to_email

    total = sum(float(item["price"]) * item["quantity"] for item in bookings)

    body = f"""
    <h2>📄 Booking Voucher</h2>
    <p><strong>Reference ID:</strong> {reference_id}</p>
    <ul>
    {''.join([
        f"<li><strong>{item['title']}</strong>: ₱{item['price']} × {item['quantity']} = "
        f"₱{float(item['price']) * item['quantity']}</li>"
        for item in bookings
    ])}
    </ul>
    <h3>Grand Total: ₱{total:.2f}</h3>
    <p>👉 <a href="{confirm_url}">Click here to confirm the booking</a></p>
    """

    msg.attach(MIMEText(body, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
        smtp.send_message(msg)
        print("📧 Email sent successfully!")


@voucher_bp.route("/api/voucher/<reference_id>", methods=["GET"])
def get_voucher(reference_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            "SELECT reference_id, bookings, user_id, created_at FROM booking_vouchers WHERE reference_id = %s",
            (reference_id,),
        )
        row = cursor.fetchone()

        if row:
            # Convert bookings from JSON string to Python object
            row["bookings"] = json.loads(row["bookings"])
            return jsonify(row)
        else:
            return jsonify({"error": "Voucher not found"}), 404
    except Exception as e:
        print("❌ ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


@voucher_bp.route("/api/save-voucher", methods=["POST"])
def save_voucher():
    try:
        data = request.json
        print("📥 Received data:", data)

        reference_id = data.get("reference_id")
        bookings = data.get("bookings")
        user_email = data["email"]
        user_id = data.get("user_id")

        # ✅ Create DB connection
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor()

        # ✅ Insert data
        cursor.execute(
            "INSERT INTO booking_vouchers (reference_id, bookings, user_id) VALUES (%s, %s, %s)",
            (reference_id, json.dumps(bookings), user_id),
        )
        db.commit()

        # Confirmation link (optional: include token later)
        confirm_url = f"https://api.tourwise.shop/confirm-booking/{reference_id}"

        # ✅ Send the email
        send_voucher_email(
            to_email=user_email,
            reference_id=reference_id,
            bookings=bookings,
            confirm_url=confirm_url,
        )

        return jsonify({"message": "Voucher saved"})
    except Exception as e:
        print("❌ ERROR:", str(e))
        return jsonify({"error": str(e)}), 500


def send_confirmation_email(email, booking_id, token):
    print("📨 send_confirmation_email() called with:", email, booking_id)

    confirm_url = f"https://app.tourwise.shop/confirm-booking?booking_id={booking_id}&token={token}"

    body = f"""
    You have a new tour booking!

    Click below to confirm this booking:
    {confirm_url}

    Thank you!
    """

    msg = MIMEText(body)
    msg["Subject"] = "New Tour Booking Confirmation"
    msg["From"] = "aws.alcians@gmail.com"
    msg["To"] = "itloboc@gmail.com"  # replace with dynamic vendor email later

    try:
        print("📡 Connecting to SMTP server...")
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.starttls()
            # smtp.login('aws.alcians@gmail.com', 'Asdf1234!@#')  # ❗ your credentials are failing
            smtp.login("aws.alcians@gmail.com", "rwwf mpwg cqwj wrox")
            smtp.send_message(msg)
            print("✅ Confirmation email sent!")
    except Exception as e:
        print("❌ Failed to send email:", e)
