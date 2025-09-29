# bp_hotel_rooms.py
import os, json
from flask import Blueprint, request, jsonify, current_app
import mysql.connector
from dotenv import load_dotenv

rooms_bp = Blueprint("hotel_rooms", __name__)

# ---- Config ---------------------------------------------------------------
env_file = ".env.development" if os.getenv("ROOMS_ENV") == "development" else ".env.production"
load_dotenv(dotenv_path=env_file)

db_config = {
    "host": os.getenv("TOUR_DB_HOST"),
    "user": os.getenv("TOUR_DB_USER"),
    "password": os.getenv("TOUR_DB_PASS"),
    "database": os.getenv("TOUR_DB_NAME"),
    "port": int(os.getenv("TOUR_DB_PORT", "3306")),
}

ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

# ---- Defaults (can be overridden via payload) ------------------------------
DEFAULT_ROOMS = [
    {"room_type": "Standard Room",  "bed_type": "Queen Bed",     "size_sqm": 25,  "occupancy": 2, "description": "Comfortable standard room with basic amenities."},
    {"room_type": "Deluxe Room",    "bed_type": "King Bed",      "size_sqm": 35,  "occupancy": 2, "description": "Spacious deluxe room with premium features."},
    {"room_type": "Superior Room",  "bed_type": "Queen Bed",     "size_sqm": 30,  "occupancy": 2, "description": "Upgraded room with better view or floor."},
    {"room_type": "Executive Room", "bed_type": "King Bed",      "size_sqm": 40,  "occupancy": 2, "description": "Executive perks, often with lounge access."},
    {"room_type": "Suite",          "bed_type": "King Bed",      "size_sqm": 50,  "occupancy": 3, "description": "Suite with living area and premium amenities."},
    {"room_type": "Family Room",    "bed_type": "2 Double Beds", "size_sqm": 45,  "occupancy": 4, "description": "Ideal for families; extra space."},
    {"room_type": "Studio Room",    "bed_type": "Queen Bed",     "size_sqm": 28,  "occupancy": 2, "description": "Open-plan studio layout."},
    {"room_type": "Connecting Room","bed_type": "Varies",        "size_sqm": 50,  "occupancy": 4, "description": "Two rooms with a connecting door."},
    {"room_type": "Twin Room",      "bed_type": "2 Single Beds", "size_sqm": 25,  "occupancy": 2, "description": "Two single beds."},
    {"room_type": "Double Room",    "bed_type": "Double Bed",    "size_sqm": 25,  "occupancy": 2, "description": "One double bed."},
    {"room_type": "Triple Room",    "bed_type": "3 Single Beds", "size_sqm": 35,  "occupancy": 3, "description": "Three separate beds."},
    {"room_type": "Villa",          "bed_type": "King Bed",      "size_sqm": 80,  "occupancy": 4, "description": "Standalone unit; garden/pool access."},
    {"room_type": "Penthouse",      "bed_type": "King Bed",      "size_sqm": 120, "occupancy": 4, "description": "Top-floor panoramic views."},
    {"room_type": "Bungalow",       "bed_type": "King Bed",      "size_sqm": 60,  "occupancy": 3, "description": "Ground-level detached unit."},
    {"room_type": "Dormitory Bed",  "bed_type": "Single Bed",    "size_sqm": 8,   "occupancy": 1, "description": "Hostel-style shared room bed."},
]

def _corsify(resp):
    resp.headers["Access-Control-Allow-Origin"] = ORIGIN
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp

@rooms_bp.route("/rooms/<int:hotel_id>", methods=["GET", "OPTIONS"])
def get_rooms(hotel_id: int):
    if request.method == "OPTIONS":
        return _corsify(jsonify({"message": "Preflight OK"})), 200

    try:
        conn = mysql.connector.connect(**db_config)
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT room_id, hotel_id, room_type, bed_type, size_sqm, occupancy, description
            FROM hotel_rooms
            WHERE hotel_id = %s
            ORDER BY room_type
        """, (hotel_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        resp = jsonify({"hotel_id": hotel_id, "rooms": rows})
        return _corsify(resp), 200
    except Exception as e:
        current_app.logger.exception("GET /rooms failed")
        return _corsify(jsonify({"error": str(e)})), 500

@rooms_bp.route("/rooms/seed/<int:hotel_id>", methods=["POST", "OPTIONS"])
def seed_rooms(hotel_id: int):
    """
    Seeds a hotel with a standard set of room types.
    Idempotent if a UNIQUE (hotel_id, room_type) exists.
    Payload (optional):
    {
      "rooms": [ {room_type, bed_type, size_sqm, occupancy, description}, ... ]  // overrides
    }
    """
    if request.method == "OPTIONS":
        return _corsify(jsonify({"message": "Preflight OK"})), 200

    payload = request.get_json(silent=True) or {}
    rooms = payload.get("rooms") or DEFAULT_ROOMS

    inserted, skipped, errors = 0, 0, []

    try:
        conn = mysql.connector.connect(**db_config)
        cur = conn.cursor()
        sql = """
            INSERT INTO hotel_rooms (hotel_id, room_type, bed_type, size_sqm, occupancy, description)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              bed_type = VALUES(bed_type),
              size_sqm = VALUES(size_sqm),
              occupancy = VALUES(occupancy),
              description = VALUES(description)
        """
        for r in rooms:
            try:
                cur.execute(sql, (
                    hotel_id,
                    r.get("room_type"),
                    r.get("bed_type"),
                    int(r.get("size_sqm")) if r.get("size_sqm") is not None else None,
                    int(r.get("occupancy")) if r.get("occupancy") is not None else None,
                    r.get("description"),
                ))
                # rowcount == 1 on insert, 2 on update (MySQL behavior can vary by connector)
                if cur.rowcount == 1:
                    inserted += 1
                else:
                    skipped += 1  # treat as update/skip for reporting
            except Exception as ex:
                errors.append({"room_type": r.get("room_type"), "error": str(ex)})
        conn.commit()
        cur.close(); conn.close()

        resp = jsonify({
            "hotel_id": hotel_id,
            "inserted": inserted,
            "updated_or_skipped": skipped,
            "errors": errors,
            "total_payload": len(rooms)
        })
        return _corsify(resp), 200
    except Exception as e:
        current_app.logger.exception("POST /rooms/seed failed")
        return _corsify(jsonify({"error": str(e)})), 500
