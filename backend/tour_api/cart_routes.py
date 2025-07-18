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


@cart_bp.route("/cart", methods=["POST"])
def add_to_cart():
    data = request.get_json()
    item_type = data["item_type"]
    item_id = data["item_id"]
    quantity = data.get("quantity", 1)
    user_id = data.get("user_id")

    # Determine DB and table based on item_type
    db_map = {
        "tour": {"db": tours_db_config, "table": "tours"},
        "hotel": {"db": hotels_db_config, "table": "hotels"},
        "car": {"db": cars_db_config, "table": "cars"},
    }

    if item_type not in db_map:
        return jsonify({"error": "Invalid item type"}), 400

    try:
        # ✅ Single connection
        db = mysql.connector.connect(**db_map[item_type]["db"])
        lookup_cursor = db.cursor()
        insert_cursor = db.cursor()

        table = db_map[item_type]["table"]

        # ✅ Lookup item
        lookup_cursor.execute(
            f"SELECT price, slug, vendor_id FROM {table} WHERE id = %s", (item_id,)
        )
        result = lookup_cursor.fetchone()

        if not result:
            return jsonify({"error": "Item not found"}), 404

        price, slug, vendor_id = result
        total_price = float(price) * quantity

        # ✅ Check if item already in cart
        insert_cursor.execute(
            """
            SELECT id, quantity FROM cart WHERE user_id = %s AND item_type = %s AND item_id = %s
        """,
            (user_id, item_type, item_id),
        )
        existing = insert_cursor.fetchone()

        if existing:
            new_quantity = existing[1] + quantity
            insert_cursor.execute(
                """
                UPDATE cart SET quantity = %s, total_price = %s WHERE id = %s
            """,
                (new_quantity, float(price) * new_quantity, existing[0]),
            )
        else:
            insert_cursor.execute(
                """
                INSERT INTO cart (user_id, item_type, item_id, item_code, quantity, total_price, vendor_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
                (user_id, item_type, item_id, slug, quantity, total_price, vendor_id),
            )

        db.commit()
        return jsonify({"message": "Item added to cart", "total_price": total_price})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            lookup_cursor.close()
            insert_cursor.close()
            db.close()
        except BaseException:
            pass


@cart_bp.route("/cart/<int:user_id>", methods=["GET"])
def get_cart(user_id):
    try:
        # Get DB names from .env
        tour_db = os.getenv("TOUR_DB_NAME")
        hotel_db = os.getenv("HOTEL_DB_NAME")
        car_db = os.getenv("CAR_DB_NAME")

        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        query = f"""
            SELECT
                {tour_db}.cart.id,
                {tour_db}.cart.user_id,
                {tour_db}.cart.vendor_id,
                {tour_db}.cart.item_type,
                {tour_db}.cart.item_id,
                {tour_db}.cart.item_code,
                {tour_db}.cart.quantity,
                {tour_db}.cart.total_price,
                {tour_db}.cart.created_at,

                -- Tour fields
                {tour_db}.tours.title AS tour_title,
                {tour_db}.tours.image AS tour_image,
                {tour_db}.tours.price AS tour_price,

                -- Hotel fields
                {hotel_db}.hotels.name AS hotel_name,
                {hotel_db}.hotels.card_image AS hotel_image,
                {hotel_db}.hotels.price AS hotel_price,

                -- Car fields
                {car_db}.cars.model AS car_model,
                {car_db}.cars.card_image AS car_image,
                {car_db}.cars.price_per_day AS car_price

            FROM {tour_db}.cart

            LEFT JOIN {tour_db}.tours
                ON {tour_db}.cart.item_type = 'tour' AND {tour_db}.cart.item_id = {tour_db}.tours.id

            LEFT JOIN {hotel_db}.hotels
                ON {tour_db}.cart.item_type = 'hotel' AND {tour_db}.cart.item_id = {hotel_db}.hotels.hotel_id

            LEFT JOIN {car_db}.cars
                ON {tour_db}.cart.item_type = 'car' AND {tour_db}.cart.item_id = {car_db}.cars.car_id

            WHERE {tour_db}.cart.user_id = %s;
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


@cart_bp.route("/cart", methods=["DELETE"])
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


@cart_bp.route("/clear-cart", methods=["DELETE"])
def clear_cart_item():

    try:
        conn = mysql.connector.connect(**tours_db_config)
        cursor = conn.cursor()

        query = """
            DELETE FROM cart
        """
        cursor.execute(query)
        conn.commit()

        return jsonify({"message": "Items successfully deleted from cart"}), 200

    except Exception as e:
        print(f"Error deleting cart item: {e}")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except BaseException:
            pass
