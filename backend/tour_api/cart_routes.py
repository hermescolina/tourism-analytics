from flask_cors import cross_origin
from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime
import random
import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Define the Blueprint
cart_bp = Blueprint("cart", __name__)

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

# ✅ Cars DB Config
cars_db_config = {
    "host": os.getenv("CAR_DB_HOST"),  # use separate variables in .env.hotels
    "user": os.getenv("CAR_DB_USER"),
    "password": os.getenv("CAR_DB_PASS"),
    "database": os.getenv("CAR_DB_NAME"),
    "port": 3306,
}


def send_confirmation_email(to_email, reference_id, bookings):
    try:
        total = sum(float(item["price"]) * item["quantity"] for item in bookings)
        body = (
            f"""✅ Your booking was successful!
Reference ID: {reference_id}
Total: ₱{total}

🧾 Booked Items:
"""
            + "\n".join(
                [f"- {item['title']} x {item['quantity']}" for item in bookings]
            )
            + f"""

🔗 Please confirm your booking by clicking this link:
https://api.tourwise.shop/api/cf/confirm-booking/{reference_id}
"""
        )

        msg = MIMEText(body)
        msg["Subject"] = f"TourWise Booking Confirmation - {reference_id}"
        msg["From"] = os.getenv("EMAIL_USER")
        msg["To"] = to_email

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASS"))
        server.sendmail(msg["From"], [msg["To"]], msg.as_string())
        server.quit()

        print(f"📧 Email sent to {to_email}")
    except Exception as e:
        print("❌ Failed to send email:", e)


# Helper: Generate Reference ID
def generate_reference_id():
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"TW-{timestamp}-{random.randint(100,999)}"


# ✅ Route: Book Cart


@cart_bp.route("/book-cart", methods=["POST"])
def book_cart():
    data = request.get_json()
    print("📥 RAW Payload:", data)  # Full JSON received
    reference_id = data.get("reference_id") or generate_reference_id()
    user_id = data.get("user_id")
    bookings = data.get("bookings", [])

    db = None
    cursor = None
    insert_cursor = None

    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        # ✅ Step 1: Get user email
        cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user_row = cursor.fetchone()

        if not user_row:
            return jsonify({"error": "❌ Invalid user_id, email not found."}), 400

        email = user_row["email"]
        cursor.close()

        # ✅ Step 2: Insert bookings
        insert_cursor = db.cursor()
        for item in bookings:
            insert_cursor.execute(
                """
                INSERT INTO cart_bookings (reference_id, user_id, email, title, price, quantity)
                VALUES (%s, %s, %s, %s, %s, %s)
            """,
                (
                    reference_id,
                    user_id,
                    email,
                    item["title"],
                    item["price"],
                    item["quantity"],
                ),
            )

        db.commit()
        insert_cursor.close()

        # ✅ Step 3: Send confirmation email
        send_confirmation_email(email, reference_id, bookings)

        return (
            jsonify({"message": "Cart booking saved.", "reference_id": reference_id}),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if insert_cursor:
            insert_cursor.close()
        if db and db.is_connected():
            db.close()


@cart_bp.route("/confirm-booking/<reference_id>")
def confirm_booking(reference_id):
    db = mysql.connector.connect(**tours_db_config)
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT is_confirmed FROM booking_vouchers WHERE reference_id = %s",
        (reference_id,),
    )
    row = cursor.fetchone()

    if not row:
        return "❌ Invalid booking reference."

    if row["is_confirmed"]:
        return "✅ Already confirmed."

    cursor.execute(
        "UPDATE booking_vouchers SET is_confirmed = TRUE,confirmed_at = NOW()  WHERE reference_id = %s",
        (reference_id,),
    )
    db.commit()
    return "🎉 Booking confirmed!"


@cart_bp.route("/confirm-booking-cart", methods=["PUT"])
def confirm_booking_cart():
    data = request.get_json()
    cart_id = data.get("id")  # ✅ Extract cart ID
    user_id = data.get("user_id")
    item_id = data.get("item_id")
    item_type = data.get("item_type")
    is_confirmed = data.get("is_confirmed", True)  # ✅ Default True if not passed

    if not cart_id or not user_id or not item_id or not item_type:
        return jsonify({"error": "Missing required fields"}), 400

    db = mysql.connector.connect(**tours_db_config)
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE cart 
        SET is_confirmed=%s, confirmed_at=IF(%s=TRUE, NOW(), NULL) 
        WHERE id=%s AND user_id=%s AND item_id=%s AND item_type=%s
        """,
        (is_confirmed, is_confirmed, cart_id, user_id, item_id, item_type),
    )
    db.commit()

    return jsonify({"message": "Updated booking confirmation status."}), 200


@cart_bp.route("/cart", methods=["POST"])
def add_to_cart():
    data = request.get_json()

    user_id = data.get("user_id")
    item_id = data.get("item_id")  # ✅ This comes from items.id
    item_type = data.get("item_type")
    quantity = data.get("quantity", 1)
    selected_date = data.get("selected_date")

    if not all([user_id, item_id, item_type, selected_date]):
        return jsonify({"error": "Missing required fields"}), 400

    db = mysql.connector.connect(**tours_db_config)
    cursor = db.cursor(dictionary=True)

    # ✅ Corrected lookup: match on items.id NOT items.item_id
    cursor.execute(
        """
        SELECT item_id, title, slug, price, vendor_id
        FROM items
        WHERE item_id = %s AND item_type = %s
    """,
        (item_id, item_type),
    )

    item = cursor.fetchone()
    if not item:
        return jsonify({"error": "Item not found"}), 404

    total_price = float(item["price"]) * quantity

    # ✅ Insert into cart
    cursor.execute(
        """
        INSERT INTO cart (user_id, vendor_id, item_type, item_id, item_code, quantity, selected_date, total_price)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """,
        (
            user_id,
            item["vendor_id"],
            item_type,
            item_id,
            item["slug"],
            quantity,
            selected_date,
            total_price,
        ),
    )

    db.commit()

    return (
        jsonify(
            {
                "cart_item": {
                    "item_id": item_id,
                    "item_type": item_type,
                    "quantity": quantity,
                    "selected_date": selected_date,
                    "total_price": total_price,
                },
                "message": "Item added to cart",
            }
        ),
        200,
    )


@cart_bp.route("/cart/<int:user_id>", methods=["GET"])
def get_cart(user_id):
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        # Query from vw_cart_details view
        query = """
            SELECT *
            FROM vw_cart_details
            WHERE user_id = %s;
        """
        cursor.execute(query, (user_id,))
        cart_items = cursor.fetchall()

        return jsonify(cart_items), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if db and db.is_connected():
            db.close()


@cart_bp.route("/cart", methods=["DELETE", "OPTIONS"])
@cross_origin(
    origins=["https://app.tourwise.shop"],
    methods=["DELETE", "OPTIONS"],
    allow_headers="*",
)
def delete_cart_item():
    data = request.get_json()

    required_fields = ["user_id", "vendor_id", "item_type", "item_id"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        conn = mysql.connector.connect(**tours_db_config)
        cursor = conn.cursor()

        query = """
            DELETE FROM cart
            WHERE user_id = %s AND vendor_id = %s AND item_type = %s AND item_id = %s
        """
        values = (
            data["user_id"],
            data["vendor_id"],
            data["item_type"],
            data["item_id"],
        )

        cursor.execute(query, values)
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Item not found"}), 404

        return jsonify({"message": "Item successfully deleted from cart"}), 200

    except Exception as e:
        print(f"Error deleting cart item: {e}")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except BaseException:
            pass


@cart_bp.route("/clear-cart", methods=["DELETE", "OPTIONS"])
@cross_origin(
    origins=["https://app.tourwise.shop"],
    methods=["DELETE", "OPTIONS"],
    allow_headers="*",
)
def clear_cart_item():
    # ✅ Return early for OPTIONS preflight
    if request.method == "OPTIONS":
        return jsonify({"message": "Preflight check successful"}), 200

    try:
        data = request.get_json()  # Get JSON body (must include user_id)
        user_id = data.get("user_id")

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400

        conn = mysql.connector.connect(**tours_db_config)
        cursor = conn.cursor()

        query = """
            DELETE FROM cart 
            WHERE user_id = %s AND is_confirmed = 1
        """
        cursor.execute(query, (user_id,))
        conn.commit()

        return jsonify({"message": "Items successfully deleted from cart"}), 200

    except Exception as e:
        print(f"❌ Error deleting cart item: {e}")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except BaseException:
            pass
