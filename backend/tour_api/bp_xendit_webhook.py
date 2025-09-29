# bp_xendit_webhook.py
import os, json, logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv
import mysql.connector

# ✅ Load environment variables from .env.tours (or .env.development)
env_file = ".env.development" if os.getenv("APP_ENV") == "development" else ".env.tours"
load_dotenv(dotenv_path=env_file)

# ✅ DB config from environment
tours_db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": int(os.getenv("TOUR_DB_PORT", "3306")),
}

# ✅ Xendit token
XENDIT_CALLBACK_TOKEN = (os.getenv("XENDIT_CALLBACK_TOKEN") or "").strip()

bp_xendit = Blueprint("xendit", __name__)

logger = logging.getLogger("xendit")
if not logger.handlers:
    logger.setLevel(logging.INFO)
    h = logging.StreamHandler()
    logger.addHandler(h)

def _db():
    return mysql.connector.connect(**tours_db_config)

@bp_xendit.route("/xendit/webhook", methods=["POST"])
def xendit_webhook():
    # 1) Verify token
    header_token = (request.headers.get("x-callback-token") or "").strip()
    if not header_token or header_token != XENDIT_CALLBACK_TOKEN:
        return jsonify({"error": "Forbidden"}), 403

    # 2) Parse payload
    payload = request.get_json(silent=True) or {}
    event = (payload.get("event") or payload.get("status") or "").upper()
    external_id = payload.get("external_id")

    logger.info("Webhook OK: event=%s external_id=%s", event, external_id)

    # 3) Update cart_bookings directly
    try:
        conn = _db()
        # use ONE dictionary cursor for everything here
        cur = conn.cursor(dictionary=True)

        if event in ("INVOICE.PAID", "PAID"):
            # 1) mark confirmed
            cur.execute("""
                UPDATE cart_bookings
                SET is_confirmed = 1, confirmed_at = %s
                WHERE reference_id = %s
            """, (datetime.utcnow(), external_id))
            conn.commit()
            logger.info("Marked cart_booking %s as confirmed (rows=%s)", external_id, cur.rowcount)

            # 2) fetch email + items for receipt
            cur.execute("""
                SELECT email
                FROM cart_bookings
                WHERE reference_id = %s
                ORDER BY id DESC
                LIMIT 1
            """, (external_id,))
            row = cur.fetchone()

            cur.execute("""
                SELECT title, price, quantity
                FROM cart_bookings
                WHERE reference_id = %s
            """, (external_id,))
            items = cur.fetchall()

            if row and row.get("email"):
                # ensure amount is numeric
                amt = float(amount) if amount is not None else 0.0
                send_paid_receipt_email(row["email"], external_id, items or [], amt)

        elif event in ("INVOICE.EXPIRED", "EXPIRED"):
            # optional: reflect expiry in your table
            cur.execute("""
                UPDATE cart_bookings
                SET is_confirmed = 0
                WHERE reference_id = %s
            """, (external_id,))
            conn.commit()
            logger.info("Marked cart_booking %s as expired (rows=%s)", external_id, cur.rowcount)

    except Exception as e:
        logger.exception("Error processing webhook: %s", e)
        return jsonify({"status": "received-with-errors"}), 200
    finally:
        try:
            if cur: cur.close()
            if conn: conn.close()
        except Exception:
            pass
