from flask_cors import cross_origin
import mysql.connector
from datetime import datetime
import requests, time, string
import random
import os
import re
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

from flask import Flask, Blueprint, request, jsonify, current_app
from decimal import Decimal, InvalidOperation


# Define the Blueprint
cart_bp = Blueprint("cart_bp", __name__)

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


# Helper: Generate Reference ID
def generate_reference_id():
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"TW-{timestamp}-{random.randint(100,999)}"


def _valid_email(e: str) -> str | None:
    if not e:
        return None
    e = e.strip()
    # simple format check
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", e):
        return None
    # block placeholders
    bad_domains = {"example.com", "test.com", "example.org"}
    domain = e.split("@")[-1].lower()
    if domain in bad_domains:
        return None
    return e


def send_confirmation_email(to_email: str, reference_id: str, bookings: list) -> bool:
    """
    Sends a plain-text confirmation email. Returns True on success, False on failure.
    Expects each booking item to have 'title', 'quantity', and 'price'.
    """

    # --- Validate config early ---
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    confirm_base = os.getenv("CONFIRM_BASE_URL", "https://api.tourwise.shop")

    if not email_user or not email_pass:
        print("❌ EMAIL_USER/EMAIL_PASS missing in environment.")
        return False

    # --- Defensive totals & lines ---
    items = []
    total = 0.0
    for idx, item in enumerate(bookings or []):
        try:
            title = str(item["title"])
            qty = int(item["quantity"])
            price = float(item["price"])
        except (KeyError, ValueError, TypeError) as e:
            print(f"⚠️ Skipping bad item at index {idx}: {e}")
            continue
        items.append(f"- {title} x {qty}")
        total += price * qty

    # Optional: if nothing valid, bail out
    if not items:
        print("⚠️ No valid booking items to email.")
        return False

    # --- Build message (UTF-8) ---
    total_str = f"{total:,.2f}"
    confirm_link = f"{confirm_base.rstrip('/')}/api/cf/confirm-booking/{reference_id}"

    body = (
        f"✅ Your booking was successful!\n"
        f"Reference ID: {reference_id}\n"
        f"Total: ₱{total_str}\n\n"
        f"🧾 Booked Items:\n" + "\n".join(items) + "\n\n"
        f"🔗 Please confirm your booking by clicking this link:\n"
        f"{confirm_link}\n"
    )

    msg = MIMEText(body, _subtype="plain", _charset="utf-8")
    msg["Subject"] = f"TourWise Booking Confirmation - {reference_id}"
    msg["From"] = email_user                # match authenticated user to avoid DMARC issues
    msg["To"] = to_email

    # --- Send via Gmail SMTP ---
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(email_user, email_pass)
            # Prefer send_message so headers/envelope align
            server.send_message(msg, from_addr=email_user, to_addrs=[to_email])
        print(f"📧 Email sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False


def send_payment_email(to_email: str, reference_id: str, bookings: list, invoice_url: str) -> bool:
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    if not email_user or not email_pass:
        print("❌ EMAIL_USER/EMAIL_PASS missing.")
        return False

    # Build items safely
    lines, total = [], 0.0
    for idx, i in enumerate(bookings or []):
        try:
            title = str(i["title"])
            qty = int(i.get("quantity", 1))
            price = float(i["price"])
        except (KeyError, ValueError, TypeError) as e:
            print(f"⚠️ Skipping bad item at index {idx}: {e}")
            continue
        lines.append(f"- {title} x {qty}")
        total += price * qty

    if not lines:
        print("⚠️ No valid items; not sending payment email.")
        return False

    body = (
        "🧾 Your TourWise booking is created\n\n"
        f"Reference ID: {reference_id}\n"
        f"Total: ₱{total:,.2f}\n\n"
        "Items:\n" + "\n".join(lines) + "\n\n"
        "💳 Pay now to confirm your booking:\n"
        f"{invoice_url}\n\n"
        "If you already paid, you can ignore this email.\n"
    )

    msg = MIMEText(body, _subtype="plain", _charset="utf-8")
    msg["Subject"] = f"Pay now — TourWise booking {reference_id}"
    msg["From"] = email_user         # match authenticated user for SPF/DMARC
    msg["To"] = to_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(email_user, email_pass)
            server.send_message(msg, from_addr=email_user, to_addrs=[to_email])
        print(f"📧 Payment email sent to {to_email}")
        return True
    except Exception as e:
        print("❌ Failed to send payment email:", e)
        return False




def send_paid_receipt_email(to_email: str, reference_id: str, bookings: list, amount) -> bool:
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    success_base = os.getenv("SUCCESS_BASE_URL", "https://tourwise.shop")

    if not email_user or not email_pass:
        print("❌ EMAIL_USER/EMAIL_PASS missing.")
        return False

    # Validate/format amount safely
    try:
        amount_val = float(amount)
    except (TypeError, ValueError):
        print(f"❌ Invalid amount: {amount}")
        return False

    # Optional item lines
    lines = []
    for idx, i in enumerate(bookings or []):
        try:
            title = str(i["title"])
            qty = int(i.get("quantity", 1))
        except (KeyError, ValueError, TypeError) as e:
            print(f"⚠️ Skipping bad item at index {idx}: {e}")
            continue
        lines.append(f"- {title} x {qty}")

    items_block = ("\n\nItems:\n" + "\n".join(lines)) if lines else ""

    success_link = f"{success_base.rstrip('/')}/booking/success?ref={reference_id}"

    body = (
        "✅ Payment received\n\n"
        f"Reference ID: {reference_id}\n"
        f"Amount paid: ₱{amount_val:,.2f}\n"
        f"{items_block}\n\n"
        "Your booking is confirmed. View details:\n"
        f"{success_link}\n"
    )

    msg = MIMEText(body, _subtype="plain", _charset="utf-8")
    msg["Subject"] = f"Booking confirmed — {reference_id}"
    msg["From"] = email_user        # match authenticated sender
    msg["To"] = to_email

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(email_user, email_pass)
            server.send_message(msg, from_addr=email_user, to_addrs=[to_email])
        print(f"📧 Receipt email sent to {to_email}")
        return True
    except Exception as e:
        print("❌ Failed to send receipt email:", e)
        return False





# ✅ Route: Book Cart
# @cart_bp.route("/book-cart", methods=["POST"])
# def book_cart():
#     data = request.get_json()
#     reference_id = data.get("reference_id") or generate_reference_id()
#     user_id = data.get("user_id")
#     bookings = data.get("bookings", [])  # [{title, price, quantity}, ...]

#     db = cursor = insert_cursor = None

    

#     try:
#         db = mysql.connector.connect(**tours_db_config)
#         cursor = db.cursor(dictionary=True)

#              # 1) Get user email
#         cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
#         user_row = cursor.fetchone()

#         if not user_row:
#             return jsonify({"error": "❌ Invalid user_id, email not found."}), 400

#         db_email = user_row["email"]
#         req_email = (data.get("email") or "").strip()

#         # validate
#         email = _valid_email(req_email) or _valid_email(db_email)
#         if not email:
#             return jsonify({"error": "❌ A valid email is required"}), 400

#         # optional: update DB if request email is valid and different
#         if _valid_email(req_email) and req_email != db_email:
#             cursor.execute("UPDATE users SET email=%s WHERE id=%s", (req_email, user_id))
#             db.commit()
#             email = req_email

#         cursor.close()


#         if not bookings:
#             return jsonify({"error": "No bookings provided"}), 400

#         # 2) Insert cart_bookings rows
#         insert_cursor = db.cursor()
#         for item in bookings:
#             insert_cursor.execute(
#                 """
#                 INSERT INTO cart_bookings (reference_id, user_id, email, title, price, quantity)
#                 VALUES (%s, %s, %s, %s, %s, %s)
#                 """,
#                 (reference_id, user_id, email, item["title"], item["price"], item["quantity"]),
#             )
#         db.commit()
#         insert_cursor.close()

#         # --- 3) Create Xendit invoice (NEW) ---
#         # Compute total amount from your bookings payload
#         amount_total = sum(int(round(float(i["price"]))) * int(i.get("quantity", 1)) for i in bookings)

#         if amount_total <= 0:
#             return jsonify({"error": "Amount must be greater than 0"}), 400

#         payload = {
#             "external_id": reference_id,  # critical mapping
#             "amount": amount_total,       # integer PHP amount
#             "currency": "PHP",
#             "description": bookings[0]["title"] if bookings else f"TourWise Booking {reference_id}",
#             "success_redirect_url": f"{FRONTEND_BASE_URL}/booking/success?ref={reference_id}",
#             "failure_redirect_url": f"{FRONTEND_BASE_URL}/booking/failed?ref={reference_id}",
#             "customer": {"email": email},
#             "items": [
#                 {"name": it["title"], "quantity": int(it.get("quantity", 1)), "price": int(round(float(it["price"])))}
#                 for it in bookings
#             ],
#             # Optionally narrow methods:
#             # "payment_methods": ["GCASH","GRABPAY","CARD","BPI","BDO"]
#         }

#         current_app.logger.info("book-cart: ref=%s user=%s email=%s amount=%s", reference_id, user_id, email, amount_total)

#         try:
#             if not XENDIT_SECRET_KEY:
#                 return jsonify({"error": "Server misconfig: XENDIT_SECRET_KEY missing"}), 500

#             r = requests.post(
#                 "https://api.xendit.co/v2/invoices",
#                 auth=_xendit_auth(),
#                 headers=_xendit_headers(),
#                 json=payload,
#                 timeout=20,
#             )
#             if r.status_code == 409:
#                 # invoice already exists for this external_id — fetch & reuse
#                 q = requests.get(
#                     f"https://api.xendit.co/v2/invoices?external_id={reference_id}",
#                     auth=_xendit_auth(),
#                     headers=_xendit_headers(),
#                     timeout=20,
#                 )
#                 q.raise_for_status()
#                 data_q = q.json()
#                 invoice = data_q.get("data")[0] if isinstance(data_q, dict) and "data" in data_q else (
#                     data_q[0] if isinstance(data_q, list) and data_q else data_q
#                 )
#             else:
#                 r.raise_for_status()
#                 invoice = r.json()
#         except requests.HTTPError as e:
#             return jsonify({"error": f"Xendit error: {e.response.text}"}), 502
#         except Exception as e:
#             return jsonify({"error": f"Xendit request failed: {str(e)}"}), 502

#         # --- 4) (Optional) send email AFTER payment; keep disabled for now ---
#         # send_confirmation_email(email, reference_id, bookings)
#         # after invoice = r.json() (or the 409 reuse branch)
#         invoice_url = invoice.get("invoice_url") or invoice.get("checkout_url")
#         send_payment_email(email, reference_id, bookings, invoice_url)

#         return jsonify({
#             "message": "Cart booking saved.",
#             "reference_id": reference_id,
#             "invoice_id": invoice.get("id"),
#             "status": invoice.get("status"),
#             "invoice_url": invoice_url,
#         }), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#     finally:
#         try:
#             if insert_cursor: insert_cursor.close()
#         except: pass
#         try:
#             if cursor: cursor.close()
#         except: pass
#         try:
#             if db and db.is_connected(): db.close()
#         except: pass

@cart_bp.route("/book-cart", methods=["POST"])
def book_cart():
    data = request.get_json()
    reference_id = data.get("reference_id") or generate_reference_id()
    user_id = data.get("user_id")
    bookings = data.get("bookings", [])  # [{title, price, quantity}, ...]

    db = cursor = insert_cursor = None

    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

        # 1) Get user email
        cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user_row = cursor.fetchone()

        if not user_row:
            return jsonify({"error": "❌ Invalid user_id, email not found."}), 400

        db_email = user_row["email"]
        req_email = (data.get("email") or "").strip()

        # validate
        email = _valid_email(req_email) or _valid_email(db_email)
        if not email:
            return jsonify({"error": "❌ A valid email is required"}), 400

        # optional: update DB if request email is valid and different
        if _valid_email(req_email) and req_email != db_email:
            cursor.execute("UPDATE users SET email=%s WHERE id=%s", (req_email, user_id))
            db.commit()
            email = req_email

        # explicit close (avoid holding cursor longer than needed)
        cursor.close()
        cursor = None  # ✅ prevent double-close in finally

        if not bookings:
            return jsonify({"error": "No bookings provided"}), 400

        # 2) Insert cart_bookings rows
        insert_cursor = db.cursor()
        for item in bookings:
            insert_cursor.execute(
                """
                INSERT INTO cart_bookings (reference_id, user_id, email, title, price, quantity)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (reference_id, user_id, email, item["title"], item["price"], item["quantity"]),
            )
        db.commit()
        insert_cursor.close()
        insert_cursor = None  # ✅ prevent double-close in finally

        # --- 3) Create Xendit invoice (NEW) ---
        amount_total = sum(int(round(float(i["price"]))) * int(i.get("quantity", 1)) for i in bookings)

        if amount_total <= 0:
            return jsonify({"error": "Amount must be greater than 0"}), 400

        payload = {
            "external_id": reference_id,  # critical mapping
            "amount": amount_total,       # integer PHP amount
            "currency": "PHP",
            "description": bookings[0]["title"] if bookings else f"TourWise Booking {reference_id}",
            "success_redirect_url": f"{FRONTEND_BASE_URL}/booking/success?ref={reference_id}",
            "failure_redirect_url": f"{FRONTEND_BASE_URL}/booking/failed?ref={reference_id}",
            "customer": {"email": email},
            "items": [
                {"name": it["title"], "quantity": int(it.get("quantity", 1)), "price": int(round(float(it["price"])))}
                for it in bookings
            ],
        }

        current_app.logger.info("book-cart: ref=%s user=%s email=%s amount=%s", reference_id, user_id, email, amount_total)

        try:
            if not XENDIT_SECRET_KEY:
                return jsonify({"error": "Server misconfig: XENDIT_SECRET_KEY missing"}), 500

            r = requests.post(
                "https://api.xendit.co/v2/invoices",
                auth=_xendit_auth(),
                headers=_xendit_headers(),
                json=payload,
                timeout=20,
            )
            if r.status_code == 409:
                # invoice already exists for this external_id — fetch & reuse
                q = requests.get(
                    f"https://api.xendit.co/v2/invoices?external_id={reference_id}",
                    auth=_xendit_auth(),
                    headers=_xendit_headers(),
                    timeout=20,
                )
                q.raise_for_status()
                data_q = q.json()
                invoice = data_q.get("data")[0] if isinstance(data_q, dict) and "data" in data_q else (
                    data_q[0] if isinstance(data_q, list) and data_q else data_q
                )
            else:
                r.raise_for_status()
                invoice = r.json()
        except requests.HTTPError as e:
            return jsonify({"error": f"Xendit error: {e.response.text}"}), 502
        except Exception as e:
            return jsonify({"error": f"Xendit request failed: {str(e)}"}), 502

        # --- 4) Send payment email ---
        invoice_url = invoice.get("invoice_url") or invoice.get("checkout_url")
        send_payment_email(email, reference_id, bookings, invoice_url)

        return jsonify({
            "message": "Cart booking saved.",
            "reference_id": reference_id,
            "invoice_id": invoice.get("id"),
            "status": invoice.get("status"),
            "invoice_url": invoice_url,
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # ✅ guaranteed cleanup even on early returns
        try:
            if insert_cursor:
                insert_cursor.close()
        except Exception:
            pass
        try:
            if cursor:
                cursor.close()
        except Exception:
            pass
        try:
            if db and db.is_connected():
                db.close()
        except Exception:
            pass


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

    cursor.close()

    db.commit()
    db.close()
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

    cursor.close()

    db.commit()
    db.close()

    return jsonify({"message": "Updated booking confirmation status."}), 200



# (You can import this later once things are stable)
# from mysql.connector import Error as MySQLError

@cart_bp.route("/cart", methods=["POST", "OPTIONS"])
def add_to_cart():
    if request.method == "OPTIONS":
        return "", 204

    db = cur = None
    try:
        payload = request.get_json(silent=True) or {}

        required = ["user_id", "item_type", "item_id", "quantity", "total_price"]
        missing = [k for k in required if payload.get(k) in (None, "", [])]
        if missing:
            return jsonify({"ok": False, "error": f"Missing fields: {', '.join(missing)}"}), 400

        user_id = int(payload["user_id"])
        item_type = str(payload["item_type"])
        item_id = int(payload["item_id"])
        quantity = int(payload.get("quantity", 1))

        try:
            total_price = Decimal(str(payload.get("total_price", 0)))
        except InvalidOperation:
            return jsonify({"ok": False, "error": "total_price must be a number"}), 400

        item_code = payload.get("item_code")
        selected_date = payload.get("selected_date")
        if selected_date:
            try:
                selected_date = datetime.strptime(selected_date, "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"ok": False, "error": "selected_date must be YYYY-MM-DD"}), 400
        else:
            selected_date = None

        db = mysql.connector.connect(**tours_db_config)
        cur = db.cursor()

        # Guard via items table (NOTE: item_id, not id)
        cur.execute(
            """
            INSERT INTO cart (user_id, vendor_id, item_type, item_id, item_code, quantity, selected_date, total_price)
            SELECT %s, i.vendor_id, %s, i.item_id, %s, %s, %s, %s
            FROM items i
            WHERE i.item_id = %s AND i.item_type = %s
            """,
            (user_id, item_type, item_code, quantity, selected_date, total_price, item_id, item_type),
        )
        if cur.rowcount == 0:
            return jsonify({"ok": False, "error": "Item not found"}), 404

        db.commit()
        return jsonify({"ok": True, "id": cur.lastrowid}), 201

    except Exception as e:
        current_app.logger.exception("add_to_cart failed")
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        try:
            if cur: cur.close()
            if db: db.close()
        except Exception:
            pass


# @cart_bp.route("/cart/<int:user_id>", methods=["GET"])
# def get_cart(user_id):
#     try:
#         db = mysql.connector.connect(**tours_db_config)
#         cursor = db.cursor(dictionary=True)

#         # Query from vw_cart_details view
#         query = """
#             SELECT *
#             FROM vw_cart_details
#             WHERE user_id = %s;
#         """
#         cursor.execute(query, (user_id,))
#         cart_items = cursor.fetchall()

#         return jsonify(cart_items), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

#     finally:
#         if cursor:
#             cursor.close()
#         if db and db.is_connected():
#             db.close()

@cart_bp.route("/cart/<int:user_id>", methods=["GET"])
def get_cart(user_id):
    db = cursor = None  # ✅ ensure defined for finally
    try:
        db = mysql.connector.connect(**tours_db_config)
        cursor = db.cursor(dictionary=True)

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
        try:
            if cursor:
                cursor.close()
        except Exception:
            pass
        try:
            if db and db.is_connected():
                db.close()
        except Exception:
            pass




@cart_bp.route("/cart", methods=["DELETE", "OPTIONS"])
def delete_cart_item():
    if request.method == "OPTIONS":
        # Preflight CORS response
        response = jsonify({"status": "ok"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3001")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response, 200

    # Handle actual DELETE request
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
        cursor.execute(query, (
            data["user_id"],
            data["vendor_id"],
            data["item_type"],
            data["item_id"]
        ))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"error": "Item not found"}), 404

        response = jsonify({"message": "Item successfully deleted from cart"})
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3001")
        return response, 200

    except Exception as e:
        print(f"Error deleting cart item: {e}")
        return jsonify({"error": "Internal server error"}), 500

    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass


@cart_bp.route("/clear-cart", methods=["DELETE", "OPTIONS"])
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


# --- App / Xendit config ---
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
XENDIT_SECRET_KEY = os.getenv("XENDIT_SECRET_KEY")  

# Helpers
def _ref():
    # TW-YYYYMMDDHHMMSS-rand
    ts = time.strftime("%Y%m%d%H%M%S")
    suffix = "".join(random.choices(string.digits, k=3))
    return f"TW-{ts}-{suffix}"

def _xendit_auth():
    return (XENDIT_SECRET_KEY, "")

def _xendit_headers():
    return {"Content-Type": "application/json"}
